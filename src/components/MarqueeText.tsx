import React, { useRef, useState, useEffect, ReactNode } from 'react';

interface MarqueeTextProps {
    children: ReactNode;
    className?: string;
    speed?: number; // pixels per second
    pauseOnHover?: boolean;
}

/**
 * A "radio-style" marquee component that automatically scrolls its content
 * if it exceeds the container's width.
 */
export default function MarqueeText({ children, className = "", speed = 40, pauseOnHover = true }: MarqueeTextProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);
    const [shouldScroll, setShouldScroll] = useState(false);
    const [duration, setDuration] = useState(10);

    useEffect(() => {
        const checkOverflow = () => {
            if (containerRef.current && textRef.current) {
                // Use scrollWidth to get the full content width
                // Add a small buffer (1px) for sub-pixel differences
                const isOverflowing = textRef.current.scrollWidth > containerRef.current.clientWidth + 1;
                setShouldScroll(isOverflowing);

                if (isOverflowing) {
                    // Total distance to scroll is half of the double-content width
                    // which is exactly textRef.current.scrollWidth
                    setDuration(textRef.current.scrollWidth / speed);
                }
            }
        };

        // Initial check
        checkOverflow();

        // Re-check on container resize
        const resizeObserver = new ResizeObserver(() => checkOverflow());
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => resizeObserver.disconnect();
    }, [children, speed]);

    const isMobile = typeof window !== 'undefined' && (window.innerWidth < 768 || (window as any).Capacitor?.isNative);
    const effectiveShouldScroll = shouldScroll && !isMobile;

    return (
        <div
            ref={containerRef}
            className={`overflow-hidden whitespace-nowrap relative ${className}`}
            style={effectiveShouldScroll ? {
                maskImage: 'linear-gradient(to right, black calc(100% - 20px), transparent)',
                WebkitMaskImage: 'linear-gradient(to right, black calc(100% - 20px), transparent)'
            } : {}}
        >
            <div
                className={`${effectiveShouldScroll ? 'animate-marquee' : 'w-full'} ${pauseOnHover ? 'hover:[animation-play-state:paused]' : ''}`}
                style={{
                    animationDuration: effectiveShouldScroll ? `${duration}s` : '0s',
                }}
            >
                <span ref={textRef} className="inline-block pr-8">
                    {children}
                </span>
                {shouldScroll && (
                    <span className="inline-block pr-8">
                        {children}
                    </span>
                )}
            </div>
        </div>
    );
}
