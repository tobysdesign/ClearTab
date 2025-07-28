'use server'

import { z } from 'zod'
import { action } from '@/lib/safe-action-client'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const uploadImage = action
  .schema(z.instanceof(FormData))
  .action(
  async ({ parsedInput }) => {
    const formData = parsedInput
    const file = formData.get('file') as File | null;

    if (!file) {
      throw new Error('No file provided.');
    }

    const fileBuffer = await file.arrayBuffer();
    const mime = file.type;
    const encoding = 'base64';
    const base64Data = Buffer.from(fileBuffer).toString('base64');
    const fileUri = 'data:' + mime + ';' + encoding + ',' + base64Data;

    try {
      const result = await cloudinary.uploader.upload(fileUri, {
        folder: 'editor-uploads',
      });

      return {
        url: result.secure_url,
        width: result.width,
        height: result.height,
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error('Failed to upload image to Cloudinary.');
    }
  }
); 