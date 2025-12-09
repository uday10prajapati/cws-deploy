import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://cjaufvqninknntiukxka.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqYXVmdnFuaW5rbm50aXVreGthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA3MDA1MjcsImV4cCI6MjA0NjI3NjUyN30.xjB4eqAWGGOVqkHs9IJ_3xeFYaWZkAF8uJBx7bw-5Mw"
);

async function setupStorageBucket() {
  try {
    console.log("🔍 Checking if bucket exists...");

    // Try to list buckets to see what we have
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error("Error listing buckets:", listError);
    } else {
      console.log("📦 Existing buckets:", buckets.map((b) => b.name));
    }

    // Try to create bucket
    console.log("\n📝 Attempting to create 'washer_documents' bucket...");
    const { data, error } = await supabase.storage.createBucket(
      "washer_documents",
      {
        public: true,
        allowedMimeTypes: ["image/*", "application/pdf"],
        fileSizeLimit: 52428800, // 50MB
      }
    );

    if (error) {
      console.error("❌ Error creating bucket:", error);
      if (error.message.includes("already exists")) {
        console.log("✅ Bucket already exists");
      }
    } else {
      console.log("✅ Bucket created successfully:", data);
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

setupStorageBucket();
