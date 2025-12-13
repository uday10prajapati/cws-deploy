import cloudinary from 'cloudinary';

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload image to Cloudinary
 * @param {string} filePath - Path to the file or base64 data
 * @param {string} folder - Folder in Cloudinary (e.g., 'car_wash')
 * @param {string} publicId - Public ID for the image (optional)
 * @returns {Promise<{url: string, publicId: string}>}
 */
export const uploadToCloudinary = async (filePath, folder = 'car_wash', publicId = null) => {
  try {
    const uploadOptions = {
      folder: folder,
      resource_type: 'auto',
      overwrite: false,
      quality: 'auto:eco', // Optimize file size
      fetch_format: 'auto',
    };

    if (publicId) {
      uploadOptions.public_id = publicId;
      uploadOptions.overwrite = true;
    }

    const result = await cloudinary.v2.uploader.upload(filePath, uploadOptions);

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      size: result.bytes,
    };
  } catch (error) {
    console.error('❌ Cloudinary upload error:', error);
    throw new Error(`Failed to upload image to Cloudinary: ${error.message}`);
  }
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Public ID of the image
 * @returns {Promise<{success: boolean}>}
 */
export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.v2.uploader.destroy(publicId);
    return {
      success: result.result === 'ok',
    };
  } catch (error) {
    console.error('❌ Cloudinary delete error:', error);
    throw new Error(`Failed to delete image from Cloudinary: ${error.message}`);
  }
};

/**
 * Convert Supabase storage URL to Cloudinary URL
 * This is a helper function if you have existing Supabase URLs
 * @param {string} imagePath - Image path or filename
 * @returns {string} - Cloudinary URL
 */
export const getCloudinaryUrl = (imagePath) => {
  if (!imagePath) return null;

  // If it's already a Cloudinary URL, return as is
  if (imagePath.includes('cloudinary')) {
    return imagePath;
  }

  // If it's a Supabase URL, convert to Cloudinary placeholder or return original
  if (imagePath.includes('supabase')) {
    // Return a placeholder image or null
    return null;
  }

  // Otherwise assume it's a public ID or path and construct the URL
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloudName}/image/upload/v1/${imagePath}`;
};

export default cloudinary;
