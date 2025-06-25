// Generate PWA icons from KolabEmpati logo
const fs = require('fs');
const path = require('path');

console.log('📱 Setting up PWA icons...');

const logoPath = path.join(__dirname, '..', 'public', 'LogoKolabEmpati.jpg');
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Create icons directory if it doesn't exist
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
  console.log('📁 Created icons directory');
}

// Copy logo for different icon sizes (we'll use the same file for now)
const iconSizes = [
  { size: '72x72', name: 'icon-72x72.jpg' },
  { size: '96x96', name: 'icon-96x96.jpg' },
  { size: '128x128', name: 'icon-128x128.jpg' },
  { size: '144x144', name: 'icon-144x144.jpg' },
  { size: '152x152', name: 'icon-152x152.jpg' },
  { size: '192x192', name: 'icon-192x192.jpg' },
  { size: '384x384', name: 'icon-384x384.jpg' },
  { size: '512x512', name: 'icon-512x512.jpg' }
];

try {
  if (fs.existsSync(logoPath)) {
    iconSizes.forEach(({ name }) => {
      const iconPath = path.join(iconsDir, name);
      fs.copyFileSync(logoPath, iconPath);
      console.log(`✅ Created ${name}`);
    });
    
    console.log('🎉 PWA icons setup complete!');
    console.log('💡 Note: For production, resize each icon to proper dimensions');
  } else {
    console.error('❌ Logo file not found:', logoPath);
  }
} catch (error) {
  console.error('❌ Error setting up PWA icons:', error.message);
}
