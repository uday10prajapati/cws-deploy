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
    adminType: "", // For admin sub-roles (NEW)
  });
  const [roleStep, setRoleStep] = useState(true); // Show role selection first

  // NEW: State for fetching available roles from backend
  const [availableRoles, setAvailableRoles] = useState({
    employee_types: [],
    admin_types: [],
  });
  const [loadingRoles, setLoadingRoles] = useState(false);

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

  // NEW: Fetch available roles when component mounts
  useEffect(() => {
    const fetchRoles = async () => {
      setLoadingRoles(true);
      try {
        const res = await fetch("http://localhost:5000/auth/get-roles");
        const data = await res.json();
        if (data.success && data.roles) {
          setAvailableRoles(data.roles);
          console.log("✅ Available roles loaded:", data.roles);
        }
      } catch (err) {
        console.error("❌ Failed to fetch roles:", err);
      } finally {
        setLoadingRoles(false);
      }
    };
    fetchRoles();
  }, []);

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

    // NEW: Validate that admin role has adminType selected
    if (form.role === "admin" && !form.adminType) {
      setMessage("Please select an admin position.");
      return;
    }

    // Validate that employee role has employeeType selected
    if (form.role === "employee" && !form.employeeType) {
      setMessage("Please select an employee position.");
      return;
    }

    setMessage("Sending OTP...");

    try {
      // Prepare form data with proper role assignment
      const submitData = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: form.role, // Send "admin" or "employee" or "customer" as-is
        employeeType: form.role === "admin" ? form.adminType : form.employeeType,
      };

      const res = await fetch("http://localhost:5000/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
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
          role: form.role, // Send "admin" or "employee" as-is
          employeeType: form.role === "admin" ? form.adminType : form.employeeType,
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
      className={`min-h-screen bg-white flex items-center justify-center px-4 transition-all duration-700 ${
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
          className={`relative h-[300px] md:h-[420px] rounded-3xl overflow-hidden shadow-lg transition-all duration-700 ${
            successAnim ? "translate-x-40 opacity-0" : "translate-x-0 opacity-100"
          }`}
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${bgImg})` }}
          ></div>

          <div className="absolute inset-0 bg-linear-to-tr from-black/75 via-black/45 to-blue-600/35"></div>

          <div className="relative h-full flex flex-col justify-between p-6 md:p-8 text-white">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs uppercase tracking-[0.15em]">
                Premium Car Care
              </span>
              <h2 className="mt-4 text-3xl md:text-4xl font-extrabold leading-tight">
                Shine Ready,
                <br />
                <span className="text-blue-100">Anytime. Anywhere.</span>
              </h2>
              <p className="mt-3 text-sm md:text-base text-slate-100/90">
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
          <div className="hidden md:block absolute -inset-1 bg-linear-to-r from-blue-200/40 via-blue-100/30 to-blue-300/40 blur-2xl opacity-60"></div>

          <div className="relative bg-white border border-blue-200 rounded-3xl p-6 md:p-8 shadow-xl max-h-[85vh] md:max-h-none overflow-y-auto md:overflow-visible">
            <h1 className="text-xl md:text-3xl font-extrabold bg-linear-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">
              Create your account
            </h1>
            <p className="mt-1 text-slate-600 text-xs md:text-sm">
              Join CarWash+ and manage your bookings easily.
            </p>

            {/* FORM INPUTS */}
            <div className="mt-3 md:mt-4 space-y-2 md:space-y-3">
              

              {/* ROLE SELECTION STEP */}
              {roleStep ? (
                <div className="space-y-1.5 md:space-y-2">
                  <p className="text-xs text-slate-700 font-medium">Select your account type:</p>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setForm({ ...form, role: "customer", employeeType: "", adminType: "" });
                      setRoleStep(false);
                    }}
                    className="w-full p-2.5 md:p-3 text-left rounded-2xl border-2 border-blue-200 hover:border-blue-400 bg-blue-50 hover:bg-blue-100 text-slate-900 transition-all"
                  >
                    <div className="font-semibold text-xs md:text-sm">👤 Customer</div>
                    <div className="text-xs text-slate-600 mt-0 md:mt-0.5">Book car wash services</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setForm({ ...form, role: "employee", employeeType: "", adminType: "" });
                      setRoleStep(false);
                    }}
                    className="w-full p-2.5 md:p-3 text-left rounded-2xl border-2 border-green-200 hover:border-green-400 bg-green-50 hover:bg-green-100 text-slate-900 transition-all"
                  >
                    <div className="font-semibold text-xs md:text-sm">💼 Employee</div>
                    <div className="text-xs text-slate-600 mt-0 md:mt-0.5">Join our service team (requires admin approval)</div>
                  </button>

                  {/* NEW: ADMIN SIGNUP OPTION */}
                  <button
                    type="button"
                    onClick={() => {
                      setForm({ ...form, role: "admin", employeeType: "", adminType: "" });
                      setRoleStep(false);
                    }}
                    className="w-full p-2.5 md:p-3 text-left rounded-2xl border-2 border-purple-200 hover:border-purple-400 bg-purple-50 hover:bg-purple-100 text-slate-900 transition-all"
                  >
                    <div className="font-semibold text-xs md:text-sm">🔑 Admin</div>
                    <div className="text-xs text-slate-600 mt-0 md:mt-0.5">Administrative access (requires approval)</div>
                  </button>
                </div>
              ) : (
                <>
                  {/* Show selected role */}
                  <div className="flex items-center justify-between p-2 md:p-3 bg-blue-100 rounded-2xl border border-blue-300">
                    <span className="text-xs md:text-sm text-blue-700">
                      {form.role === "customer" ? "👤 Customer" : form.role === "employee" ? "💼 Employee" : "🔑 Admin"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setRoleStep(true)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Change
                    </button>
                  </div>

                  {/* EMPLOYEE POSITION SELECTION - NOW DROPDOWN */}
                  {form.role === "employee" && (
                    <div className="space-y-1">
                      <label className="text-xs text-slate-700 font-medium">Select your position: *</label>
                      <select
                        name="employeeType"
                        value={form.employeeType}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 text-sm rounded-2xl bg-slate-50 border border-blue-200 text-slate-900 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 outline-none transition-all cursor-pointer"
                      >
                        <option value="">-- Select Position --</option>
                        {availableRoles.employee_types.map((empType) => (
                          <option key={empType.id} value={empType.value}>
                            {empType.label}
                          </option>
                        ))}
                      </select>
                      {form.employeeType && (
                        <p className="text-xs text-green-600 mt-1">✓ {availableRoles.employee_types.find(e => e.value === form.employeeType)?.label}</p>
                      )}
                    </div>
                  )}

                  {/* NEW: ADMIN POSITION SELECTION - DROPDOWN */}
                  {form.role === "admin" && (
                    <div className="space-y-1">
                      <label className="text-xs text-slate-700 font-medium">Select your position: *</label>
                      <select
                        name="adminType"
                        value={form.adminType}
                        onChange={(e) => setForm({ ...form, adminType: e.target.value })}
                        className="w-full px-3 py-2.5 text-sm rounded-2xl bg-slate-50 border border-purple-200 text-slate-900 focus:ring-2 focus:ring-purple-500/40 focus:border-purple-400 outline-none transition-all cursor-pointer"
                      >
                        <option value="">-- Select Position --</option>
                        {availableRoles.admin_types.map((adminType) => (
                          <option key={adminType.id} value={adminType.value}>
                            {adminType.label}
                          </option>
                        ))}
                      </select>
                      {form.adminType && (
                        <p className="text-xs text-green-600 mt-1">✓ {availableRoles.admin_types.find(a => a.value === form.adminType)?.label}</p>
                      )}
                    </div>
                  )}

                  {/* REGULAR FIELDS */}
                  <div className="space-y-2.5 md:space-y-3">
                    <div className="relative">
                      <input
                        name="name"
                        onChange={handleChange}
                        className="peer w-full px-3 pt-4 pb-1.5 text-sm rounded-2xl bg-slate-50 border border-blue-200 text-slate-900 placeholder-transparent focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 outline-none transition-all"
                        placeholder="Full Name"
                      />
                      <label className="absolute left-3 top-3 text-xs text-slate-600 peer-focus:text-xs peer-focus:top-1.5 peer-focus:text-blue-600 transition-all">
                        Full Name
                      </label>
                    </div>

                    <div className="relative">
                      <input
                        name="email"
                        type="email"
                        onChange={handleChange}
                        className="peer w-full px-3 pt-4 pb-1.5 text-sm rounded-2xl bg-slate-50 border border-blue-200 text-slate-900 placeholder-transparent focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 outline-none transition-all"
                        placeholder="Email"
                      />
                      <label className="absolute left-3 top-3 text-xs text-slate-600 peer-focus:text-xs peer-focus:top-1.5 peer-focus:text-blue-600 transition-all">
                        Email Address
                      </label>
                    </div>

                    <div className="relative">
                      <input
                        name="phone"
                        onChange={handleChange}
                        className="peer w-full px-3 pt-4 pb-1.5 text-sm rounded-2xl bg-slate-50 border border-blue-200 text-slate-900 placeholder-transparent focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 outline-none transition-all"
                        placeholder="Phone Number"
                      />
                      <label className="absolute left-3 top-3 text-xs text-slate-600 peer-focus:text-xs peer-focus:top-1.5 peer-focus:text-blue-600 transition-all">
                        Phone Number
                      </label>
                    </div>

                    <div className="relative">
                      <input
                        name="password"
                        type="password"
                        onChange={handleChange}
                        className="peer w-full px-3 pt-4 pb-1.5 text-sm rounded-2xl bg-slate-50 border border-blue-200 text-slate-900 placeholder-transparent focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 outline-none transition-all"
                        placeholder="Password"
                      />
                      <label className="absolute left-3 top-3 text-xs text-slate-600 peer-focus:text-xs peer-focus:top-1.5 peer-focus:text-blue-600 transition-all">
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
              className="mt-3 md:mt-4 w-full py-2.5 md:py-3 rounded-2xl bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-sm md:text-base shadow-lg shadow-blue-200/50 active:scale-[0.98] transition-all"
            >
              {form.role === "customer" 
                ? "Create Account" 
                : "Request Account (Approval Required)"}
            </button>

            <p className="text-blue-600 text-center mt-2 text-xs">{message}</p>

            <p className="mt-3 md:mt-4 text-xs text-slate-600 text-center">
              Already have an account?{" "}
              <a href="/login" className="text-blue-600 hover:underline font-semibold">
                Log in
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* OTP POPUP */}
      {otpMode && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-blue-200 p-8 rounded-3xl w-full max-w-sm shadow-2xl">
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-4">
              Verify OTP
            </h2>

            <p className="text-center text-sm text-slate-600 mb-4">
              We've sent an OTP to <strong>{form.email || form.phone}</strong>
            </p>

            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full text-center text-2xl tracking-widest p-3 bg-slate-50 text-slate-900 rounded-xl border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-400 outline-none transition-all"
              placeholder="______"
            />

            <button
              onClick={handleVerifyOtp}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-blue-200/50"
            >
              Verify OTP
            </button>

            <div className="mt-4 flex items-center justify-between gap-2">
              <button
                onClick={handleResendOtp}
                disabled={resendTimer > 0 || isResending}
                className={`flex-1 py-2 rounded-xl font-semibold text-sm transition-all ${
                  resendTimer > 0 || isResending
                    ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                    : "bg-slate-100 text-blue-600 hover:bg-slate-200"
                }`}
              >
                {isResending
                  ? "Resending..."
                  : resendTimer > 0
                  ? `Resend in ${resendTimer}s`
                  : "Resend OTP"}
              </button>
            </div>

            <p className="mt-4 text-center text-sm text-slate-600">{message}</p>
          </div>
        </div>
      )}
    </div>
  );
}