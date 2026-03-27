import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Track } from '../types';
import { ForegroundService } from '@capawesome-team/capacitor-android-foreground-service';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { NativeAudio } from '@capgo/native-audio';
import { getStreamUrl } from '../services/piped';

interface PlayerContextType {
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isShuffle: boolean;
  repeatMode: 'off' | 'all' | 'one';
  playTrack: (track: Track, queue?: Track[]) => void;
  pause: () => void;
  resume: () => void;
  next: () => void;
  prev: () => void;
  setVolume: (volume: number) => void;
  seek: (time: number) => void;
  playNext: (track: Track) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  isNowPlayingOpen: boolean;
  setIsNowPlayingOpen: (open: boolean) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState(false);
  const [isBackground, setIsBackground] = useState(false);

  const playerRef = useRef<any>(null);
  const timeUpdateIntervalRef = useRef<number | null>(null);
  const isTransitioningRef = useRef(false);
  const nativeAssetIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Configure Native Audio for Background Playback
    if (Capacitor.getPlatform() === 'android') {
      NativeAudio.configure({
        backgroundPlayback: true,
        showNotification: true,
        focus: true
      });
    }

    // Listen for App State changes (Background/Foreground)
    const appStateListener = App.addListener('appStateChange', ({ isActive }) => {
      setIsBackground(!isActive);
    });

    // Load YouTube Iframe API
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        initPlayer();
      };
    } else {
      initPlayer();
    }

    function initPlayer() {
      const playerDiv = document.createElement('div');
      playerDiv.id = 'youtube-player-container';
      playerDiv.style.position = 'fixed';
      playerDiv.style.bottom = 'env(safe-area-inset-bottom, 0px)';
      playerDiv.style.right = '0';
      playerDiv.style.width = '1px';
      playerDiv.style.height = '1px';
      playerDiv.style.opacity = '0.01';
      playerDiv.style.pointerEvents = 'none';
      playerDiv.style.zIndex = '-1';
      document.body.appendChild(playerDiv);

      playerRef.current = new window.YT.Player('youtube-player-container', {
        height: '200',
        width: '200',
        videoId: '',
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          playsinline: 1,
          origin: window.location.origin
        },
        events: {
          onReady: (event: any) => {
            event.target.setVolume(volume * 100);
          },
          onStateChange: (event: any) => {
            if (isBackground || isTransitioningRef.current) return;

            if (event.data === 1) {
              setIsPlaying(true);
              setIsLoading(false);
              setDuration(event.target.getDuration());
              startProgressTimer();
            } else if (event.data === 2) {
              setIsPlaying(false);
              stopProgressTimer();
            } else if (event.data === 3) {
              setIsLoading(true);
            } else if (event.data === 0) {
              setIsPlaying(false);
              stopProgressTimer();
              handleEnded();
            } else if (event.data === -1) {
              event.target.playVideo();
            }
          },
          onError: (event: any) => {
            console.error('YouTube Player Error:', event.data);
            setIsLoading(false);
            if (!isBackground) handleEnded();
          }
        }
      });
    }

    return () => {
      stopProgressTimer();
      appStateListener.then(l => l.remove());
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
      }
      if (nativeAssetIdRef.current) {
        NativeAudio.stop({ assetId: nativeAssetIdRef.current });
        NativeAudio.unload({ assetId: nativeAssetIdRef.current });
        nativeAssetIdRef.current = null;
      }
      const container = document.getElementById('youtube-player-container');
      if (container) container.remove();
      stopForegroundService();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle Background Transition
  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android' || !currentTrack) return;

    const handleTransition = async () => {
      if (isBackground && isPlaying) {
        // Switching to Background: Start Native Audio
        try {
          isTransitioningRef.current = true;
          const streamUrl = await getStreamUrl(currentTrack.id);
          const time = playerRef.current?.getCurrentTime() || currentTime;

          nativeAssetIdRef.current = currentTrack.id;

          await NativeAudio.preload({
            assetId: currentTrack.id,
            assetPath: streamUrl,
            isUrl: true,
            volume: volume,
            notificationMetadata: {
              title: currentTrack.title,
              artist: currentTrack.artist,
              artworkUrl: currentTrack.thumbnail
            }
          });

          await NativeAudio.play({
            assetId: currentTrack.id,
            time: time
          });

          // Pause YouTube only after native starts to avoid silence
          if (playerRef.current?.pauseVideo) playerRef.current.pauseVideo();
        } catch (e) {
          console.error('Background transition failed:', e);
        } finally {
          isTransitioningRef.current = false;
        }
      } else if (!isBackground && isPlaying) {
        // Returning to Foreground: Start YouTube
        if (playerRef.current?.playVideo) {
          try {
            let time = currentTime;
            if (nativeAssetIdRef.current) {
              const res = await NativeAudio.getCurrentTime({ assetId: nativeAssetIdRef.current });
              time = res.currentTime;
              await NativeAudio.stop({ assetId: nativeAssetIdRef.current });
              await NativeAudio.unload({ assetId: nativeAssetIdRef.current });
              nativeAssetIdRef.current = null;
            }
            playerRef.current.seekTo(time, true);
            playerRef.current.playVideo();
          } catch (e) {
            console.error('Foreground transition failed:', e);
            playerRef.current.playVideo();
          }
        }
      }
    };

    handleTransition();
  }, [isBackground]);

  const startForegroundService = async () => {
    try {
      if (Capacitor.getPlatform() !== 'android') return;

      const perm = await ForegroundService.checkPermissions();
      if (perm.display !== 'granted') {
        await ForegroundService.requestPermissions();
      }

      if (currentTrack) {
        await ForegroundService.startForegroundService({
          id: 12345,
          title: currentTrack.title,
          body: currentTrack.artist,
          smallIcon: 'ic_launcher',
          // @ts-ignore
          serviceType: 2,
        });
      }
    } catch (e) {
      console.error('Failed to start foreground service:', e);
    }
  };

  const stopForegroundService = async () => {
    try {
      if (Capacitor.getPlatform() === 'android') {
        await ForegroundService.stopForegroundService();
      }
    } catch (e) {
      console.error('Failed to stop foreground service:', e);
    }
  };

  // Sync Media Session and Foreground Service
  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        artwork: [
          { src: currentTrack.thumbnail, sizes: '512x512', type: 'image/jpeg' }
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => resume());
      navigator.mediaSession.setActionHandler('pause', () => pause());
      navigator.mediaSession.setActionHandler('previoustrack', () => prev());
      navigator.mediaSession.setActionHandler('nexttrack', () => next());
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) seek(details.seekTime);
      });
    }

    if (isPlaying) {
      startForegroundService();
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
    } else {
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
    }
  }, [currentTrack, isPlaying]);

  const startProgressTimer = () => {
    stopProgressTimer();
    timeUpdateIntervalRef.current = window.setInterval(async () => {
      let time = 0;
      let dur = duration;

      if (isBackground && nativeAssetIdRef.current) {
        try {
          const res = await NativeAudio.getCurrentTime({ assetId: nativeAssetIdRef.current });
          const durRes = await NativeAudio.getDuration({ assetId: nativeAssetIdRef.current });
          time = res.currentTime;
          dur = durRes.duration;
        } catch (e) {
          console.error('Failed to get native time:', e);
        }
      } else if (playerRef.current && playerRef.current.getCurrentTime) {
        time = playerRef.current.getCurrentTime();
        dur = playerRef.current.getDuration();
      }

      if (time > 0) {
        setCurrentTime(time);
        setDuration(dur);

        if ('mediaSession' in navigator) {
          navigator.mediaSession.setPositionState({
            duration: dur || 0,
            playbackRate: 1,
            position: time
          });
        }
      }
    }, 500);
  };

  const stopProgressTimer = () => {
    if (timeUpdateIntervalRef.current) {
      clearInterval(timeUpdateIntervalRef.current);
      timeUpdateIntervalRef.current = null;
    }
  };

  const handleEnded = async () => {
    if (nativeAssetIdRef.current) {
      await NativeAudio.stop({ assetId: nativeAssetIdRef.current });
      await NativeAudio.unload({ assetId: nativeAssetIdRef.current });
      nativeAssetIdRef.current = null;
    }
    document.dispatchEvent(new CustomEvent('trackEnded'));
  };

  useEffect(() => {
    const onTrackEnded = () => {
      if (repeatMode === 'one') {
        seek(0);
        resume();
      } else {
        next();
      }
    };
    document.addEventListener('trackEnded', onTrackEnded);
    return () => document.removeEventListener('trackEnded', onTrackEnded);
  }, [currentTrack, queue, repeatMode, isShuffle, isBackground]); // Re-bind when state changes

  const playTrack = async (track: Track, newQueue?: Track[]) => {
    if (newQueue) setQueue(newQueue);
    setCurrentTrack(track);
    setIsLoading(true);
    setIsPlaying(false);
    setCurrentTime(0);

    // Reset native audio
    if (nativeAssetIdRef.current) {
      await NativeAudio.stop({ assetId: nativeAssetIdRef.current });
      await NativeAudio.unload({ assetId: nativeAssetIdRef.current });
      nativeAssetIdRef.current = null;
    }

    try {
      if (isBackground && Capacitor.getPlatform() === 'android') {
        // If playing while already in background, use native immediately
        const streamUrl = await getStreamUrl(track.id);
        nativeAssetIdRef.current = track.id;
        await NativeAudio.preload({
          assetId: track.id,
          assetPath: streamUrl,
          isUrl: true,
          volume: volume,
          notificationMetadata: {
            title: track.title,
            artist: track.artist,
            artworkUrl: track.thumbnail
          }
        });
        await NativeAudio.play({ assetId: track.id });
        setIsPlaying(true);
        setIsLoading(false);
      } else if (playerRef.current && playerRef.current.loadVideoById) {
        playerRef.current.loadVideoById(track.id);
      } else {
        // Player not ready yet, wait a bit
        setTimeout(() => {
          if (playerRef.current && playerRef.current.loadVideoById) {
            playerRef.current.loadVideoById(track.id);
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to play track:', error);
      setIsLoading(false);
    }
  };

  const pause = async () => {
    if (isBackground && nativeAssetIdRef.current) {
      await NativeAudio.pause({ assetId: nativeAssetIdRef.current });
      setIsPlaying(false);
    } else if (playerRef.current && playerRef.current.pauseVideo) {
      playerRef.current.pauseVideo();
    }
    stopForegroundService();
  };

  const resume = async () => {
    if (isBackground && nativeAssetIdRef.current) {
      await NativeAudio.resume({ assetId: nativeAssetIdRef.current });
      setIsPlaying(true);
    } else if (playerRef.current && playerRef.current.playVideo) {
      playerRef.current.playVideo();
    }
    startForegroundService();
  };

  const next = () => {
    if (!currentTrack || queue.length === 0) return;
    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);

    if (isShuffle) {
      let nextIndex = Math.floor(Math.random() * queue.length);
      if (nextIndex === currentIndex && queue.length > 1) {
        nextIndex = (nextIndex + 1) % queue.length;
      }
      playTrack(queue[nextIndex]);
    } else {
      if (currentIndex !== -1 && currentIndex < queue.length - 1) {
        playTrack(queue[currentIndex + 1]);
      } else if (repeatMode === 'all') {
        playTrack(queue[0]);
      }
    }
  };

  const prev = () => {
    if (!currentTrack || queue.length === 0) return;
    if (currentTime > 3) {
      seek(0);
      return;
    }
    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
    if (currentIndex > 0) {
      playTrack(queue[currentIndex - 1]);
    } else if (repeatMode === 'all') {
      playTrack(queue[queue.length - 1]);
    }
  };

  const playNextItem = (track: Track) => {
    if (queue.length === 0) {
      playTrack(track, [track]);
      return;
    }
    const currentIndex = currentTrack ? queue.findIndex(t => t.id === currentTrack.id) : -1;
    const newQueue = [...queue];
    if (currentIndex !== -1) {
      newQueue.splice(currentIndex + 1, 0, track);
    } else {
      newQueue.push(track);
    }
    setQueue(newQueue);
  };

  const setVolume = async (vol: number) => {
    setVolumeState(vol);
    if (nativeAssetIdRef.current) {
      await NativeAudio.setVolume({ assetId: nativeAssetIdRef.current, volume: vol });
    }
    if (playerRef.current && playerRef.current.setVolume) {
      playerRef.current.setVolume(vol * 100);
    }
  };

  const seek = async (time: number) => {
    if (isBackground && nativeAssetIdRef.current) {
      await NativeAudio.setCurrentTime({ assetId: nativeAssetIdRef.current, time: time });
      setCurrentTime(time);
    } else if (playerRef.current && playerRef.current.seekTo) {
      playerRef.current.seekTo(time, true);
      setCurrentTime(time);
    }
  };

  const toggleShuffle = () => setIsShuffle(prev => !prev);
  const toggleRepeat = () => {
    setRepeatMode(prev => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  };

  return (
    <PlayerContext.Provider value={{
      currentTrack, queue, isPlaying, isLoading, currentTime, duration, volume,
      isShuffle, repeatMode,
      playTrack, pause, resume, next, prev, setVolume, seek, playNext: playNextItem,
      toggleShuffle, toggleRepeat,
      isNowPlayingOpen, setIsNowPlayingOpen
    }}>
      {children}
    </PlayerContext.Provider>
  );
}

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used within PlayerProvider');
  return context;
};
