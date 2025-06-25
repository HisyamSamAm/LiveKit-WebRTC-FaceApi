// Script to setup KolabEmpati favicon
const fs = require('fs');
const path = require('path');

console.log('📦 Setting up KolabEmpati favicon...');

const logoPath = path.join(__dirname, '..', 'public', 'LogoKolabEmpati.jpg');
const faviconPath = path.join(__dirname, '..', 'public', 'favicon.ico');
const backupPath = path.join(__dirname, '..', 'public', 'favicon-backup.ico');

try {
  // Backup existing favicon
  if (fs.existsSync(faviconPath)) {
    fs.copyFileSync(faviconPath, backupPath);
    console.log('✅ Backup favicon created');
  }
  
  // Copy logo as favicon
  if (fs.existsSync(logoPath)) {
    fs.copyFileSync(logoPath, faviconPath);
    console.log('✅ KolabEmpati logo set as favicon');
    
    // Get file size
    const stats = fs.statSync(faviconPath);
    console.log(`📊 Favicon size: ${(stats.size / 1024).toFixed(2)} KB`);
  } else {
    console.error('❌ Logo file not found:', logoPath);
  }
  
  console.log('🎉 Favicon setup complete!');
  console.log('💡 Note: For production, consider converting to proper ICO format with multiple sizes');
  
} catch (error) {
  console.error('❌ Error setting up favicon:', error.message);
}
