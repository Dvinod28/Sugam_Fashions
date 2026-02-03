// Cloudinary Configuration
export const CLOUDINARY_CONFIG = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'your-cloud-name',
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'your-upload-preset',
  apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY || 'your-api-key',
};

// Cloudinary upload URL
export const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`;

// Image transformation settings
export const CLOUDINARY_TRANSFORMATION = {
  productThumbnail: 'w_300,h_300,c_fill,q_auto,f_auto',
  productGallery: 'w_600,h_600,c_fill,q_auto,f_auto',
  productDetail: 'w_800,h_800,c_fill,q_auto,f_auto',
  avatar: 'w_150,h_150,c_fill,q_auto,f_auto',
};

export default CLOUDINARY_CONFIG;