import { useState, useEffect } from "react";
import { FiSave, FiAlertCircle, FiCheck } from "react-icons/fi";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import NavbarNew from "../components/NavbarNew";
import { useRoleBasedRedirect } from "../utils/roleBasedRedirect";

export default function Settings() {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [bankDetails, setBankDetails] = useState({
    account_holder_name: "",
    account_number: "",
    ifsc_code: "",
    bank_name: "",
    account_type: "Savings",
  });

  useRoleBasedRedirect("admin");

  useEffect(() => {
    const loadUser = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (auth?.user) {
        setUser(auth.user);
      }
    };
    loadUser();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBankDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch("http://localhost:5000/admin/bank-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bankDetails),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error || "Failed to save settings");
      }
    } catch (err) {
      setError("Error saving settings: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* NAVBAR */}
      <NavbarNew />

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-10">
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2">Settings</h1>
          <p className="text-slate-600">Configure your platform and account settings</p>
        </div>

        {/* ALERTS */}
        {success && (
          <div className="mb-6 p-4 bg-green-100 border border-green-300 rounded-lg flex items-center gap-3 text-green-700">
            <FiCheck className="text-xl" />
            <p>Settings saved successfully!</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg flex items-center gap-3 text-red-700">
            <FiAlertCircle className="text-xl" />
            <p>{error}</p>
          </div>
        )}

        {/* BANK ACCOUNT SECTION */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-md">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Bank Account Settings</h2>
          <p className="text-slate-600 mb-6">
            Configure your bank account for payment settlements. Money from completed bookings will be transferred to this account.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Account Holder Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Account Holder Name *</label>
              <input
                type="text"
                name="account_holder_name"
                value={bankDetails.account_holder_name}
                onChange={handleInputChange}
                placeholder="John Doe"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                required
              />
            </div>

            {/* Account Number */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Account Number *</label>
              <input
                type="text"
                name="account_number"
                value={bankDetails.account_number}
                onChange={handleInputChange}
                placeholder="1234567890"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                required
              />
              <p className="text-xs text-slate-600 mt-1">8-17 digits</p>
            </div>

            {/* IFSC Code */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">IFSC Code *</label>
              <input
                type="text"
                name="ifsc_code"
                value={bankDetails.ifsc_code}
                onChange={handleInputChange}
                placeholder="SBIN0001234"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                required
              />
              <p className="text-xs text-slate-600 mt-1">Format: AAAA0AAAAAA</p>
            </div>

            {/* Bank Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Bank Name *</label>
              <input
                type="text"
                name="bank_name"
                value={bankDetails.bank_name}
                onChange={handleInputChange}
                placeholder="State Bank of India"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                required
              />
            </div>

            {/* Account Type */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Account Type</label>
              <select
                name="account_type"
                value={bankDetails.account_type}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option>Savings</option>
                <option>Current</option>
              </select>
            </div>

            {/* INFO BOX */}
            <div className="p-4 bg-blue-50 border border-blue-300 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> All transactions from completed bookings will be automatically transferred to this account. Ensure the account details are correct before saving.
              </p>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition shadow-md"
            >
              <FiSave /> {loading ? "Saving..." : "Save Settings"}
            </button>
          </form>
        </div>

        {/* ADDITIONAL SETTINGS */}
        <div className="mt-8 bg-white border border-slate-200 rounded-2xl p-8 shadow-md">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Other Settings</h2>
          <div className="space-y-4">
            <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
              <h3 className="font-bold text-slate-900 mb-2">Notification Settings</h3>
              <p className="text-sm text-slate-600">Manage email and SMS notifications for bookings and payments.</p>
              <button className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition">
                Configure
              </button>
            </div>

            <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
              <h3 className="font-bold text-slate-900 mb-2">Service Configuration</h3>
              <p className="text-sm text-slate-600">Add, edit, or remove car wash services offered on the platform.</p>
              <button className="mt-3 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm transition">
                Configure
              </button>
            </div>

            <div className="p-6 bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg border border-emerald-200">
              <h3 className="font-bold text-slate-900 mb-2">Pricing Configuration</h3>
              <p className="text-sm text-slate-600">Set pricing for different services and manage add-ons.</p>
              <button className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-sm transition">
                Configure
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
