const sharp = require('sharp');
const pngToIco = require('png-to-ico');
const fs = require('fs');

(async () => {
  // Convert SVG to 256x256 PNG
  await sharp('public/logo.svg')
    .resize(256, 256)
    .png()
    .toFile('public/logo-256.png');

  // Convert PNG to ICO
  const ico = await pngToIco(['public/logo-256.png']);
  fs.writeFileSync('public/favicon.ico', ico);
  console.log('Favicon generated at public/favicon.ico');
})(); 