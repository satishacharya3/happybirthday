import sharp from 'sharp';
import { readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const IMAGES_DIR = 'src/assets/images';
const MAX_WIDTH = 800;
const JPEG_QUALITY = 72;
const PNG_QUALITY = 72;

const files = readdirSync(IMAGES_DIR);

for (const file of files) {
  const filePath = join(IMAGES_DIR, file);
  const ext = extname(file).toLowerCase();
  const sizeBefore = statSync(filePath).size;

  if (ext === '.jpg' || ext === '.jpeg') {
    const buffer = await sharp(filePath)
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .jpeg({ quality: JPEG_QUALITY, progressive: true })
      .toBuffer();
    await sharp(buffer).toFile(filePath);
    const sizeAfter = statSync(filePath).size;
    console.log(`${file}: ${(sizeBefore/1024).toFixed(0)}KB → ${(sizeAfter/1024).toFixed(0)}KB`);
  } else if (ext === '.png') {
    const buffer = await sharp(filePath)
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .png({ quality: PNG_QUALITY, compressionLevel: 9 })
      .toBuffer();
    await sharp(buffer).toFile(filePath);
    const sizeAfter = statSync(filePath).size;
    console.log(`${file}: ${(sizeBefore/1024).toFixed(0)}KB → ${(sizeAfter/1024).toFixed(0)}KB`);
  }
}

console.log('\nDone! Images optimized.');
