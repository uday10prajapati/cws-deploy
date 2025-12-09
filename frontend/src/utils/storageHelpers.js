import { supabase } from "../supabaseClient";

/**
 * Initializes the washer_documents storage bucket via backend endpoint
 * Backend uses service role key which has permission to create buckets
 */
export const initializeStorageBucket = async () => {
  try {
    console.log("🔄 Initializing storage bucket via backend...");

    const response = await fetch("http://localhost:5000/documents/initialize-storage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const result = await response.json();

    if (result.success) {
      console.log("✅ Storage bucket initialized:", result.message);
      return true;
    } else {
      console.error("❌ Error initializing bucket:", result.error);
      return false;
    }
  } catch (error) {
    console.error("❌ Fatal error initializing bucket:", error);
    return false;
  }
};

/**
 * Helper to upload file to storage with error handling
 */
export const uploadToStorage = async (bucketName, filePath, file) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, { upsert: true });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);

    return {
      success: true,
      url: urlData.publicUrl,
      path: data.path,
    };
  } catch (error) {
    return {
      success: false,
      error: error,
    };
  }
};

/**
 * Get file list from storage bucket
 */
export const listStorageFiles = async (bucketName, path = "") => {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(path);

    if (error) throw error;

    return {
      success: true,
      files: data || [],
    };
  } catch (error) {
    return {
      success: false,
      error: error,
    };
  }
};

/**
 * Delete file from storage
 */
export const deleteStorageFile = async (bucketName, filePath) => {
  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) throw error;

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error,
    };
  }
};
