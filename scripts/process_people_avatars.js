import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const SOURCE_DIR = path.join(process.env.HOME || '/usr/local/google/home/danielgiuditta', 'Documents', 'people');
const PUBLIC_PEOPLE_DIR = path.join(process.cwd(), 'public', 'people');

if (!fs.existsSync(PUBLIC_PEOPLE_DIR)) {
  fs.mkdirSync(PUBLIC_PEOPLE_DIR, { recursive: true });
}

// Person names in the mock data simulation to map 1-to-1 with photos
const PEOPLE_NAMES = [
  'Elena Vance',
  'Dr. Marcus Thorne',
  'Sarah Lin',
  'David Ross',
  'Priya Patel',
  'Rachel Chang',
  'Dr. Jason Miller',
  'Emily',
  'David',
  'Juyun',
  'Simon',
  'Michelle',
  'Robert',
  'Kishan',
  'Kaushal'
];

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

console.log("🚀 Resizing & Mapping Headshot Avatars (128x128 Crisp Thumbnails)...\n");

if (!fs.existsSync(SOURCE_DIR)) {
  console.error(`❌ Source directory ${SOURCE_DIR} does not exist.`);
  process.exit(1);
}

const files = fs.readdirSync(SOURCE_DIR).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
console.log(`Found ${files.length} raw image file(s) in ${SOURCE_DIR}.`);

if (files.length === 0) {
  console.log("No images found in ~/Documents/people.");
  process.exit(0);
}

files.sort(); // Deterministic sorting

files.forEach((file, idx) => {
  const personName = PEOPLE_NAMES[idx % PEOPLE_NAMES.length];
  const slug = slugify(personName);
  const inputPath = path.join(SOURCE_DIR, file);
  const outputPath = path.join(PUBLIC_PEOPLE_DIR, `${slug}.jpg`);

  try {
    // Crop & resize to 128x128 headshot with quality 85 for small file size & high crispness
    execSync(`convert "${inputPath}" -thumbnail 128x128^ -gravity center -extent 128x128 -quality 85 "${outputPath}"`);
    const stats = fs.statSync(outputPath);
    const sizeKb = (stats.size / 1024).toFixed(1);
    console.log(`  ✅ Resized & Mapped: "${file}" -> ${personName} (${slug}.jpg, ${sizeKb} KB)`);
  } catch (err) {
    console.warn(`  ⚠️ ImageMagick convert failed for ${file}:`, err.message);
  }
});

console.log("\n✨ Active Person Avatar Matrix:");
PEOPLE_NAMES.forEach(name => {
  const slug = slugify(name);
  const targetPath = path.join(PUBLIC_PEOPLE_DIR, `${slug}.jpg`);
  const exists = fs.existsSync(targetPath);
  let sizeStr = 'PENDING';
  if (exists) {
    const kb = (fs.statSync(targetPath).size / 1024).toFixed(1);
    sizeStr = `${kb} KB`;
  }
  console.log(`  - ${name.padEnd(20)} -> /people/${slug}.jpg [${sizeStr}]`);
});

console.log("\n🎉 Resizing complete!");
