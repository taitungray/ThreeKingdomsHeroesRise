const path = require('path');
const sharp = require('sharp');

const projectRoot = path.resolve(__dirname, '..');
const sourcePath = path.join(projectRoot, 'assets', 'icon-source-user.webp');
const outputPath = path.join(projectRoot, 'assets', 'icon.webp');
const size = 1024;
const cornerRadius = 202;
const pwaSizes = [192, 512];

const maskSvg = Buffer.from(
  `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect x="0" y="0" width="${size}" height="${size}" rx="${cornerRadius}" fill="#fff"/>
  </svg>`,
);

sharp(sourcePath)
  .resize(size, size, { fit: 'fill' })
  .composite([{ input: maskSvg, blend: 'dest-in' }])
  .webp({ lossless: true })
  .toFile(outputPath)
  .then((metadata) => Promise.all([
    metadata,
    ...pwaSizes.map((pwaSize) => sharp(outputPath)
      .resize(pwaSize, pwaSize, { fit: 'fill' })
      .webp({ quality: 92, alphaQuality: 100 })
      .toFile(path.join(projectRoot, 'assets', 'icons', `icon-${pwaSize}.webp`))),
  ]))
  .then(([metadata]) => {
    console.log(`Processed ${path.relative(projectRoot, outputPath)}: ${metadata.width}x${metadata.height}, RGBA`);
    console.log(`Generated ${pwaSizes.length} valid WebP PWA icon sizes.`);
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });