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
   SEND OTP - EMAIL + WHATSAPP
----------------------------------------- */
router.post("/send-otp", async (req, res) => {
  const { email, phone, name, password } = req.body;

  if (!email && !phone) {
    return res.status(400).json({ error: "Either Email or Phone required" });
  }

  if (!name || !password) {
    return res.status(400).json({ error: "Name & Password required" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Store OTP in DB
  const { error: dbError } = await supabase
    .from("otp_verification")
    .insert([{ email, phone, otp }]);

  if (dbError) {
    console.log("Supabase Insert Error:", dbError);
    return res.status(500).json({ error: "DB Insert Error" });
  }

  let emailStatus = "not_sent";
  let whatsappStatus = "not_sent";

  /* -----------------------------------------
     1️⃣ SEND EMAIL OTP (if email exists)
  ----------------------------------------- */
  if (email) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "CarWash+ OTP Verification",
        html: `<h2>Hello ${name}</h2>
               <p>Your OTP is:</p>
               <h1>${otp}</h1>`,
      });

      emailStatus = "sent";
    } catch (mailError) {
      console.log("Email Error:", mailError);
      emailStatus = "failed";
    }
  }

  /* -----------------------------------------
     2️⃣ SEND WHATSAPP OTP (if phone exists)
     - FREE: CallMeBot API
  ----------------------------------------- */
  if (phone) {
    try {
      const WA_APIKEY = process.env.WHATSAPP_API_KEY; // <-- ADD IN .env

      const url =
        `https://api.callmebot.com/whatsapp.php?` +
        `phone=${phone}&` +
        `text=Your OTP is ${otp}&` +
        `apikey=${WA_APIKEY}`;

      await fetch(encodeURI(url));

      whatsappStatus = "sent";
    } catch (waError) {
      console.log("WhatsApp Error:", waError);
      whatsappStatus = "failed";
    }
  }

  return res.json({
    success: true,
    message: "OTP sent",
    otpSentTo: { email: emailStatus, whatsapp: whatsappStatus },
  });
});

/* -----------------------------------------
   VERIFY OTP (unchanged)
----------------------------------------- */
router.post("/verify-otp", async (req, res) => {
  const { email, phone, otp, name, password } = req.body;

  if (!otp) {
    return res.status(400).json({ error: "OTP required" });
  }

  // Match OTP by email OR phone
  const { data: record } = await supabase
    .from("otp_verification")
    .select("*")
    .or(`email.eq.${email},phone.eq.${phone}`)
    .order("created_at", { ascending: false })
    .limit(1);

  if (!record || !record.length) {
    return res.status(400).json({ error: "OTP not found" });
  }

  if (record[0].otp !== otp) {
    return res.status(400).json({ error: "Invalid OTP" });
  }

  // Create Supabase Auth User
  const { data: userData, error: userError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (userError) return res.status(400).json({ error: userError.message });

  const userId = userData.user.id;

  // Insert profile
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

  // Delete OTP
  await supabase
    .from("otp_verification")
    .delete()
    .or(`email.eq.${email},phone.eq.${phone}`);

  return res.json({ success: true, message: "Account created!" });
});

export default router;
