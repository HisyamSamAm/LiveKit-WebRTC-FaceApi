const https = require('https');
const fs = require('fs');
const path = require('path');

// Model URLs dari Face-API.js repository
const MODEL_URLS = {
  'tiny_face_detector_model-weights_manifest.json': 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1': 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-shard1',
  'face_expression_model-weights_manifest.json': 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_expression_model-weights_manifest.json',
  'face_expression_model-shard1': 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_expression_model-shard1',
  'face_landmark_68_model-weights_manifest.json': 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1': 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-shard1',
  'face_recognition_model-weights_manifest.json': 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1': 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard1',
  'face_recognition_model-shard2': 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard2'
};

// Direktori untuk menyimpan model
const MODELS_DIR = path.join(__dirname, '..', 'public', 'models');

/**
 * Membuat direktori jika belum ada
 */
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Direktori dibuat: ${dirPath}`);
  }
}

/**
 * Download file dari URL
 */
function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);
    
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      } else {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
      }
    }).on('error', (err) => {
      fs.unlink(filePath, () => {}); // Hapus file jika error
      reject(err);
    });
  });
}

/**
 * Cek apakah file sudah ada
 */
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

/**
 * Format ukuran file
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Main function untuk download semua model
 */
async function downloadModels() {
  console.log('🚀 Memulai download model Face-API.js...\n');
  
  // Pastikan direktori models ada
  ensureDirectoryExists(MODELS_DIR);
  
  const totalModels = Object.keys(MODEL_URLS).length;
  let downloadedCount = 0;
  let skippedCount = 0;
  
  for (const [fileName, url] of Object.entries(MODEL_URLS)) {
    const filePath = path.join(MODELS_DIR, fileName);
    
    // Cek apakah file sudah ada
    if (fileExists(filePath)) {
      const stats = fs.statSync(filePath);
      console.log(`⏭️  ${fileName} sudah ada (${formatFileSize(stats.size)})`);
      skippedCount++;
      continue;
    }
    
    try {
      console.log(`⬇️  Mendownload ${fileName}...`);
      await downloadFile(url, filePath);
      
      // Tampilkan ukuran file setelah download
      const stats = fs.statSync(filePath);
      console.log(`✅ ${fileName} berhasil didownload (${formatFileSize(stats.size)})`);
      downloadedCount++;
      
    } catch (error) {
      console.error(`❌ Gagal mendownload ${fileName}:`, error.message);
    }
  }
  
  console.log('\n🎉 Proses download selesai!');
  console.log(`📊 Statistik:`);
  console.log(`   • Total model: ${totalModels}`);
  console.log(`   • Berhasil didownload: ${downloadedCount}`);
  console.log(`   • Sudah ada (dilewati): ${skippedCount}`);
  console.log(`   • Gagal: ${totalModels - downloadedCount - skippedCount}`);
  
  if (downloadedCount > 0 || skippedCount === totalModels) {
    console.log('\n✨ Model Face-API.js siap digunakan!');
    console.log(`📁 Lokasi: ${MODELS_DIR}`);
  }
}

// Jalankan script
downloadModels().catch(console.error);
