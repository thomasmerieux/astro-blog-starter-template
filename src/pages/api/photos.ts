import type { APIRoute } from 'astro';

const CLOUDFLARE_ACCOUNT_ID = import.meta.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = import.meta.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_R2_BUCKET_NAME = import.meta.env.CLOUDFLARE_R2_BUCKET_NAME || 'wedding';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const page = url.searchParams.get('page') || '1';
    const perPage = url.searchParams.get('per_page') || '50';

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v1?page=${page}&per_page=${perPage}`,
      {
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch images: ${response.statusText}`);
    }

    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching photos:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch photos' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `photo-${timestamp}-${randomSuffix}.${fileExtension}`;

    console.log('Uploading:', fileName, 'to bucket:', CLOUDFLARE_R2_BUCKET_NAME);

    // Upload original to R2
    const r2Response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/r2/buckets/${CLOUDFLARE_R2_BUCKET_NAME}/objects/${fileName}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': file.type,
        },
        body: file,
      }
    );

    if (!r2Response.ok) {
      const r2Error = await r2Response.text();
      console.error('R2 upload error:', r2Error);
      throw new Error(`Failed to upload to R2: ${r2Response.statusText}`);
    }

    console.log('R2 upload successful, now uploading to Images...');

    // Upload to Cloudflare Images for processing/variants
    const imagesFormData = new FormData();
    imagesFormData.append('file', file);
    
    // Get order from form data if provided
    const order = formData.get('order') || Date.now().toString();
    
    imagesFormData.append('metadata', JSON.stringify({
      originalFileName: fileName,
      r2Key: fileName,
      order: order
    }));

    const imagesResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v1`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        },
        body: imagesFormData,
      }
    );

    const imagesData = await imagesResponse.json();

    if (!imagesResponse.ok) {
      console.error('Cloudflare Images error:', imagesData);
      const errorMessage = imagesData.errors?.[0]?.message || imagesResponse.statusText;
      throw new Error(`Failed to upload to Images: ${errorMessage}`);
    }

    // Return combined response with both R2 and Images info
    const result = {
      ...imagesData,
      r2: {
        fileName,
        bucket: CLOUDFLARE_R2_BUCKET_NAME,
        url: `https://pub-${CLOUDFLARE_ACCOUNT_ID}.r2.dev/${fileName}`
      }
    };
    
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error uploading photo:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to upload photo' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
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

    // First, get the image details to find the R2 filename
    const getResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v1/${imageId}`,
      {
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        },
      }
    );

    if (getResponse.ok) {
      const imageData = await getResponse.json();
      const metadata = imageData.result?.meta;
      const r2FileName = metadata?.originalFileName || metadata?.r2Key;

      // Delete from R2 if we have the filename
      if (r2FileName) {
        console.log('Deleting from R2:', r2FileName);
        const r2DeleteResponse = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/r2/buckets/${CLOUDFLARE_R2_BUCKET_NAME}/objects/${r2FileName}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
            },
          }
        );

        if (!r2DeleteResponse.ok) {
          console.warn('Failed to delete from R2:', r2DeleteResponse.statusText);
        }
      }
    }

    // Delete from Cloudflare Images
    const deleteResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v1/${imageId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        },
      }
    );

    if (!deleteResponse.ok) {
      throw new Error(`Failed to delete image: ${deleteResponse.statusText}`);
    }

    const data = await deleteResponse.json();
    
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error deleting photo:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete photo' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};