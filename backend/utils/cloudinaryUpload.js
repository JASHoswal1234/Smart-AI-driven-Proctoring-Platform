import { v2 as cloudinary } from 'cloudinary';

const configure = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
};

// Upload a violation screenshot
export const uploadScreenshot = async (dataUrl, examId, type) => {
  configure();
  const result = await cloudinary.uploader.upload(dataUrl, {
    folder: `proctoring/${examId}`,
    public_id: `${type}_${Date.now()}`,
    resource_type: 'image',
  });
  return result.secure_url;
};

// Upload a question image
export const uploadQuestionImage = async (dataUrl, examId) => {
  configure();
  const result = await cloudinary.uploader.upload(dataUrl, {
    folder: `question-images/${examId}`,
    public_id: `qimg_${Date.now()}`,
    resource_type: 'image',
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
  });
  return result.secure_url;
};

// Upload a question audio file (MP3/WAV)
// Cloudinary uses resource_type 'video' for audio files
export const uploadQuestionAudio = async (dataUrl, examId) => {
  configure();
  const result = await cloudinary.uploader.upload(dataUrl, {
    folder: `question-audio/${examId}`,
    public_id: `qaudio_${Date.now()}`,
    resource_type: 'video',
  });
  return result.secure_url;
};
