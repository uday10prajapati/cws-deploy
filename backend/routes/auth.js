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
  const { email, phone, name, password, role, employeeType } = req.body;

  console.log("📧 Send OTP Request:", { email, phone, name, role, employeeType });

  if (!email && !phone) {
    return res.status(400).json({ error: "Either Email or Phone required" });
  }

  if (!name || !password) {
    return res.status(400).json({ error: "Name & Password required" });
  }

  if (role === "employee" && !employeeType) {
    return res.status(400).json({ error: "Employee type required" });
  }

  // Validate email format if provided
  if (email && !email.includes("@")) {
    return res.status(400).json({ error: "Valid email required" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Store OTP in DB with role information
  const { error: dbError } = await supabase
    .from("otp_verification")
    .insert([{ email, phone, otp, role, employee_type: employeeType }]);

  if (dbError) {
    console.log("Supabase Insert Error:", dbError);
    return res.status(500).json({ error: "DB Insert Error" });
  }

  console.log("✅ OTP stored in DB for email:", email, "phone:", phone);

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
               <h1>${otp}</h1>
               ${role === "employee" ? `<p><strong>Note:</strong> Your account will require admin approval before you can login.</p>` : ""}`,
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
   RESEND OTP - EMAIL + WHATSAPP
----------------------------------------- */
router.post("/resend-otp", async (req, res) => {
  const { email, phone } = req.body;

  if (!email && !phone) {
    return res.status(400).json({ error: "Either Email or Phone required" });
  }

  // Get the latest OTP record for this email/phone
  const { data: records } = await supabase
    .from("otp_verification")
    .select("*")
    .or(`email.eq.${email},phone.eq.${phone}`)
    .order("created_at", { ascending: false })
    .limit(1);

  if (!records || !records.length) {
    return res.status(400).json({ error: "No OTP request found. Please signup first." });
  }

  const otpRecord = records[0];
  
  // Check if OTP was recently sent (prevent spam - wait 30 seconds)
  const lastOtpTime = new Date(otpRecord.created_at);
  const currentTime = new Date();
  const secondsElapsed = (currentTime - lastOtpTime) / 1000;

  if (secondsElapsed < 30) {
    const waitTime = Math.ceil(30 - secondsElapsed);
    return res.status(429).json({ 
      error: `Please wait ${waitTime} seconds before requesting a new OTP` 
    });
  }

  // Generate new OTP
  const newOtp = Math.floor(100000 + Math.random() * 900000).toString();

  // Update the OTP record with new OTP
  const { error: updateError } = await supabase
    .from("otp_verification")
    .update({ otp: newOtp, created_at: new Date() })
    .or(`email.eq.${email},phone.eq.${phone}`)
    .order("created_at", { ascending: false })
    .limit(1);

  if (updateError) {
    console.log("Supabase Update Error:", updateError);
    return res.status(500).json({ error: "Failed to resend OTP" });
  }

  let emailStatus = "not_sent";
  let whatsappStatus = "not_sent";

  /* -----------------------------------------
     1️⃣ RESEND EMAIL OTP (if email exists)
  ----------------------------------------- */
  if (email) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "CarWash+ OTP Verification (Resend)",
        html: `<h2>OTP Resent</h2>
               <p>Your new OTP is:</p>
               <h1>${newOtp}</h1>
               <p style="color: #888; font-size: 12px;">This OTP will expire in 10 minutes.</p>`,
      });

      emailStatus = "sent";
    } catch (mailError) {
      console.log("Email Error:", mailError);
      emailStatus = "failed";
    }
  }

  /* -----------------------------------------
     2️⃣ RESEND WHATSAPP OTP (if phone exists)
  ----------------------------------------- */
  if (phone) {
    try {
      const WA_APIKEY = process.env.WHATSAPP_API_KEY;

      const url =
        `https://api.callmebot.com/whatsapp.php?` +
        `phone=${phone}&` +
        `text=Your new OTP is ${newOtp}&` +
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
    message: "OTP resent successfully",
    otpSentTo: { email: emailStatus, whatsapp: whatsappStatus },
  });
});

/* -----------------------------------------
   VERIFY OTP (with role support)
----------------------------------------- */
router.post("/verify-otp", async (req, res) => {
  const { email, phone, otp, name, password, role, employeeType } = req.body;

  console.log("🔍 Verify OTP Request:", req.body);

  // Require OTP
  if (!otp) {
    return res.status(400).json({ error: "OTP required" });
  }

  // FIX #1 — Prevent user creation without password
if (!password || password.trim().length < 6) {
  console.error("❌ Missing or weak password in OTP verification");
  return res.status(400).json({
    error: "Password is required and must be at least 6 characters."
  });

  }

  // Require email or phone
  if (!email && !phone) {
    return res.status(400).json({ error: "Email or phone is required" });
  }

  // Require name
  if (!name || name.trim() === "") {
    return res.status(400).json({ error: "Name is required" });
  }

  // 1️⃣ Verify correct OTP
  let query = supabase
    .from("otp_verification")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1);

  if (email && phone) {
    query = query.or(`email.eq.${email},phone.eq.${phone}`);
  } else if (email) {
    query = query.eq("email", email);
  } else {
    query = query.eq("phone", phone);
  }

  const { data: record } = await query;

  if (!record || record.length === 0) {
    return res.status(400).json({ error: "No OTP found. Please request OTP again." });
  }

  if (record[0].otp !== otp) {
    return res.status(400).json({ error: "Invalid OTP" });
  }

  // 2️⃣ Check if user already exists in profiles table
  const authEmail = email || `user_${phone}@carwash.local`;
  
  // Check if profile exists with this email or phone
  const { data: existingProfile, error: profileCheckError } = await supabase
    .from("profiles")
    .select("id")
    .or(`email.eq.${authEmail},phone.eq.${phone}`)
    .limit(1);
  
  let userId;
  
  if (existingProfile && existingProfile.length > 0) {
    console.log("⚠️ Profile already exists with email:", authEmail);
    return res.status(400).json({
      error: "This email or phone is already registered. Please log in or use different credentials."
    });
  }
  
  // Create new auth user
  const { data: userData, error: userError } =
    await supabase.auth.admin.createUser({
      email: authEmail,
      password: String(password),  // <-- FORCE PASSWORD TO EXIST
      email_confirm: true,
    });

  if (userError) {
    console.error("❌ Failed to create auth user:", userError);
    return res.status(400).json({
      error: "Account creation failed: " + userError.message
    });
  }

  userId = userData.user.id;

  // 3️⃣ Insert profile (or update if exists)
  const profileData = {
    id: userId,
    name,
    email: authEmail,
    phone: phone || null,
    role: role === "employee" ? "employee" : "customer",
    employee_type: role === "employee" ? employeeType : null,
    approval_status: role === "customer" ? "approved" : "pending",
  };

  // First, try to delete any orphaned profiles with the same email/phone
  await supabase
    .from("profiles")
    .delete()
    .or(`email.eq.${authEmail},phone.eq.${phone}`);

  const { error: profileError } = await supabase
    .from("profiles")
    .insert(profileData);

  if (profileError) {
    console.error("❌ Profile insert failed:", profileError);
    
    // Delete the auth user we just created since profile creation failed
    await supabase.auth.admin.deleteUser(userId);
    console.log("🗑️ Deleted auth user due to profile creation failure");
    
    return res.status(500).json({
      error: "Profile creation failed. Please try again."
    });
  }

  // 4️⃣ Create approval request if employee
  if (role === "employee") {
    const { error: approvalError } = await supabase
      .from("user_approvals")
      .insert([{
        user_id: userId,
        email: authEmail,
        name: name,
        phone: phone || null,
        requested_role: `employee_${employeeType}`,
        status: "pending",
      }]);

    if (approvalError) {
      console.error("❌ Failed to create approval request:", approvalError);
      // Don't fail the signup, just log it
    } else {
      console.log("✅ Approval request created for employee:", name);
    }
  }

  // 5️⃣ Delete OTP
  if (email && phone) {
    await supabase.from("otp_verification").delete().or(`email.eq.${email},phone.eq.${phone}`);
  } else if (email) {
    await supabase.from("otp_verification").delete().eq("email", email);
  } else {
    await supabase.from("otp_verification").delete().eq("phone", phone);
  }

  return res.json({
    success: true,
    message:
      role === "employee"
        ? "Account created! Awaiting admin approval."
        : "Account created! You can now log in.",
    userId: userId,
  });
});


/* -----------------------------------------
   GET USER DATA BY ID
----------------------------------------- */
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "User ID required" });
    }

    console.log("📋 Fetching user data for:", userId);

    // Fetch from profiles table
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, name, email, phone, role, employee_type, approval_status")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.error("❌ Profile fetch error:", profileError);
      return res.status(404).json({ error: "User not found" });
    }

    if (profile) {
      console.log("✅ User data found:", profile);
      return res.json({
        success: true,
        user: {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          role: profile.role,
          employee_type: profile.employee_type,
          approval_status: profile.approval_status,
        }
      });
    }

    // If not found in profiles, return error
    return res.status(404).json({ error: "User not found" });
  } catch (error) {
    console.error("❌ Error fetching user:", error);
    return res.status(500).json({ error: "Failed to fetch user data" });
  }
});

/* -----------------------------------------
   RESET PASSWORD (For existing users)
----------------------------------------- */
router.post("/reset-password", async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({ error: "Email and new password required" });
  }

  console.log("🔐 Password reset request for:", email);
  console.log("📝 New password length:", newPassword.length);

  try {
    // Get user ID from profiles table using email
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, name")
      .eq("email", email)
      .single();

    if (profileError || !profileData) {
      console.error("❌ User not found in profiles:", email, profileError);
      return res.status(404).json({ error: "User email not found in profiles table" });
    }

    const userId = profileData.id;
    console.log("👤 Found user ID:", userId, "Name:", profileData.name);

    // Reset password using admin API with user ID
    const { data: userData, error: resetError } = await supabase.auth.admin.updateUserById(
      userId,
      { 
        password: newPassword,
        email_confirm: true  // Ensure email is confirmed
      }
    );

    if (resetError) {
      console.error("❌ Password reset failed:", resetError);
      console.error("📧 Error details:", JSON.stringify(resetError));
      return res.status(400).json({ error: "Password reset failed: " + resetError.message });
    }

    console.log("✅ Password reset successful for:", email);
    console.log("✅ Updated user:", userData?.user?.id);
    
    return res.json({ 
      success: true, 
      message: "Password reset successful. You can now login with your new password.",
      userId: userId,
      email: email
    });
  } catch (error) {
    console.error("❌ Error resetting password:", error);
    console.error("📋 Full error:", JSON.stringify(error));
    return res.status(500).json({ error: "Failed to reset password: " + error.message });
  }
});

/* -----------------------------------------
   BULK RESET PASSWORDS - Reset multiple users
----------------------------------------- */
router.post("/reset-passwords-bulk", async (req, res) => {
  const { emails, password } = req.body;

  if (!emails || !Array.isArray(emails) || !password) {
    return res.status(400).json({ error: "emails array and password required" });
  }

  console.log("🔄 Bulk password reset for:", emails.length, "users");

  const results = [];

  for (const email of emails) {
    try {
      console.log(`\n🔐 Processing: ${email}`);
      
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .single();

      if (!profileData) {
        console.error(`❌ User not found: ${email}`);
        results.push({ email, success: false, error: "User not found" });
        continue;
      }

      const { error: resetError } = await supabase.auth.admin.updateUserById(
        profileData.id,
        { 
          password: password,
          email_confirm: true
        }
      );

      if (resetError) {
        console.error(`❌ Reset failed for ${email}:`, resetError.message);
        results.push({ email, success: false, error: resetError.message });
      } else {
        console.log(`✅ Reset successful for ${email}`);
        results.push({ email, success: true });
      }
    } catch (error) {
      console.error(`❌ Error processing ${email}:`, error);
      results.push({ email, success: false, error: error.message });
    }
  }

  const successCount = results.filter(r => r.success).length;
  console.log(`\n✅ Completed: ${successCount}/${emails.length} users`);

  return res.json({
    success: true,
    message: `Password reset for ${successCount}/${emails.length} users`,
    results: results
  });
});

/* -----------------------------------------
   AUTO-FIX PASSWORD - For users without password
----------------------------------------- */
router.post("/fix-password", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  console.log("🔧 Auto-fixing password for:", email);

  try {
    // Get user ID from profiles
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, name, role, approval_status")
      .eq("email", email)
      .single();

    if (profileError || !profileData) {
      console.error("❌ User not found:", email);
      return res.status(404).json({ error: "User not found in profiles table" });
    }

    const userId = profileData.id;
    console.log("👤 Found user:", userId, "Name:", profileData.name);
    console.log("✅ User approval status:", profileData.approval_status);
    console.log("✅ User role:", profileData.role);

    // Check if user is approved (if employee)
    if (profileData.role === "employee" && profileData.approval_status !== "approved") {
      console.warn("⚠️ Employee not approved yet");
      return res.status(403).json({ 
        error: "Employee account pending approval. Contact admin for approval.",
        status: profileData.approval_status
      });
    }

    // Update password
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      { 
        password: password,
        email_confirm: true
      }
    );

    if (updateError) {
      console.error("❌ Password update failed:", updateError);
      return res.status(400).json({ error: "Password update failed: " + updateError.message });
    }

    console.log("✅ Password fixed for:", email);
    console.log("✅ User can now login");
    
    return res.json({ 
      success: true, 
      message: "Password set successfully. You can now login.",
      email: email,
      role: profileData.role,
      name: profileData.name
    });
  } catch (error) {
    console.error("❌ Error fixing password:", error);
    return res.status(500).json({ error: "Failed to fix password: " + error.message });
  }
});

/* -----------------------------------------
   DIAGNOSTIC - Check user password status
----------------------------------------- */
router.post("/check-user", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email required" });
  }

  console.log("🔍 Checking user status for:", email);

  try {
    // Get from profiles
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", email)
      .single();

    console.log("📋 Profile data:", profile);
    console.log("❌ Profile error:", profileError);

    if (!profile) {
      return res.status(404).json({ error: "User not found in profiles table" });
    }

    // Try to get auth user (this requires admin)
    try {
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      const authUser = authUsers?.users?.find(u => u.email === email);
      console.log("👤 Auth user found:", authUser ? "YES" : "NO");
      console.log("🔐 Auth user has password set:", authUser ? (authUser.encrypted_password ? "YES" : "NO") : "N/A");

      return res.json({
        success: true,
        profile: profile,
        authUser: authUser ? {
          id: authUser.id,
          email: authUser.email,
          hasPassword: !!authUser.encrypted_password,
        } : null,
        message: "User diagnostic info"
      });
    } catch (authErr) {
      console.log("⚠️ Cannot check auth users (admin only)");
      return res.json({
        success: true,
        profile: profile,
        authUser: null,
        message: "Profile exists but cannot verify auth status"
      });
    }
  } catch (error) {
    console.error("❌ Diagnostic error:", error);
    return res.status(500).json({ error: "Diagnostic check failed" });
  }
});

/* -----------------------------------------
   PASSWORD RESET - SEND OTP TO EMAIL
----------------------------------------- */
router.post("/send-password-reset-otp", async (req, res) => {
  const { email } = req.body;

  console.log("📧 Password Reset OTP Request for:", email);

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  if (!email.includes("@")) {
    return res.status(400).json({ message: "Valid email required" });
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  console.log("🔐 Generated OTP:", otp);

  try {
    // Store OTP in password_reset table
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes expiry
    console.log("⏰ OTP Expiry time:", expiresAt);
    
    const { error: dbError } = await supabase
      .from("password_reset_otp")
      .insert([{ 
        email, 
        otp, 
        expires_at: expiresAt
      }]);

    if (dbError) {
      console.error("❌ DB Error storing OTP:", dbError);
      return res.status(500).json({ message: "Failed to store OTP: " + dbError.message });
    }

    console.log("✅ OTP stored in database");

    // Send OTP via email
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "CarWash+ Password Reset Code",
        html: `<h2>Password Reset Request</h2>
               <p>Your password reset code is:</p>
               <h1 style="color: #0066cc; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
               <p>This code will expire in 10 minutes.</p>
               <p>If you didn't request this, please ignore this email.</p>`,
      });
      console.log("✅ Email sent to:", email);
    } catch (emailErr) {
      console.error("❌ Email sending error:", emailErr);
      return res.status(500).json({ message: "Failed to send email: " + emailErr.message });
    }

    return res.json({ 
      success: true, 
      message: "Verification code sent to email" 
    });
  } catch (err) {
    console.error("❌ Error in password reset OTP:", err);
    return res.status(500).json({ message: "Failed to send code: " + err.message });
  }
});

/* -----------------------------------------
   PASSWORD RESET - VERIFY OTP
----------------------------------------- */
router.post("/verify-password-reset-otp", async (req, res) => {
  const { email, otp } = req.body;

  console.log("🔍 Verifying OTP for:", email);
  console.log("📨 OTP received:", otp);
  console.log("📨 Request body:", JSON.stringify(req.body));

  if (!email || !otp) {
    console.log("❌ Missing data - email:", !!email, "otp:", !!otp);
    return res.status(400).json({ message: "Email and OTP required" });
  }

  try {
    // Get the latest OTP record
    const { data: records, error: fetchError } = await supabase
      .from("password_reset_otp")
      .select("*")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error("❌ Database fetch error:", fetchError);
      return res.status(400).json({ message: "Database error: " + fetchError.message });
    }

    if (!records || records.length === 0) {
      console.error("❌ No OTP found for email:", email);
      return res.status(400).json({ message: "No OTP found for this email" });
    }

    const record = records[0];
    
    console.log("📋 OTP Record found:");
    console.log("   Email:", record.email);
    console.log("   OTP in DB:", record.otp);
    console.log("   Verified:", record.verified);

    // Verify OTP matches
    if (record.otp !== otp) {
      console.error("❌ Invalid OTP provided for:", email);
      return res.status(400).json({ message: "Invalid OTP. Please try again." });
    }

    // Mark OTP as verified
    const { error: updateError } = await supabase
      .from("password_reset_otp")
      .update({ verified: true })
      .eq("id", record.id);

    if (updateError) {
      console.error("❌ Error updating OTP status:", updateError);
      return res.status(500).json({ message: "Failed to verify OTP: " + updateError.message });
    }

    console.log("✅ OTP verified successfully for:", email);
    return res.json({ 
      success: true, 
      message: "OTP verified successfully" 
    });
  } catch (err) {
    console.error("❌ Error verifying OTP:", err);
    return res.status(500).json({ message: "Verification failed: " + err.message });
  }
});

/* -----------------------------------------
   PASSWORD RESET - UPDATE PASSWORD
----------------------------------------- */
router.post("/reset-password", async (req, res) => {
  const { email, newPassword } = req.body;

  console.log("🔐 Password reset request for:", email);

  if (!email || !newPassword) {
    return res.status(400).json({ message: "Email and new password required" });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  try {
    // Check if OTP was verified
    const { data: records, error: fetchError } = await supabase
      .from("password_reset_otp")
      .select("*")
      .eq("email", email)
      .eq("verified", true)
      .order("created_at", { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error("❌ Database error:", fetchError);
      return res.status(400).json({ message: "Database error: " + fetchError.message });
    }

    if (!records || records.length === 0) {
      console.error("❌ No verified OTP for:", email);
      return res.status(400).json({ message: "Please verify your email first" });
    }

    const record = records[0];

    console.log("✅ Verified OTP found for:", email);

    // Find the user in profiles table
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    if (profileError || !profile) {
      console.error("❌ User not found:", email, profileError);
      return res.status(400).json({ message: "User not found" });
    }

    console.log("👤 Found user ID:", profile.id);

    // Update password in Supabase Auth
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      profile.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error("❌ Auth update error:", updateError);
      return res.status(500).json({ message: "Failed to update password: " + updateError.message });
    }

    console.log("✅ Password updated for:", email);

    // Mark OTP as used
    const { error: markError } = await supabase
      .from("password_reset_otp")
      .update({ used: true })
      .eq("id", record.id);

    if (markError) {
      console.error("❌ Error marking OTP as used:", markError);
      // Don't fail the request, password was already reset
    }

    return res.json({ 
      success: true, 
      message: "Password reset successfully" 
    });
  } catch (err) {
    console.error("❌ Error resetting password:", err);
    return res.status(500).json({ message: "Password reset failed: " + err.message });
  }
});

export default router;
