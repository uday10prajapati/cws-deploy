import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import bgImg from "../assets/bg.png";

export default function Login() {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState(""); // email or phone
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [slide, setSlide] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const handleLogin = async () => {
  if (!identifier || !password) {
    setMessage("Enter email/phone and password");
    return;
  }

  setMessage("Checking...");
  console.log("🔐 Login attempt with identifier:", identifier);

  const isEmail = identifier.includes("@");
  console.log("📧 Is Email:", isEmail);

  let response;

  if (isEmail) {
    // Direct email login
    console.log("→ Attempting email login with:", identifier);
    response = await supabase.auth.signInWithPassword({
      email: identifier,
      password,
    });
    console.log("✅ Email login response:", response);
  } else {
    // Phone login - try to find user by phone in profiles table first
    console.log("📱 Attempting phone login with:", identifier);
    try {
      console.log("🔍 Looking up phone in profiles table...");
      const { data: profileByPhone, error: lookupError } = await supabase
        .from("profiles")
        .select("email")
        .eq("phone", identifier)
        .single();

      console.log("📋 Profile lookup result:", { profileByPhone, lookupError });

      if (profileByPhone && profileByPhone.email) {
        console.log("✅ Found email for phone:", profileByPhone.email);
        // Found user by phone, use their email to login
        response = await supabase.auth.signInWithPassword({
          email: profileByPhone.email,
          password,
        });
        console.log("✅ Phone->Email login response:", response);
      } else {
        console.error("❌ Phone number not found in profiles");
        setMessage("Phone number not found in system");
        return;
      }
    } catch (err) {
      console.error("❌ Error looking up phone:", err);
      setMessage("Phone number not found");
      return;
    }
  }

  console.log("🔍 Auth response error:", response?.error);
  console.log("🔍 Auth response data:", response?.data);

  if (response.error) {
    console.error("❌ Auth failed:", response.error.message);
    setMessage("❌ " + response.error.message);
    return;
  }

  const user = response.data.user;
  console.log("👤 Auth user:", user);

  if (!user) {
    console.error("❌ No user returned from auth");
    setMessage("Login failed");
    return;
  }

  // 🔥 Fetch profile & role via backend API (to bypass RLS)
  console.log("📝 Fetching profile for user:", user.id);
  const profileRes = await fetch(`http://localhost:5000/profile/profile/${user.id}`);
  
  if (!profileRes.ok) {
    console.error("❌ Failed to fetch profile:", profileRes.status);
    setMessage("Profile not found");
    return;
  }
  
  const profileData = await profileRes.json();
  const profile = profileData.profile;

  console.log("👤 Profile fetched:", profile);

  if (!profile) {
    console.error("❌ Profile not found for user:", user.id);
    setMessage("Profile not found");
    return;
  }

  // 🔥 CHECK IF EMPLOYEE IS APPROVED
  if (profile.role === "employee" && profile.approval_status === "pending") {
    setMessage("Your account is pending admin approval. You will be notified once approved.");
    return;
  }

  if (profile.role === "employee" && profile.approval_status === "rejected") {
    setMessage("Your account request was rejected. Please contact admin for more details.");
    return;
  }

  // 🔥 Store user details in local storage
  const userDetails = {
    id: user.id,
    email: user.email || profile.email,
    name: profile.name,
    phone: profile.phone,
    role: profile.role,
    employeeType: profile.employee_type,
    loginTime: new Date().toISOString()
  };
  localStorage.setItem("userDetails", JSON.stringify(userDetails));
  localStorage.setItem("userId", user.id);
  localStorage.setItem("userRole", profile.role);

  setSlide(true);
  setMessage("Login successful!");

  // 🔥 Role based redirect
  setTimeout(() => {
    console.log("🔀 Redirecting based on role:", profile.role, "employee_type:", profile.employee_type);
    
    if (profile.role === "admin") {
      console.log("→ Navigating to admin-dashboard");
      navigate("/admin-dashboard");
    } else if (profile.role === "employee") {
      // Check employee type for specific routing
      if (profile.employee_type === "washer") {
        console.log("→ Navigating to carwash (washer)");
        navigate("/carwash");
      } else if (profile.employee_type === "rider") {
        console.log("→ Navigating to employee-dashboard (rider)");
        navigate("/employee-dashboard");
      } else if (profile.employee_type === "sales") {
        console.log("→ Navigating to employee-dashboard (sales)");
        navigate("/employee-dashboard");
      } else {
        console.log("→ Navigating to employee-dashboard (default)");
        navigate("/employee-dashboard");
      }
    } else {
      console.log("→ Navigating to customer-dashboard");
      navigate("/customer-dashboard");
    }
  }, 1000);

};

  const handleForgotPassword = () => {
    navigate("/reset-password");
  };

  const handleReturn = () => {
    setShowForgotPassword(false);
    setResetEmail("");
    setResetMessage("");
  };

  // If forgot password modal is open, show that instead
  if (showForgotPassword) {
    return null; // Redirect to reset password page instead
  }

  // Normal login view
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden relative">

      <div
        className={`w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center transition-transform duration-700 ${
          slide ? "-translate-x-1/3" : "translate-x-0"
        }`}
      >
        {/* HERO IMAGE */}
        <div
          className={`relative h-56 sm:h-64 md:h-[360px] lg:h-[420px] rounded-3xl overflow-hidden shadow-2xl order-1 md:order-2 transition-all duration-700 ${
            slide ? "translate-x-1/2 opacity-0" : "translate-x-0 opacity-100"
          }`}
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${bgImg})` }}
          />
          <div className="absolute inset-0 bg-linear-to-tr from-black/85 via-black/55 to-blue-600/45" />

          <div className="relative h-full flex flex-col justify-end p-6 md:p-8 text-white">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight drop-shadow-md">
              Welcome Back
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-200 max-w-xs">
              Login to manage all your washes, passes and bookings.
            </p>
          </div>
        </div>

        {/* LOGIN PANEL */}
        <div
          className={`relative order-2 md:order-1 transition-all duration-700 ${
            slide ? "-translate-x-1/2 opacity-0" : "translate-x-0 opacity-100"
          }`}
        >
          <div className="absolute -inset-1 bg-linear-to-r from-blue-500/40 via-cyan-400/30 to-blue-700/40 blur-2xl opacity-60" />

          <div className="relative bg-slate-900/85 border border-white/10 rounded-3xl p-6 sm:p-8 md:p-10 backdrop-blur-2xl">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold bg-linear-to-r from-white to-blue-200 bg-clip-text text-transparent">
              Login
            </h1>

            <p className="mt-2 text-slate-300 text-xs sm:text-sm">
              Enter your registered email or phone with password.
            </p>

            {/* Email or Phone Input */}
            <div className="mt-6 relative">
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="peer w-full px-4 pt-5 pb-2 rounded-2xl bg-white/5 border border-white/15 
                           text-white placeholder-transparent focus:ring-2 focus:ring-blue-500/40 outline-none"
                placeholder="Email or Phone"
              />
              <label className="absolute left-4 top-3.5 text-sm text-slate-300 peer-focus:top-2 peer-focus:text-xs peer-focus:text-blue-300 transition-all">
                Email or Phone
              </label>
            </div>

            {/* Password Input */}
            <div className="mt-4 relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="peer w-full px-4 pt-5 pb-2 rounded-2xl bg-white/5 border border-white/15 
                           text-white placeholder-transparent focus:ring-2 focus:ring-blue-500/40 outline-none"
                placeholder="Password"
              />
              <label className="absolute left-4 top-3.5 text-sm text-slate-300 peer-focus:top-2 peer-focus:text-xs peer-focus:text-blue-300 transition-all">
                Password
              </label>
            </div>

            {/* BUTTON */}
            <button
              onClick={handleLogin}
              className="mt-6 w-full py-3.5 rounded-2xl bg-linear-to-r from-blue-600 to-cyan-400 
                         hover:from-blue-500 hover:to-cyan-300 text-white font-semibold text-lg 
                         shadow-lg shadow-blue-900/50 transition-all"
            >
              Login
            </button>

            <div className="mt-4 text-center">
              <a
                href="/reset-password"
                className="text-blue-300 hover:text-blue-200 text-sm transition-all underline"
              >
                Forgot Password?
              </a>
            </div>

            <p className="text-blue-300 text-center mt-4 text-sm">{message}</p>

            <p className="mt-6 text-center text-slate-300 text-sm">
              Don't have an account?{" "}
              <a href="/signup" className="text-blue-300 hover:underline">
                Create one
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}