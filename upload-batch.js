#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

async function uploadPhotosInOrder(folderPath, collection) {
  // Get all image files and sort them in reverse order
  const files = fs.readdirSync(folderPath)
    .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
    .sort()
    .reverse(); // Upload in reverse alphabetical order

  console.log(`Found ${files.length} photos to upload`);
  console.log(`Collection: ${collection}`);

  // Test server connection first
  try {
    const testResponse = await fetch('http://localhost:4321/api/photos?per_page=1');
    if (!testResponse.ok) {
      console.error('❌ Server not responding. Make sure "npm run dev" is running');
      return;
    }
    console.log('✓ Server connection verified');
  } catch (error) {
    console.error('❌ Cannot connect to server. Make sure "npm run dev" is running');
    return;
  }

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(folderPath, file);
    
    try {
      // Check file exists and get stats
      const stats = fs.statSync(filePath);
      console.log(`📤 Uploading ${i + 1}/${files.length}: ${file} (${(stats.size / 1024 / 1024).toFixed(2)}MB)`);
      
      const formData = new FormData();
      const fileContent = fs.readFileSync(filePath);
      
      // Determine proper MIME type
      const ext = path.extname(file).toLowerCase();
      const mimeType = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg', 
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp'
      }[ext] || 'image/jpeg';
      
      const blob = new Blob([fileContent], { type: mimeType });
      
      // Add order prefix to filename
      const orderedName = `${String(i + 1).padStart(3, '0')}_${file}`;
      formData.append('file', blob, orderedName);
      formData.append('order', String(i + 1).padStart(3, '0'));
      formData.append('collection', collection);
      
      const response = await fetch('http://localhost:4321/api/photos', {
        method: 'POST',
        body: formData,
        timeout: 30000 // 30 second timeout
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Uploaded ${i + 1}/${files.length}: ${file}`);
      } else {
        const errorText = await response.text();
        console.error(`❌ Failed ${file} (${response.status}):`, errorText);
      }
      
      // Delay between uploads
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`❌ Error uploading ${file}:`, error.message);
      console.log('Continuing with next file...');
    }
  }
  
  console.log('🎉 Upload batch completed!');
}

// Usage: node upload-batch.js /path/to/your/photos <collection>
const photoFolder = process.argv[2];
const collection = process.argv[3];

if (!photoFolder || !collection) {
  console.error('Usage: node upload-batch.js /path/to/photos/folder <collection>');
  console.error('Example: node upload-batch.js ./photos wedding');
  process.exit(1);
}

uploadPhotosInOrder(photoFolder, collection);