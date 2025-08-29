const fs = require('fs');
const { createCanvas } = require('canvas');

// Create a simple placeholder image
function createPlaceholderImage(width, height, text, filename) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Fill background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  
  // Add border
  ctx.strokeStyle = '#cccccc';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, width - 2, height - 2);
  
  // Add text
  ctx.fillStyle = '#666666';
  ctx.font = `${Math.min(width, height) / 8}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2);
  
  // Save as PNG
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filename, buffer);
  console.log(`Created: ${filename}`);
}

// Create required assets
try {
  // App icon (1024x1024)
  createPlaceholderImage(1024, 1024, 'ICON', 'assets/icon.png');
  
  // Splash screen (1242x2436)
  createPlaceholderImage(1242, 2436, 'SPLASH', 'assets/splash.png');
  
  // Adaptive icon (1024x1024)
  createPlaceholderImage(1024, 1024, 'ADAPTIVE', 'assets/adaptive-icon.png');
  
  // Favicon (48x48)
  createPlaceholderImage(48, 48, 'FAVICON', 'assets/favicon.png');
  
  console.log('All placeholder assets created successfully!');
} catch (error) {
  console.error('Error creating assets:', error.message);
  console.log('You may need to install canvas: npm install canvas');
}
