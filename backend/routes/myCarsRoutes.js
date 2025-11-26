import express from "express";
import { supabase } from "../supabase.js";

const router = express.Router();

/* DELETE must come BEFORE GET */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  const { data: carData, error: fetchErr } = await supabase
    .from("cars")
    .select("image_url")
    .eq("id", id)
    .single();

  if (fetchErr) return res.status(500).json({ success: false, error: fetchErr });

  const { error: deleteErr } = await supabase
    .from("cars")
    .delete()
    .eq("id", id);

  if (deleteErr) return res.status(500).json({ success: false, error: deleteErr });

  if (carData?.image_url) {
    const filePath = carData.image_url.split("/car-images/")[1];
    if (filePath) {
      await supabase.storage.from("car-images").remove([filePath]);
    }
  }

  res.json({ success: true, message: "Car & image deleted successfully" });
});

/* ADD CAR */
router.post("/add", async (req, res) => {
  const { customer_id, brand, model, number_plate, image_url } = req.body;

  if (!customer_id || !brand || !model || !number_plate) {
    return res.status(400).json({ success: false, error: "Missing fields" });
  }

  const { data, error } = await supabase
    .from("cars")
    .insert([{ customer_id, brand, model, number_plate, image_url }])
    .select()
    .single();

  if (error) return res.status(500).json({ success: false, error });

  res.json({ success: true, data });
});

/* GET CARS */
router.get("/:customer_id", async (req, res) => {
  const { customer_id } = req.params;

  const { data, error } = await supabase
    .from("cars")
    .select("*")
    .eq("customer_id", customer_id)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ success: false, error });

  res.json({ success: true, data });
});

export default router;
