import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiMail, FiLock, FiArrowLeft, FiCheckCircle, FiAlertCircle, FiClock } from "react-icons/fi";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);

  // Step 1: Send OTP to Email
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/send-password-reset-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Response is not JSON:", text);
        setError("Server error: Invalid response. Check if backend is running.");
        setLoading(false);
        return;
      }

      if (!response.ok) {
        setError(data.message || "Failed to send OTP");
        setLoading(false);
        return;
      }

      setSuccess("Verification code sent to your email!");
      setStep(2);
      setOtpTimer(600); // 10 minutes timer
      startOtpTimer();
    } catch (err) {
      setError("Error sending OTP: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Start countdown timer for OTP
  const startOtpTimer = () => {
    const interval = setInterval(() => {
      setOtpTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setError("OTP has expired. Please request a new one.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Format timer display
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!otp.trim()) {
      setError("Please enter the 6-digit code");
      return;
    }

    if (otp.length !== 6) {
      setError("Code must be 6 digits");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/verify-password-reset-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp }),
        }
      );

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Response is not JSON:", text);
        setError("Server error: Invalid response. Check if backend is running.");
        setLoading(false);
        return;
      }

      if (!response.ok) {
        setError(data.message || "Failed to verify OTP");
        setLoading(false);
        return;
      }

      setSuccess("Code verified! Now create your new password.");
      setStep(3);
      setOtp(""); // Clear OTP field
    } catch (err) {
      setError("Error verifying OTP: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!newPassword.trim()) {
      setError("Please enter a new password");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (!confirmPassword.trim()) {
      setError("Please confirm your password");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, newPassword }),
        }
      );

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Response is not JSON:", text);
        setError("Server error: Invalid response. Check if backend is running.");
        setLoading(false);
        return;
      }

      if (!response.ok) {
        setError(data.message || "Failed to reset password");
        setLoading(false);
        return;
      }

      setSuccess("Password reset successfully! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError("Error resetting password: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/send-password-reset-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Response is not JSON:", text);
        setError("Server error: Invalid response. Check if backend is running.");
        setLoading(false);
        return;
      }

      if (!response.ok) {
        setError(data.message || "Failed to resend OTP");
        setLoading(false);
        return;
      }

      setSuccess("New verification code sent to your email!");
      setOtp("");
      setOtpTimer(600); // Reset timer to 10 minutes
      startOtpTimer();
    } catch (err) {
      setError("Error resending OTP: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 px-4 py-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute -bottom-8 right-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>

      <div className="relative z-10 w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={() => navigate("/login")}
          className="flex items-center gap-2 text-white hover:text-blue-400 transition mb-8 text-sm font-medium"
        >
          <FiArrowLeft size={18} />
          Back to Login
        </button>

        {/* Main Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8 md:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <FiLock className="text-white text-2xl" />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Reset Password</h1>
            <p className="text-blue-200 text-sm">
              {step === 1 && "Enter your email to get started"}
              {step === 2 && "Enter the code sent to your email"}
              {step === 3 && "Create a strong new password"}
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-10">
            {[1, 2, 3].map((stepNum) => (
              <React.Fragment key={stepNum}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${
                      step > stepNum
                        ? "bg-green-500 text-white shadow-lg shadow-green-500/50"
                        : step === stepNum
                        ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/50"
                        : "bg-white/10 text-white/50 border border-white/20"
                    }`}
                  >
                    {step > stepNum ? (
                      <FiCheckCircle size={20} />
                    ) : (
                      stepNum
                    )}
                  </div>
                  <p
                    className={`text-xs font-semibold mt-2 transition-colors ${
                      step >= stepNum ? "text-blue-400" : "text-white/50"
                    }`}
                  >
                    {stepNum === 1 ? "Email" : stepNum === 2 ? "Code" : "Password"}
                  </p>
                </div>
                {stepNum < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition-colors duration-300 ${
                      step > stepNum ? "bg-green-500" : "bg-white/10"
                    }`}
                  ></div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-start gap-3 animate-slideDown">
              <FiAlertCircle className="text-red-400 mt-0.5 flex-shrink-0" size={18} />
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* Success Alert */}
          {success && (
            <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-xl flex items-start gap-3 animate-slideDown">
              <FiCheckCircle className="text-green-400 mt-0.5 flex-shrink-0" size={18} />
              <p className="text-green-200 text-sm">{success}</p>
            </div>
          )}

          {/* Step 1: Email Input */}
          {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-6 animate-fadeIn">
            <div className="space-y-2">
              <label htmlFor="email" className="block font-semibold text-white text-sm">
                Email Address
              </label>
              <div className="relative">
                <FiMail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-400 pointer-events-none" size={18} />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  disabled={loading}
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 text-sm focus:outline-none focus:border-blue-500 focus:bg-white/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-blue-200">
                We'll send a 6-digit verification code to this email.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-3 rounded-lg transition duration-300 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-500/50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Sending Code...
                </span>
              ) : (
                "Send Verification Code"
              )}
            </button>

            <p className="text-center text-sm text-blue-200">
              Remember your password?{" "}
              <a href="/login" className="text-white font-semibold hover:text-blue-300 transition">
                Back to Login
              </a>
            </p>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-6 animate-fadeIn">
            <div className="space-y-3">
              <label htmlFor="otp" className="block font-semibold text-white text-sm">
                Verification Code
              </label>
              <input
                type="text"
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                maxLength="6"
                disabled={loading || otpTimer === 0}
                className="w-full px-4 py-4 bg-white/10 border-2 border-white/20 rounded-lg text-center text-4xl font-mono font-bold tracking-widest text-white placeholder-white/30 focus:outline-none focus:border-blue-500 focus:bg-white/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-blue-200">
                Enter the 6-digit code sent to <span className="font-semibold">{email}</span>
              </p>
              <div className={`flex items-center gap-2 text-sm font-semibold ${otpTimer > 0 ? "text-blue-400" : "text-red-400"}`}>
                <FiClock size={16} />
                {otpTimer > 0 ? (
                  <>Code expires in: <span className="font-mono">{formatTimer(otpTimer)}</span></>
                ) : (
                  <span>Code has expired - Request a new one</span>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otpTimer === 0}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-3 rounded-lg transition duration-300 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-500/50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Verifying...
                </span>
              ) : (
                "Verify Code"
              )}
            </button>

            <button
              type="button"
              onClick={handleResendOtp}
              disabled={loading}
              className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-blue-300 hover:text-blue-200 font-semibold py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Didn't receive code? Resend
            </button>

            <button
              type="button"
              onClick={() => {
                setStep(1);
                setOtp("");
                setError("");
                setSuccess("");
              }}
              disabled={loading}
              className="w-full bg-transparent text-blue-300 hover:text-blue-200 font-semibold py-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Change Email Address
            </button>
          </form>
        )}

        {/* Step 3: New Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-6 animate-fadeIn">
            <div className="space-y-2">
              <label htmlFor="newPassword" className="block font-semibold text-white text-sm">
                New Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-400 pointer-events-none" size={18} />
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  disabled={loading}
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 text-sm focus:outline-none focus:border-blue-500 focus:bg-white/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-blue-200">
                Must be at least 6 characters long.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block font-semibold text-white text-sm">
                Confirm Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-400 pointer-events-none" size={18} />
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  disabled={loading}
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 text-sm focus:outline-none focus:border-blue-500 focus:bg-white/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-3 rounded-lg transition duration-300 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-500/50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Updating Password...
                </span>
              ) : (
                "Reset Password"
              )}
            </button>

            <p className="text-center text-sm text-blue-200">
              Remember your password?{" "}
              <a href="/login" className="text-white font-semibold hover:text-blue-300 transition">
                Back to Login
              </a>
            </p>
          </form>
        )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
