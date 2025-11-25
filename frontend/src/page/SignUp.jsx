import { useState } from "react";
import bgImg from "../assets/bg.png";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "customer", // NEW: Added role field
  });

  const [message, setMessage] = useState("");
  const [otpMode, setOtpMode] = useState(false);
  const [otp, setOtp] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false); // NEW: For dropdown

  // NEW → for animation
  const [successAnim, setSuccessAnim] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // NEW: Handle role selection
  const handleRoleSelect = (selectedRole) => {
    setForm({ ...form, role: selectedRole });
    setRoleDropdownOpen(false);
  };

  // ----------------------------
  // STEP 1 → SEND OTP
  // ----------------------------
  const handleSignup = async () => {
    if (!form.name || !form.email || !form.phone || !form.password) {
      setMessage("All fields are required.");
      return;
    }

    setMessage("Sending OTP...");

    try {
      const res = await fetch("http://localhost:5000/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const result = await res.json();

      if (!result.success) {
        setMessage(result.error || "Failed to send OTP");
        return;
      }

      setSignupEmail(form.email);
      setOtpMode(true);

      setMessage("OTP has been sent to your email.");
    } catch (err) {
      console.error(err);
      setMessage("Something went wrong.");
    }
  };

  // ----------------------------
  // STEP 2 → VERIFY OTP
  // ----------------------------
  const handleVerifyOtp = async () => {
    if (!otp) {
      setMessage("Enter OTP.");
      return;
    }

    setMessage("Verifying OTP...");

    try {
      const res = await fetch("http://localhost:5000/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          otp,
          name: form.name,
          phone: form.phone,
          password: form.password,
        }),
      });

      const result = await res.json();

      if (!result.success) {
        setMessage(result.error || "OTP verification failed.");
        return;
      }

      // NEW: smooth animation
      setSuccessAnim(true);

      setMessage("Account created! Redirecting...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      console.error(err);
      setMessage("Server error.");
    }
  };

  return (
    <div
      className={`min-h-screen bg-slate-950 flex items-center justify-center px-4 transition-all duration-700 ${
        successAnim ? "opacity-0 scale-95" : "opacity-100"
      }`}
    >
      <div
        className={`w-full max-w-6xl grid md:grid-cols-2 gap-10 items-center relative transition-transform duration-700 ${
          successAnim ? "-translate-x-40" : "translate-x-0"
        }`}
      >
        {/* LEFT: IMAGE */}
        <div
          className={`relative h-[380px] md:h-[480px] rounded-3xl overflow-hidden shadow-2xl transition-all duration-700 ${
            successAnim ? "translate-x-40 opacity-0" : "translate-x-0 opacity-100"
          }`}
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${bgImg})` }}
          ></div>

          <div className="absolute inset-0 bg-linear-to-tr from-black/80 via-black/40 to-blue-600/40"></div>

          <div className="relative h-full flex flex-col justify-between p-6 md:p-8 text-white">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs uppercase tracking-[0.15em]">
                Premium Car Care
              </span>
              <h2 className="mt-4 text-3xl md:text-4xl font-extrabold leading-tight">
                Shine Ready,
                <br />
                <span className="text-blue-300">Anytime. Anywhere.</span>
              </h2>
              <p className="mt-3 text-sm md:text-base text-slate-200/90">
                Book doorstep car wash in seconds. Real-time tracking & trusted
                riders.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-xs md:text-sm">
              <div className="bg-black/40 px-3 py-2 rounded-xl border border-white/15">
                🚗 Doorstep Service
              </div>
              <div className="bg-black/40 px-3 py-2 rounded-xl border border-white/15">
                ⏱️ Express Wash
              </div>
              <div className="bg-black/40 px-3 py-2 rounded-xl border border-white/15">
                💳 Secure Payments
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: SIGNUP FORM */}
        <div
          className={`relative transition-all duration-700 ${
            successAnim ? "-translate-x-40 opacity-0" : "translate-x-0 opacity-100"
          }`}
        >
          <div className="absolute -inset-1 bg-linear-to-r from-blue-500/40 via-cyan-400/30 to-blue-700/40 blur-2xl opacity-60"></div>

          <div className="relative bg-slate-900/80 border border-white/10 rounded-3xl p-8 md:p-10 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.75)]">
            <h1 className="text-3xl md:text-4xl font-extrabold bg-linear-to-r from-white to-blue-200 bg-clip-text text-transparent">
              Create your account
            </h1>
            <p className="mt-2 text-slate-300 text-sm">
              Join CarWash+ and manage your bookings easily.
            </p>

            {/* FORM INPUTS */}
            <div className="mt-6 space-y-4">
              {/* ROLE DROPDOWN */}
              <div className="relative">
                <label className="block text-sm text-slate-300 mb-2 font-medium">Select Role</label>
                <button
                  onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                  className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/15 text-white text-left flex items-center justify-between hover:bg-white/10 transition-all focus:ring-2 focus:ring-blue-500/40 outline-none"
                >
                  <span className="capitalize">{form.role}</span>
                  <svg
                    className={`w-5 h-5 transition-transform ${
                      roleDropdownOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                </button>

                {roleDropdownOpen && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-slate-800 border border-white/15 rounded-2xl shadow-lg overflow-hidden">
                    <button
                      onClick={() => handleRoleSelect("admin")}
                      className={`w-full px-4 py-3 text-left hover:bg-blue-600/50 transition-all flex items-center gap-2 ${
                        form.role === "admin" ? "bg-blue-600 text-blue-100" : "text-slate-300"
                      }`}
                    >
                      <span className="text-lg">👨‍💼</span>
                      Admin
                    </button>
                    <button
                      onClick={() => handleRoleSelect("employee")}
                      className={`w-full px-4 py-3 text-left hover:bg-blue-600/50 transition-all flex items-center gap-2 border-t border-white/10 ${
                        form.role === "employee" ? "bg-blue-600 text-blue-100" : "text-slate-300"
                      }`}
                    >
                      <span className="text-lg">👷</span>
                      Employee
                    </button>
                    <button
                      onClick={() => handleRoleSelect("customer")}
                      className={`w-full px-4 py-3 text-left hover:bg-blue-600/50 transition-all flex items-center gap-2 border-t border-white/10 ${
                        form.role === "customer" ? "bg-blue-600 text-blue-100" : "text-slate-300"
                      }`}
                    >
                      <span className="text-lg">👤</span>
                      Customer
                    </button>
                  </div>
                )}
              </div>

              <div className="relative">
                <input
                  name="name"
                  onChange={handleChange}
                  className="peer w-full px-4 pt-5 pb-2 rounded-2xl bg-white/5 border border-white/15 text-white placeholder-transparent focus:ring-2 focus:ring-blue-500/40 outline-none"
                  placeholder="Full Name"
                />
                <label className="absolute left-4 top-3.5 text-sm text-slate-300 peer-focus:text-xs peer-focus:top-2 peer-focus:text-blue-300 transition-all">
                  Full Name
                </label>
              </div>

              <div className="relative">
                <input
                  name="email"
                  type="email"
                  onChange={handleChange}
                  className="peer w-full px-4 pt-5 pb-2 rounded-2xl bg-white/5 border border-white/15 text-white placeholder-transparent focus:ring-2 focus:ring-blue-500/40 outline-none"
                  placeholder="Email"
                />
                <label className="absolute left-4 top-3.5 text-sm text-slate-300 peer-focus:text-xs peer-focus:top-2 peer-focus:text-blue-300 transition-all">
                  Email Address
                </label>
              </div>

              <div className="relative">
                <input
                  name="phone"
                  onChange={handleChange}
                  className="peer w-full px-4 pt-5 pb-2 rounded-2xl bg-white/5 border border-white/15 text-white placeholder-transparent focus:ring-2 focus:ring-blue-500/40 outline-none"
                  placeholder="Phone Number"
                />
                <label className="absolute left-4 top-3.5 text-sm text-slate-300 peer-focus:text-xs peer-focus:top-2 peer-focus:text-blue-300 transition-all">
                  Phone Number
                </label>
              </div>

              <div className="relative">
                <input
                  name="password"
                  type="password"
                  onChange={handleChange}
                  className="peer w-full px-4 pt-5 pb-2 rounded-2xl bg-white/5 border border-white/15 text-white placeholder-transparent focus:ring-2 focus:ring-blue-500/40 outline-none"
                  placeholder="Password"
                />
                <label className="absolute left-4 top-3.5 text-sm text-slate-300 peer-focus:text-xs peer-focus:top-2 peer-focus:text-blue-300 transition-all">
                  Password
                </label>
              </div>
            </div>

            {/* BUTTON */}
            <button
              onClick={handleSignup}
              className="mt-6 w-full py-3.5 rounded-2xl bg-linear-to-r from-blue-600 to-cyan-400 hover:from-blue-500 hover:to-cyan-300 text-white font-semibold text-lg shadow-lg shadow-blue-900/50 active:scale-[0.98] transition-all"
            >
              Create Account
            </button>

            <p className="text-blue-300 text-center mt-4 text-sm">{message}</p>

            <p className="mt-6 text-sm text-slate-300 text-center">
              Already have an account?{" "}
              <a href="/login" className="text-blue-300 hover:underline">
                Log in
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* OTP POPUP */}
      {otpMode && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl w-full max-w-sm shadow-2xl">
            <h2 className="text-2xl font-bold text-white text-center mb-4">
              Verify OTP
            </h2>

            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full text-center text-2xl tracking-widest p-3 bg-white/20 text-white rounded-xl border border-white/20 focus:ring-2 focus:ring-blue-400 outline-none"
              placeholder="______"
            />

            <button
              onClick={handleVerifyOtp}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl"
            >
              Verify OTP
            </button>

            <p className="mt-4 text-center text-slate-300">{message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
