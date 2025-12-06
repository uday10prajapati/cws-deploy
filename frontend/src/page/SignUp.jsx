import { useState, useEffect } from "react";
import bgImg from "../assets/bg.png";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "customer",
    employeeType: "", // For employee sub-roles
  });
  const [roleStep, setRoleStep] = useState(true); // Show role selection first

  /* 🔥 CHECK IF USER IS ALREADY LOGGED IN */
  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    const userDetails = localStorage.getItem("userDetails");

    if (userRole && userDetails) {
      // User is already logged in, redirect to their dashboard
      if (userRole === "admin") {
        navigate("/admin-dashboard");
      } else if (userRole === "employee") {
        navigate("/employee-dashboard");
      } else if (userRole === "customer") {
        navigate("/customer-dashboard");
      }
    }
  }, [navigate]);

  const [message, setMessage] = useState("");
  const [otpMode, setOtpMode] = useState(false);
  const [otp, setOtp] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [isResending, setIsResending] = useState(false);

  // NEW → for animation
  const [successAnim, setSuccessAnim] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // Countdown timer for resend OTP
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // ----------------------------
  // STEP 1 → SEND OTP
  // ----------------------------
  const handleSignup = async () => {
    if (!form.name || !form.email || !form.phone || !form.password) {
      setMessage("All fields are required.");
      return;
    }

    if (form.role === "employee" && !form.employeeType) {
      setMessage("Please select a position.");
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
          role: form.role,
          employeeType: form.employeeType,
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

  // ----------------------------
  // RESEND OTP
  // ----------------------------
  const handleResendOtp = async () => {
    if (resendTimer > 0) {
      return; // Prevent clicking if timer is still active
    }

    setIsResending(true);
    setMessage("Resending OTP...");

    try {
      const res = await fetch("http://localhost:5000/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          phone: form.phone,
        }),
      });

      const result = await res.json();

      if (!result.success) {
        setMessage(result.error || "Failed to resend OTP");
        setIsResending(false);
        return;
      }

      setMessage("OTP resent successfully! Check your email/WhatsApp.");
      setResendTimer(30); // 30 seconds cooldown
      setOtp(""); // Clear the input
      setIsResending(false);
    } catch (err) {
      console.error(err);
      setMessage("Failed to resend OTP. Try again.");
      setIsResending(false);
    }
  };

  return (
    <div
      className={`min-h-screen bg-slate-950 flex items-center justify-center px-4 transition-all duration-700 ${
        successAnim ? "opacity-0 scale-95" : "opacity-100"
      }`}
    >
      <div
        className={`w-full max-w-5xl grid md:grid-cols-2 gap-4 md:gap-8 items-start md:items-center relative transition-transform duration-700 ${
          successAnim ? "-translate-x-40" : "translate-x-0"
        }`}
      >
        {/* LEFT: IMAGE */}
        <div
          className={`relative h-[300px] md:h-[420px] rounded-3xl overflow-hidden shadow-2xl transition-all duration-700 ${
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
          <div className="hidden md:block absolute -inset-1 bg-linear-to-r from-blue-500/40 via-cyan-400/30 to-blue-700/40 blur-2xl opacity-60"></div>

          <div className="relative bg-slate-900/80 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.75)] max-h-[85vh] md:max-h-none overflow-y-auto md:overflow-visible">
            <h1 className="text-xl md:text-3xl font-extrabold bg-linear-to-r from-white to-blue-200 bg-clip-text text-transparent">
              Create your account
            </h1>
            <p className="mt-1 text-slate-300 text-xs md:text-sm">
              Join CarWash+ and manage your bookings easily.
            </p>

            {/* FORM INPUTS */}
            <div className="mt-3 md:mt-4 space-y-2 md:space-y-3">
              

              {/* ROLE SELECTION STEP */}
              {roleStep ? (
                <div className="space-y-1.5 md:space-y-2">
                  <p className="text-xs text-slate-200 font-medium">Select your account type:</p>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setForm({ ...form, role: "customer" });
                      setRoleStep(false);
                    }}
                    className="w-full p-2.5 md:p-3 text-left rounded-2xl border-2 border-white/20 hover:border-blue-400 bg-white/5 hover:bg-blue-500/10 text-white transition-all"
                  >
                    <div className="font-semibold text-xs md:text-sm">👤 Customer</div>
                    <div className="text-xs text-slate-300 mt-0 md:mt-0.5">Book car wash services</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setForm({ ...form, role: "employee" });
                      setRoleStep(false);
                    }}
                    className="w-full p-2.5 md:p-3 text-left rounded-2xl border-2 border-white/20 hover:border-green-400 bg-white/5 hover:bg-green-500/10 text-white transition-all"
                  >
                    <div className="font-semibold text-xs md:text-sm">💼 Employee</div>
                    <div className="text-xs text-slate-300 mt-0 md:mt-0.5">Join our service team (requires admin approval)</div>
                  </button>
                </div>
              ) : (
                <>
                  {/* Show selected role */}
                  <div className="flex items-center justify-between p-2 md:p-3 bg-blue-500/20 rounded-2xl border border-blue-400/30">
                    <span className="text-xs md:text-sm text-blue-200">
                      {form.role === "customer" ? "👤 Customer" : "💼 Employee"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setRoleStep(true)}
                      className="text-xs text-blue-300 hover:text-blue-100"
                    >
                      Change
                    </button>
                  </div>

                  {/* EMPLOYEE SUB-ROLE SELECTION */}
                  {form.role === "employee" && (
                    <div className="space-y-1">
                      <label className="text-xs text-slate-300 font-medium">Select position:</label>
                      <div className="space-y-1">
                        <label className="flex items-center p-1.5 md:p-2 rounded-2xl border border-white/15 hover:border-blue-400/50 bg-white/5 hover:bg-blue-500/10 cursor-pointer transition-all">
                          <input
                            type="radio"
                            name="employeeType"
                            value="washer"
                            checked={form.employeeType === "washer"}
                            onChange={(e) => setForm({ ...form, employeeType: e.target.value })}
                            className="w-3 h-3"
                          />
                          <span className="ml-2 text-white text-xs md:text-sm">🧹 Car Washer</span>
                        </label>

                        <label className="flex items-center p-1.5 md:p-2 rounded-2xl border border-white/15 hover:border-blue-400/50 bg-white/5 hover:bg-blue-500/10 cursor-pointer transition-all">
                          <input
                            type="radio"
                            name="employeeType"
                            value="rider"
                            checked={form.employeeType === "rider"}
                            onChange={(e) => setForm({ ...form, employeeType: e.target.value })}
                            className="w-3 h-3"
                          />
                          <span className="ml-2 text-white text-xs md:text-sm">🏍️ Rider</span>
                        </label>

                        <label className="flex items-center p-1.5 md:p-2 rounded-2xl border border-white/15 hover:border-blue-400/50 bg-white/5 hover:bg-blue-500/10 cursor-pointer transition-all">
                          <input
                            type="radio"
                            name="employeeType"
                            value="sales"
                            checked={form.employeeType === "sales"}
                            onChange={(e) => setForm({ ...form, employeeType: e.target.value })}
                            className="w-3 h-3"
                          />
                          <span className="ml-2 text-white text-xs md:text-sm">💰 Sales Executive</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* REGULAR FIELDS */}
                  <div className="space-y-2.5 md:space-y-3">
                    <div className="relative">
                      <input
                        name="name"
                        onChange={handleChange}
                        className="peer w-full px-3 pt-4 pb-1.5 text-sm rounded-2xl bg-white/5 border border-white/15 text-white placeholder-transparent focus:ring-2 focus:ring-blue-500/40 outline-none"
                        placeholder="Full Name"
                      />
                      <label className="absolute left-3 top-3 text-xs text-slate-300 peer-focus:text-xs peer-focus:top-1.5 peer-focus:text-blue-300 transition-all">
                        Full Name
                      </label>
                    </div>

                    <div className="relative">
                      <input
                        name="email"
                        type="email"
                        onChange={handleChange}
                        className="peer w-full px-3 pt-4 pb-1.5 text-sm rounded-2xl bg-white/5 border border-white/15 text-white placeholder-transparent focus:ring-2 focus:ring-blue-500/40 outline-none"
                        placeholder="Email"
                      />
                      <label className="absolute left-3 top-3 text-xs text-slate-300 peer-focus:text-xs peer-focus:top-1.5 peer-focus:text-blue-300 transition-all">
                        Email Address
                      </label>
                    </div>

                    <div className="relative">
                      <input
                        name="phone"
                        onChange={handleChange}
                        className="peer w-full px-3 pt-4 pb-1.5 text-sm rounded-2xl bg-white/5 border border-white/15 text-white placeholder-transparent focus:ring-2 focus:ring-blue-500/40 outline-none"
                        placeholder="Phone Number"
                      />
                      <label className="absolute left-3 top-3 text-xs text-slate-300 peer-focus:text-xs peer-focus:top-1.5 peer-focus:text-blue-300 transition-all">
                        Phone Number
                      </label>
                    </div>

                    <div className="relative">
                      <input
                        name="password"
                        type="password"
                        onChange={handleChange}
                        className="peer w-full px-3 pt-4 pb-1.5 text-sm rounded-2xl bg-white/5 border border-white/15 text-white placeholder-transparent focus:ring-2 focus:ring-blue-500/40 outline-none"
                        placeholder="Password"
                      />
                      <label className="absolute left-3 top-3 text-xs text-slate-300 peer-focus:text-xs peer-focus:top-1.5 peer-focus:text-blue-300 transition-all">
                        Password
                      </label>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* BUTTON */}
            <button
              onClick={handleSignup}
              className="mt-3 md:mt-4 w-full py-2.5 md:py-3 rounded-2xl bg-linear-to-r from-blue-600 to-cyan-400 hover:from-blue-500 hover:to-cyan-300 text-white font-semibold text-sm md:text-base shadow-lg shadow-blue-900/50 active:scale-[0.98] transition-all"
            >
              {form.role === "employee" ? "Request Account (Approval Required)" : "Create Account"}
            </button>

            <p className="text-blue-300 text-center mt-2 text-xs">{message}</p>

            <p className="mt-3 md:mt-4 text-xs text-slate-300 text-center">
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

            <p className="text-center text-sm text-slate-300 mb-4">
              We've sent an OTP to <strong>{form.email || form.phone}</strong>
            </p>

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
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all"
            >
              Verify OTP
            </button>

            <div className="mt-4 flex items-center justify-between gap-2">
              <button
                onClick={handleResendOtp}
                disabled={resendTimer > 0 || isResending}
                className={`flex-1 py-2 rounded-xl font-semibold text-sm transition-all ${
                  resendTimer > 0 || isResending
                    ? "bg-slate-600 text-slate-400 cursor-not-allowed"
                    : "bg-slate-700 text-blue-300 hover:bg-slate-600"
                }`}
              >
                {isResending
                  ? "Resending..."
                  : resendTimer > 0
                  ? `Resend in ${resendTimer}s`
                  : "Resend OTP"}
              </button>
            </div>

            <p className="mt-4 text-center text-sm text-slate-300">{message}</p>
          </div>
        </div>
      )}
    </div>
  );
}