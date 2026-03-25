const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function createIco() {
  const pngPath = path.join(__dirname, 'public', 'logo-ptc.png');
  const icoPath = path.join(__dirname, 'public', 'logo-ptc.ico');
  
  // Read the PNG and resize to multiple sizes for ICO
  const sizes = [16, 32, 256];
  const images = [];
  
  for (const size of sizes) {
    const img = await sharp(pngPath)
      .resize(size, size)
      .png()
      .toBuffer();
    images.push(img);
  }
  
  // ICO file format
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type: 1 = ICO
  header.writeUInt16LE(images.length, 4); // Number of images
  
  // Write ICO file
  const fd = fs.openSync(icoPath, 'w');
  fd.write(header);
  
  let offset = 6 + (16 * images.length); // Header + directory entries
  
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.length, 0, 4); // Size
    entry.writeUInt8(0, 4); // Width
    entry.writeUInt8(0, 5); // Height (0 means 256)
    entry.writeUInt8(0, 6); // Color count
    entry.writeUInt8(0, 7); // Reserved
    entry.writeUInt16LE(1, 8); // Color planes
    entry.writeUInt16LE(img.length * 8, 10); // Byte size
    entry.writeUInt32LE(offset, 12); // Offset
    fd.write(entry);
    offset += img.length;
  }
  
  for (const img of images) {
    // PNG data as ICO image data
    const imgHeader = Buffer.alloc(8);
    imgHeader.writeUInt32LE(img.length, 0); // Size
    imgHeader.writeUInt32LE(0, 4); // Width
    imgHeader.writeUInt16LE(0, 4); // Height
    imgHeader.writeUInt16LE(1, 6); // Color planes
    imgHeader.writeUInt16LE(img.length * 8, 8); // Byte size
    fd.write(imgHeader);
    fd.write(img);
  }
  
  fd.close();
  
  console.log('ICO file created:', icoPath);
}

createIco().catch(console.error);
