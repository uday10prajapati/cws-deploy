import { supabase } from "../supabaseClient";

// Cache to prevent duplicate initialization calls
let initializationInProgress = false;
let isInitialized = false;

/**
 * Initializes the washer_documents storage bucket via backend endpoint
 * Backend uses service role key which has permission to create buckets
 * Prevents duplicate calls with caching
 */
export const initializeStorageBucket = async () => {
  // If already initialized, skip
  if (isInitialized) {
    return true;
  }

  // If initialization is in progress, wait for it
  if (initializationInProgress) {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (isInitialized) {
          clearInterval(checkInterval);
          resolve(true);
        }
      }, 100);
    });
  }

  try {
    initializationInProgress = true;

    const response = await fetch("http://localhost:5000/documents/initialize-storage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const result = await response.json();

    if (result.success) {
      isInitialized = true;
      return true;
    } else {
      initializationInProgress = false;
      return false;
    }
  } catch (error) {
    initializationInProgress = false;
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
