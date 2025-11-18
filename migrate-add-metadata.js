#!/usr/bin/env node

import 'dotenv/config';

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

async function migratePhotosMetadata(collection) {
  console.log(`🔄 Starting metadata migration...`);
  console.log(`   Collection: ${collection}`);
  console.log('');

  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
    console.error('❌ Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN in .env');
    process.exit(1);
  }

  try {
    // Step 1: Fetch all photos
    console.log('📥 Fetching all photos from Cloudflare Images...');
    let allPhotos = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v1?page=${page}&per_page=100`,
        {
          headers: {
            'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch photos: ${response.statusText}`);
      }

      const data = await response.json();
      const photos = data.result?.images || [];
      allPhotos = allPhotos.concat(photos);

      console.log(`   Fetched page ${page}: ${photos.length} photos`);

      // Check if there are more pages
      hasMore = photos.length === 100;
      page++;
    }

    console.log(`✅ Found ${allPhotos.length} photos total\n`);

    // Step 2: Update metadata for each photo
    console.log('🔧 Updating metadata for each photo...\n');
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < allPhotos.length; i++) {
      const photo = allPhotos[i];
      const photoNum = i + 1;

      try {
        // Get existing metadata
        const existingMeta = photo.meta || {};

        // Add collection field while preserving existing metadata
        const updatedMeta = {
          ...existingMeta,
          collection: collection,
        };

        // Update the photo metadata
        const updateResponse = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v1/${photo.id}`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              metadata: updatedMeta,
            }),
          }
        );

        if (updateResponse.ok) {
          console.log(`✅ ${photoNum}/${allPhotos.length}: Updated photo ${photo.id.substring(0, 8)}...`);
          successCount++;
        } else {
          const errorText = await updateResponse.text();
          console.error(`❌ ${photoNum}/${allPhotos.length}: Failed to update ${photo.id} - ${errorText}`);
          errorCount++;
        }

        // Rate limiting: small delay between requests
        if (photoNum % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          await new Promise(resolve => setTimeout(resolve, 200));
        }

      } catch (error) {
        console.error(`❌ ${photoNum}/${allPhotos.length}: Error updating ${photo.id}: ${error.message}`);
        errorCount++;
      }
    }

    console.log('\n🎉 Migration completed!');
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Usage: node migrate-add-metadata.js <collection>
const collection = process.argv[2];

if (!collection) {
  console.error('Usage: node migrate-add-metadata.js <collection>');
  console.error('Example: node migrate-add-metadata.js "wedding"');
  process.exit(1);
}

migratePhotosMetadata(collection);
