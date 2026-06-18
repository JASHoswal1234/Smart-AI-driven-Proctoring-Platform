import { v2 as cloudinary } from 'cloudinary';

// Upload a base64 image to Cloudinary
export const uploadScreenshot = async (dataUrl, examId, type) => {
  // Configure here so dotenv is guaranteed to be loaded first
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  console.log('☁️ Cloudinary config:', {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY ? '✅ set' : '❌ missing',
    api_secret: process.env.CLOUDINARY_API_SECRET ? '✅ set' : '❌ missing',
  });

  const result = await cloudinary.uploader.upload(dataUrl, {
    folder: `proctoring/${examId}`,
    public_id: `${type}_${Date.now()}`,
    resource_type: 'image',
  });

  console.log('✅ Screenshot uploaded:', result.secure_url);
  return result.secure_url;
};
