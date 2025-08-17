import type { APIRoute } from 'astro';

const CLOUDFLARE_ACCOUNT_ID = import.meta.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = import.meta.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_R2_BUCKET_NAME = import.meta.env.CLOUDFLARE_R2_BUCKET_NAME || 'wedding';

export const GET: APIRoute = async ({ request }) => {
  try {
    console.log('Download API called');
    console.log('Environment check:', {
      accountId: !!CLOUDFLARE_ACCOUNT_ID,
      token: !!CLOUDFLARE_API_TOKEN,
      bucket: !!CLOUDFLARE_R2_BUCKET_NAME
    });

    const url = new URL(request.url);
    const imageId = url.searchParams.get('id');

    if (!imageId) {
      return new Response(
        JSON.stringify({ error: 'Image ID is required' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    console.log('Downloading image ID:', imageId);

    // Get image metadata to find R2 filename
    const imageResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v1/${imageId}`,
      {
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        },
      }
    );

    if (!imageResponse.ok) {
      throw new Error(`Failed to get image metadata: ${imageResponse.statusText}`);
    }

    const imageData = await imageResponse.json();
    console.log('Image metadata:', imageData.result?.meta);
    
    const metadata = imageData.result?.meta;
    const r2FileName = metadata?.originalFileName || metadata?.r2Key;

    console.log('R2 filename found:', r2FileName);

    if (!r2FileName) {
      console.log('No R2 filename found in metadata, falling back to Cloudflare Images');
      // Fallback: download the largest variant from Cloudflare Images
      const publicVariant = imageData.result?.variants?.find(v => v.includes('public'));
      if (publicVariant) {
        const imageResponse = await fetch(publicVariant);
        if (imageResponse.ok) {
          return new Response(imageResponse.body, {
            status: 200,
            headers: {
              'Content-Type': 'image/jpeg',
              'Content-Disposition': `attachment; filename="wedding-photo-${imageId}.jpg"`,
              'Cache-Control': 'public, max-age=31536000',
            },
          });
        }
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Original file not found in R2 and no fallback available',
          debug: { metadata, imageData: imageData.result }
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Get the original file from R2
    const r2Url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/r2/buckets/${CLOUDFLARE_R2_BUCKET_NAME}/objects/${r2FileName}`;
    console.log('Fetching from R2 URL:', r2Url);
    
    const r2Response = await fetch(r2Url, {
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      },
    });

    console.log('R2 response status:', r2Response.status);

    if (!r2Response.ok) {
      const r2Error = await r2Response.text();
      console.log('R2 error response:', r2Error);
      throw new Error(`Failed to get file from R2: ${r2Response.statusText} - File: ${r2FileName}`);
    }

    // Get the content type from R2 response or guess from filename
    const contentType = r2Response.headers.get('content-type') || 
                       (r2FileName.endsWith('.jpg') || r2FileName.endsWith('.jpeg') ? 'image/jpeg' : 
                        r2FileName.endsWith('.png') ? 'image/png' : 
                        r2FileName.endsWith('.webp') ? 'image/webp' : 'application/octet-stream');

    // Stream the file back to the client
    return new Response(r2Response.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${r2FileName}"`,
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('Error downloading photo:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to download photo' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};