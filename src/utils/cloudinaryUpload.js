import { CLOUDINARY_UPLOAD_URL, CLOUDINARY_CONFIG } from '../config/cloudinary';

/**
 * Upload a single image to Cloudinary
 * @param {File} file - The image file to upload
 * @param {Object} options - Upload options
 * @returns {Promise<string>} - The uploaded image URL
 */
export const uploadImageToCloudinary = async (file, options = {}) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    
    // Add any additional options
    if (options.folder) {
      formData.append('folder', options.folder);
    }
    if (options.publicId) {
      formData.append('public_id', options.publicId);
    }
    if (options.tags) {
      formData.append('tags', options.tags.join(','));
    }

    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }

    return data.secure_url; // Return the HTTPS URL
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

/**
 * Upload multiple images to Cloudinary
 * @param {File[]} files - Array of image files to upload
 * @param {Object} options - Upload options
 * @returns {Promise<string[]>} - Array of uploaded image URLs
 */
export const uploadMultipleImagesToCloudinary = async (files, options = {}) => {
  try {
    const uploadPromises = files.map(file => uploadImageToCloudinary(file, options));
    const results = await Promise.allSettled(uploadPromises);
    
    const successfulUploads = [];
    const failedUploads = [];
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successfulUploads.push(result.value);
      } else {
        failedUploads.push({
          file: files[index].name,
          error: result.reason.message
        });
      }
    });
    
    if (failedUploads.length > 0) {
      console.warn('Some images failed to upload:', failedUploads);
      // You might want to show a toast notification here
    }
    
    return successfulUploads;
  } catch (error) {
    console.error('Multiple upload error:', error);
    throw new Error(`Failed to upload images: ${error.message}`);
  }
};

/**
 * Process images for product upload (handles both File objects and existing URLs)
 * @param {Array} images - Array of File objects or URL strings
 * @param {string} productId - Product ID for folder organization
 * @returns {Promise<string[]>} - Array of image URLs
 */
export const processProductImages = async (images, productId) => {
  try {
    if (!images || images.length === 0) {
      return [];
    }

    // Separate existing URLs from new files
    const existingUrls = images.filter(image => 
      typeof image === 'string' && image.startsWith('http')
    );
    
    const newFiles = images.filter(image => 
      image instanceof File || (image && typeof image === 'object' && image.name)
    );

    // Upload new files to Cloudinary
    let uploadedUrls = [];
    if (newFiles.length > 0) {
      const uploadOptions = {
        folder: `sugam-fashion/products/${productId}`,
        tags: ['product', 'sugam-fashion']
      };
      
      uploadedUrls = await uploadMultipleImagesToCloudinary(newFiles, uploadOptions);
    }

    // Combine existing URLs with newly uploaded ones
    return [...existingUrls, ...uploadedUrls];
  } catch (error) {
    console.error('Error processing product images:', error);
    throw new Error(`Failed to process product images: ${error.message}`);
  }
};

/**
 * Get optimized image URL with transformations
 * @param {string} publicUrl - The Cloudinary public URL
 * @param {string} transformation - The transformation string
 * @returns {string} - Optimized image URL
 */
export const getOptimizedImageUrl = (publicUrl, transformation = '') => {
  if (!publicUrl || !publicUrl.includes('cloudinary.com')) {
    return publicUrl; // Return original if not a Cloudinary URL
  }
  
  if (!transformation) {
    return publicUrl;
  }
  
  // Insert transformation into the URL
  const urlParts = publicUrl.split('/upload/');
  if (urlParts.length === 2) {
    return `${urlParts[0]}/upload/${transformation}/${urlParts[1]}`;
  }
  
  return publicUrl;
};

/**
 * Delete image from Cloudinary (requires server-side implementation)
 * Note: For security, deletion should ideally be done server-side
 * @param {string} publicId - The Cloudinary public ID
 * @returns {Promise<boolean>} - Success status
 */
export const deleteImageFromCloudinary = async (publicId) => {
  // This would require your backend API endpoint
  // as you shouldn't expose your Cloudinary API secret in the frontend
  console.warn('Image deletion should be implemented server-side for security');
  return false;
};

export default {
  uploadImageToCloudinary,
  uploadMultipleImagesToCloudinary,
  processProductImages,
  getOptimizedImageUrl,
  deleteImageFromCloudinary,
};