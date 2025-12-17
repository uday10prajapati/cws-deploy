import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600 px-4 py-8">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          Reset Password
        </h1>

        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-8 gap-2">
          {/* Step 1 */}
          <div className="flex flex-col items-center gap-2 flex-1">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
                step >= 1
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              1
            </div>
            <p
              className={`text-xs font-semibold text-center transition-colors ${
                step >= 1 ? "text-blue-600" : "text-gray-500"
              }`}
            >
              Email
            </p>
          </div>

          {/* Progress Line */}
          <div
            className={`flex-1 h-0.5 transition-colors ${
              step >= 2 ? "bg-blue-600" : "bg-gray-200"
            }`}
          ></div>

          {/* Step 2 */}
          <div className="flex flex-col items-center gap-2 flex-1">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
                step >= 2
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              2
            </div>
            <p
              className={`text-xs font-semibold text-center transition-colors ${
                step >= 2 ? "text-blue-600" : "text-gray-500"
              }`}
            >
              Code
            </p>
          </div>

          {/* Progress Line */}
          <div
            className={`flex-1 h-0.5 transition-colors ${
              step >= 3 ? "bg-blue-600" : "bg-gray-200"
            }`}
          ></div>

          {/* Step 3 */}
          <div className="flex flex-col items-center gap-2 flex-1">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
                step >= 3
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              3
            </div>
            <p
              className={`text-xs font-semibold text-center transition-colors ${
                step >= 3 ? "text-blue-600" : "text-gray-500"
              }`}
            >
              Password
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700 text-sm rounded animate-slideDown">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-3 bg-green-100 border-l-4 border-green-500 text-green-700 text-sm rounded animate-slideDown">
            {success}
          </div>
        )}

        {/* Step 1: Email Input */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="block font-semibold text-gray-700 text-sm">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={loading}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500"
              />
              <p className="text-xs text-gray-600">
                We'll send a 6-digit verification code to this email.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition disabled:cursor-not-allowed"
            >
              {loading ? "Sending Code..." : "Send Verification Code"}
            </button>

            <p className="text-center text-sm text-gray-600">
              Remember your password?{" "}
              <a href="/login" className="text-blue-600 font-semibold hover:text-blue-700">
                Back to Login
              </a>
            </p>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="otp" className="block font-semibold text-gray-700 text-sm">
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-center text-2xl font-mono font-bold tracking-widest focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500"
              />
              <p className="text-xs text-gray-600">
                Enter the 6-digit code sent to <strong>{email}</strong>
              </p>
              <p className={`text-xs font-semibold ${otpTimer > 0 ? "text-blue-600" : "text-red-600"}`}>
                {otpTimer > 0 ? (
                  <>Code expires in: <strong>{formatTimer(otpTimer)}</strong></>
                ) : (
                  <span>Code has expired</span>
                )}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || otpTimer === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition disabled:cursor-not-allowed"
            >
              {loading ? "Verifying..." : "Verify Code"}
            </button>

            <button
              type="button"
              onClick={handleResendOtp}
              disabled={loading}
              className="w-full bg-transparent text-blue-600 hover:text-blue-700 font-semibold py-2 transition disabled:text-gray-400 disabled:cursor-not-allowed underline"
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
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 rounded-lg transition disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              Change Email
            </button>
          </form>
        )}

        {/* Step 3: New Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="newPassword" className="block font-semibold text-gray-700 text-sm">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                disabled={loading}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500"
              />
              <p className="text-xs text-gray-600">
                Must be at least 6 characters long.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block font-semibold text-gray-700 text-sm">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                disabled={loading}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition disabled:cursor-not-allowed"
            >
              {loading ? "Updating Password..." : "Reset Password"}
            </button>

            <p className="text-center text-sm text-gray-600">
              Remember your password?{" "}
              <a href="/login" className="text-blue-600 font-semibold hover:text-blue-700">
                Back to Login
              </a>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
