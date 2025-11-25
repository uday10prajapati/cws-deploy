import express from "express";
import { supabase } from "../supabase.js";

const router = express.Router();

/* ---------------------------------------------------
   ADD A NEW CAR  (Image URL saved properly)
--------------------------------------------------- */
router.post("/add", async (req, res) => {
  const { customer_id, brand, model, number_plate, image_url } = req.body;

  if (!customer_id || !brand || !model || !number_plate) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields",
    });
  }

  const { data, error } = await supabase
    .from("cars")
    .insert([
      {
        customer_id,
        brand,
        model,
        number_plate,
        image_url: image_url || null,  // Correctly saved
      },
    ])
    .select()
    .single();

  if (error) {
    console.log(error);
    return res.status(500).json({ success: false, error });
  }

  res.json({
    success: true,
    message: "Car added successfully",
    data,
  });
});

/* ---------------------------------------------------
   GET ALL CARS OF A USER (must be after /add)
--------------------------------------------------- */
router.get("/:customer_id", async (req, res) => {
  const { customer_id } = req.params;

  const { data, error } = await supabase
    .from("cars")
    .select("*")
    .eq("customer_id", customer_id)
    .order("created_at", { ascending: false });

  if (error) {
    console.log(error);
    return res.status(500).json({ success: false, error });
  }

  res.json({ success: true, data });
});

/* ---------------------------------------------------
   DELETE A CAR + DELETE IMAGE FROM STORAGE
--------------------------------------------------- */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  // 1️⃣ Fetch the car first to get image URL
  const { data: carData, error: fetchErr } = await supabase
    .from("cars")
    .select("image_url")
    .eq("id", id)
    .single();

  if (fetchErr) {
    console.log(fetchErr);
    return res.status(500).json({ success: false, error: fetchErr });
  }

  // 2️⃣ Delete the car record
  const { error: deleteErr } = await supabase
    .from("cars")
    .delete()
    .eq("id", id);

  if (deleteErr) {
    console.log(deleteErr);
    return res.status(500).json({ success: false, error: deleteErr });
  }

  // 3️⃣ Delete image from Supabase Storage if exists
  if (carData?.image_url) {
    try {
      const filePath = carData.image_url.split("/car-images/")[1];

      if (filePath) {
        await supabase.storage
          .from("car-images")
          .remove([filePath]);

        console.log("🗑 Image removed from storage:", filePath);
      }
    } catch (err) {
      console.log("Image delete error:", err);
    }
  }

  res.json({
    success: true,
    message: "Car & image deleted successfully",
  });
});

export default router;
