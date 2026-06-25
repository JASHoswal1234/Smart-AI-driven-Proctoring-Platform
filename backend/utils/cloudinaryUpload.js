import { v2 as cloudinary } from 'cloudinary';

// Upload a base64 image to Cloudinary
export const uploadScreenshot = async (dataUrl, examId, type) => {
  // Configure here so dotenv is guaranteed to be loaded first
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const result = await cloudinary.uploader.upload(dataUrl, {
    folder: `proctoring/${examId}`,
    public_id: `${type}_${Date.now()}`,
    resource_type: 'image',
  });

  return result.secure_url;
};

// Upload a question image to a dedicated folder
export const uploadQuestionImage = async (dataUrl, examId) => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const result = await cloudinary.uploader.upload(dataUrl, {
    folder: `question-images/${examId}`,
    public_id: `qimg_${Date.now()}`,
    resource_type: 'image',
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
  });

  return result.secure_url;
};
