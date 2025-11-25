import express from "express";
import nodemailer from "nodemailer";
import { supabase } from "../supabase.js";

const router = express.Router();

/* -----------------------------------------
   EMAIL TRANSPORTER
----------------------------------------- */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* -----------------------------------------
   SEND OTP
----------------------------------------- */
router.post("/send-otp", async (req, res) => {
  const { email, phone, name, password } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const { error: dbError } = await supabase
    .from("otp_verification")
    .insert([{ email, phone, otp }]);

  if (dbError) {
    console.log("Supabase Insert Error:", dbError);
    return res.status(500).json({ error: "DB Insert Error" });
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "CarWash+ OTP Verification",
      html: `<h2>Hello ${name}</h2>
             <p>Your OTP is:</p>
             <h1>${otp}</h1>`,
    });
  } catch (mailError) {
    console.log("Email Error:", mailError);
    return res.status(500).json({ error: "Email Error" });
  }

  res.json({ success: true, message: "OTP Sent" });
});

/* -----------------------------------------
   VERIFY OTP (fixed)
----------------------------------------- */
router.post("/verify-otp", async (req, res) => {
  const { email, otp, name, phone, password } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: "Email & OTP required" });
  }

  // 1️⃣ Get OTP record
  const { data: record, error } = await supabase
    .from("otp_verification")
    .select("*")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!record) return res.status(400).json({ error: "OTP not found" });
  if (record.otp !== otp) return res.status(400).json({ error: "Invalid OTP" });

  // 2️⃣ Create Supabase Auth user
  const { data: userData, error: userError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (userError) return res.status(400).json({ error: userError.message });

  const userId = userData.user.id;

  // 3️⃣ Insert into profiles
  const { error: profileError } = await supabase
    .from("profiles")
    .insert([
      {
        id: userId,
        name,
        email,
        phone,
        password,
        role: "customer",
      },
    ]);

  if (profileError) {
    console.log(profileError);
    return res.status(500).json({ error: "Profile insert failed" });
  }

  // 4️⃣ Delete used OTP
  await supabase.from("otp_verification").delete().eq("email", email);

  return res.json({ success: true, message: "Account created!" });
});



export default router;
