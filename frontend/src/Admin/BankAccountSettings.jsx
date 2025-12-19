import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRoleBasedRedirect } from "../utils/roleBasedRedirect";
import {
  FiCreditCard,
  FiCheck,
  FiAlertCircle,
  FiRefreshCw,
  FiEye,
  FiEyeOff,
  FiX,
} from "react-icons/fi";
import { supabase } from "../supabaseClient";
import NavbarNew from "../components/NavbarNew";

const API_BASE = "http://localhost:5000";

export default function BankAccountSettings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bankAccount, setBankAccount] = useState(null);
  const [verified, setVerified] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showFullAccount, setShowFullAccount] = useState(false);
  const [verifyAmounts, setVerifyAmounts] = useState({
    deposit1: "",
    deposit2: "",
  });

  const [formData, setFormData] = useState({
    account_holder_name: "",
    account_number: "",
    ifsc_code: "",
    bank_name: "",
    account_type: "Savings",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useRoleBasedRedirect("admin");

  // Fetch current bank account on load
  useEffect(() => {
    const loadUser = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (auth?.user) {
        setUser(auth.user);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    fetchBankAccount();
  }, []);

  const fetchBankAccount = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/bank-account`);
      const data = await response.json();

      if (data.success) {
        setBankAccount(data.bank_account);
        setVerified(data.bank_account.verified || false);
        setFormData({
          account_holder_name: data.bank_account.account_holder_name,
          account_number: data.bank_account.account_number,
          ifsc_code: data.bank_account.ifsc_code,
          bank_name: data.bank_account.bank_name,
          account_type: data.bank_account.account_type,
        });
      }
    } catch (err) {
      console.error("Error fetching bank account:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Validation
      if (
        !formData.account_holder_name ||
        !formData.account_number ||
        !formData.ifsc_code ||
        !formData.bank_name
      ) {
        setError("All fields are required");
        setLoading(false);
        return;
      }

      // IFSC validation
      const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
      if (!ifscRegex.test(formData.ifsc_code)) {
        setError("Invalid IFSC code. Format: AAAA0AAAAAA (e.g., HDFC0000123)");
        setLoading(false);
        return;
      }

      // Account number validation
      const accountRegex = /^\d{8,17}$/;
      if (!accountRegex.test(formData.account_number)) {
        setError("Invalid account number. Must be 8-17 digits");
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE}/admin/bank-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setBankAccount(data.bank_account);
        setSuccess(
          "Bank account details saved! Please verify using microdeposits."
        );
        setShowForm(false);
        setShowVerify(true);
        setVerified(false);
        setTimeout(() => setSuccess(""), 5000);
      } else {
        setError(data.error || "Failed to save bank account");
      }
    } catch (err) {
      setError("Error saving bank account: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!verifyAmounts.deposit1 || !verifyAmounts.deposit2) {
        setError("Both deposit amounts are required");
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE}/admin/verify-bank-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deposit1_amount: parseFloat(verifyAmounts.deposit1),
          deposit2_amount: parseFloat(verifyAmounts.deposit2),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setVerified(true);
        setBankAccount(data.bank_account);
        setSuccess("✅ Bank account verified successfully!");
        setShowVerify(false);
        setVerifyAmounts({ deposit1: "", deposit2: "" });
        setTimeout(() => setSuccess(""), 5000);
      } else {
        setError(data.error || "Verification failed");
      }
    } catch (err) {
      setError("Error verifying bank account: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <NavbarNew />
      
      <main className="flex-1 overflow-auto">
        <div className="p-4 md:p-6 max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <FiCreditCard className="text-blue-600 text-4xl" />
              Bank Account Setup
            </h1>
            <p className="text-slate-600 mt-2">
              Configure your bank account for payment settlement
            </p>
          </div>

          {/* Status Card */}
          <div
            className={`rounded-lg p-6 mb-6 border-2 ${
              verified
                ? "bg-green-50 border-green-200"
                : "bg-amber-50 border-amber-200"
            }`}
          >
            <div className="flex items-start gap-4">
              {verified ? (
                <>
                  <FiCheck className="text-green-600 text-2xl shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-green-700">Verified ✅</p>
                    <p className="text-green-600 text-sm mt-1">
                      Your bank account is verified. All payments will settle to
                      this account.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <FiAlertCircle className="text-amber-600 text-2xl shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-amber-700">
                      {bankAccount
                        ? "Pending Verification"
                        : "Not Configured"}
                    </p>
                    <p className="text-amber-600 text-sm mt-1">
                      {bankAccount
                        ? "Verify using microdeposits from Razorpay"
                        : "Add your bank account details to receive payments"}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Current Bank Account Info */}
          {bankAccount && !showForm && (
            <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Current Account Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-600 text-sm">Account Holder</p>
                  <p className="text-slate-900 font-semibold">
                    {bankAccount.account_holder_name}
                  </p>
                </div>

                <div>
                  <p className="text-slate-600 text-sm">Bank Name</p>
                  <p className="text-slate-900 font-semibold">
                    {bankAccount.bank_name}
                  </p>
                </div>

                <div>
                  <p className="text-slate-600 text-sm">Account Type</p>
                  <p className="text-slate-900 font-semibold">
                    {bankAccount.account_type}
                  </p>
                </div>

                <div>
                  <p className="text-slate-600 text-sm">IFSC Code</p>
                  <p className="text-slate-900 font-semibold">
                    {bankAccount.ifsc_code}
                  </p>
                </div>

                <div className="md:col-span-2">
                  <p className="text-slate-600 text-sm">Account Number</p>
                  <div className="flex items-center gap-2">
                    <p className="text-slate-900 font-semibold">
                      {showFullAccount
                        ? bankAccount.account_number
                        : "**** " + bankAccount.account_number.slice(-4)}
                    </p>
                    <button
                      onClick={() => setShowFullAccount(!showFullAccount)}
                      className="text-slate-600 hover:text-blue-600 transition"
                    >
                      {showFullAccount ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Settlement Info */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-700 text-sm font-semibold mb-2">
                  💰 Settlement Information
                </p>
                <ul className="text-blue-600 text-sm space-y-1">
                  <li>✓ Payments settle T+1 (next business day)</li>
                  <li>✓ Automatic daily settlement of verified transactions</li>
                  <li>✓ Razorpay processes settlements daily</li>
                  <li>✓ No manual intervention needed</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowForm(true)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <FiRefreshCw /> Update Details
                </button>
                {!verified && (
                  <button
                    onClick={() => setShowVerify(true)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2"
                  >
                    <FiCheck /> Verify Account
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Bank Account Form */}
          {showForm && (
            <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                {bankAccount ? "Update" : "Add"} Bank Account
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-slate-700 text-sm font-medium mb-2">
                Account Holder Name *
              </label>
              <input
                type="text"
                name="account_holder_name"
                value={formData.account_holder_name}
                onChange={handleInputChange}
                placeholder="Your name as per bank records"
                className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-slate-700 text-sm font-medium mb-2">
                Bank Name *
              </label>
              <input
                type="text"
                name="bank_name"
                value={formData.bank_name}
                onChange={handleInputChange}
                placeholder="e.g., HDFC Bank, ICICI Bank"
                className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 text-sm font-medium mb-2">
                  Account Type *
                </label>
                <select
                  name="account_type"
                  value={formData.account_type}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:border-blue-500 transition"
                >
                  <option value="Savings">Savings</option>
                  <option value="Current">Current</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 text-sm font-medium mb-2">
                  IFSC Code *
                </label>
                <input
                  type="text"
                  name="ifsc_code"
                  value={formData.ifsc_code}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ifsc_code: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="e.g., HDFC0000001"
                  maxLength="11"
                  className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 text-sm font-medium mb-2">
                Account Number *
              </label>
              <input
                type="text"
                name="account_number"
                value={formData.account_number}
                onChange={handleInputChange}
                placeholder="8-17 digit account number"
                maxLength="17"
                className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                ⚠️ {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold py-2 rounded-lg transition"
              >
                {loading ? "Saving..." : "Save Account"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 bg-slate-300 hover:bg-slate-400 text-slate-900 font-semibold py-2 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
              </form>
            </div>
          )}

          {/* Verification Form */}
          {showVerify && !verified && (
            <div className="bg-white border border-amber-200 rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Verify Bank Account
              </h2>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <p className="text-amber-700 text-sm font-semibold mb-2">
                  📋 How Verification Works:
                </p>
                <ol className="text-amber-600 text-sm space-y-1 ml-4 list-decimal">
                  <li>Razorpay sends 2 small deposits (₹1-5) to your account</li>
                  <li>Check your bank statement in 1-2 business days</li>
                  <li>Enter the exact amounts below</li>
                  <li>Your account will be verified ✅</li>
                </ol>
              </div>

              <form onSubmit={handleVerify} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 text-sm font-medium mb-2">
                    First Deposit Amount (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={verifyAmounts.deposit1}
                    onChange={(e) =>
                      setVerifyAmounts({
                        ...verifyAmounts,
                        deposit1: e.target.value,
                      })
                    }
                    placeholder="e.g., 2.50"
                    className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 text-sm font-medium mb-2">
                    Second Deposit Amount (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={verifyAmounts.deposit2}
                    onChange={(e) =>
                      setVerifyAmounts({
                        ...verifyAmounts,
                        deposit2: e.target.value,
                      })
                    }
                    placeholder="e.g., 3.75"
                    className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                  ⚠️ {error}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2"
                >
                  {loading ? "Verifying..." : <>
                    <FiCheck /> Verify
                  </>}
                </button>
                <button
                  type="button"
                  onClick={() => setShowVerify(false)}
                  className="flex-1 bg-slate-300 hover:bg-slate-400 text-slate-900 font-semibold py-2 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
              </form>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 text-sm mb-6">
              ✅ {success}
            </div>
          )}

          {/* Initial Setup */}
          {!bankAccount && !showForm && (
            <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
              <FiCreditCard className="text-6xl text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                No Bank Account Configured
              </h3>
              <p className="text-slate-600 mb-6">
                Add your bank account to start receiving payments
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition inline-flex items-center gap-2"
              >
                <FiCreditCard /> Add Bank Account
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
