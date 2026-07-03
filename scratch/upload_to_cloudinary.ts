import { v2 as cloudinary } from 'cloudinary';
import prisma from '../lib/prisma';
import path from 'path';
import fs from 'fs';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function main() {
  const filePath = path.join(process.cwd(), 'public', 'wallet-banner.png');
  if (!fs.existsSync(filePath)) {
    console.error('File not found at:', filePath);
    return;
  }

  console.log('Uploading file to Cloudinary...');
  const result = await cloudinary.uploader.upload(filePath, {
    folder: 'hello-pizza/campaigns',
  });
  const secureUrl = result.secure_url;
  console.log('Uploaded successfully! Secure URL:', secureUrl);

  // Update Template in the database
  const template = await prisma.whatsAppTemplate.findUnique({
    where: { templateName: 'loyalty_balance_update_v2' }
  });

  if (!template) {
    console.log('Template loyalty_balance_update_v2 not found in the DB. Skipping DB update.');
    return;
  }

  // Update the components example handles
  let comps = template.components as any[];
  if (Array.isArray(comps)) {
    comps = comps.map(c => {
      if (c.type === 'HEADER' && c.format === 'IMAGE' && c.example?.header_handle?.[0]) {
        return {
          ...c,
          example: {
            ...c.example,
            header_handle: [secureUrl]
          }
        };
      }
      return c;
    });
  }

  await prisma.whatsAppTemplate.update({
    where: { templateName: 'loyalty_balance_update_v2' },
    data: {
      headerImageUrl: secureUrl,
      components: comps
    }
  });

  console.log('Successfully updated template loyalty_balance_update_v2 in DB with Cloudinary URL.');
}

main().catch(console.error);
