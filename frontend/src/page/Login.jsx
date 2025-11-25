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

  const handleLogin = async () => {
  if (!identifier || !password) {
    setMessage("Enter email/phone and password");
    return;
  }

  setMessage("Checking...");

  const isEmail = identifier.includes("@");

  let response;

  if (isEmail) {
    response = await supabase.auth.signInWithPassword({
      email: identifier,
      password,
    });
  } else {
    response = await supabase.auth.signInWithPassword({
      phone: identifier,
      password,
    });
  }

  if (response.error) {
    setMessage(response.error.message);
    return;
  }

  const user = response.data.user;

  if (!user) {
    setMessage("Login failed");
    return;
  }

  // 🔥 Fetch profile & role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    setMessage("Profile not found");
    return;
  }

  setSlide(true);
  setMessage("Login successful!");

  // 🔥 Role based redirect
  setTimeout(() => {
  if (profile.role === "admin") {
    navigate("/admin-dashboard");
  } else if (profile.role === "employee") {
    navigate("/employee-dashboard");
  } else {
    navigate("/customer-dashboard");
  }
}, 1000);

};


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
