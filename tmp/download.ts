import fs from 'fs';

async function run() {
  const res = await fetch('https://raw.githubusercontent.com/anandnet/Harmony-Music/main/lib/services/piped_service.dart');
  const text = await res.text();
  fs.writeFileSync('piped_service.dart', text);
  console.log('Downloaded piped_service.dart');
}
run();
