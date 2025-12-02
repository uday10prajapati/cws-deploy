import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useRoleBasedRedirect } from "../utils/roleBasedRedirect";

import {
  FiMenu,
  FiBell,
  FiLogOut,
  FiChevronLeft,
  FiHome,
  FiClipboard,
  FiUser,
  FiCreditCard,
  FiAward,
  FiCheckCircle,
  FiX,
  FiMapPin
} from "react-icons/fi";
import { FaCar } from "react-icons/fa";

export default function MonthlyPass() {
  const location = useLocation();

    useRoleBasedRedirect("customer");
  /** Sidebar + Navbar UI States */
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [transactionId, setTransactionId] = useState(null);
const [paymentDetails, setPaymentDetails] = useState(null); // stores upi_link, upi_id etc.


  /** User */
  const [user, setUser] = useState(null);

  /** Active pass from backend */
  const [activePass, setActivePass] = useState(null);
  const [loadingPass, setLoadingPass] = useState(true);

  /** Modal for purchase */
  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("upi");
  const [paymentStep, setPaymentStep] = useState("method"); // "method" or "processing"
  const [paymentStatus, setPaymentStatus] = useState(null); // null, 'success', 'failed'
  const [paymentVerified, setPaymentVerified] = useState(false); // Track if payment is verified

  /** Plans */
  const plans = [
    {
      id: "basic",
      name: "Basic",
      washes: 4,
      price: 799,
      perks: ["Exterior Wash", "Priority Slots", "4 washes / month"]
    },
    {
      id: "standard",
      name: "Standard",
      washes: 8,
      price: 1499,
      perks: ["Exterior + Interior", "Pick-up optional", "8 washes / month"]
    },
    {
      id: "premium",
      name: "Premium",
      washes: 16,
      price: 2499,
      perks: ["Full Wash", "Free Add-ons", "16 washes / month"]
    }
  ];

  /** ---------- Helper functions talking to Supabase ---------- */

  // Derive a plan name based on washes (since DB doesn't store plan name)
  const getPlanNameFromWashes = (washes) => {
    if (washes >= 16) return "Premium";
    if (washes >= 8) return "Standard";
    if (washes >= 4) return "Basic";
    return "Custom";
  };

  // Get active pass for a user from backend API
  const getActivePass = async (customerId) => {
    try {
      const res = await fetch(
        `http://localhost:5000/pass/current/${customerId}`
      );
      const result = await res.json();
      
      if (result.success) {
        return result.data;
      }
      return null;
    } catch (err) {
      console.error("Error fetching pass from backend:", err);
      return null;
    }
  };

  // Create a new monthly pass via backend API
  const createMonthlyPass = async (customerId, plan) => {
    const newValidTill = new Date();
    newValidTill.setDate(newValidTill.getDate() + 30);

    try {
      const res = await fetch("http://localhost:5000/pass/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: customerId,
          total_washes: plan.washes,
          remaining_washes: plan.washes,
          valid_till: newValidTill.toISOString().split("T")[0],
        }),
      });

      const result = await res.json();
      
      if (!result.success) {
        console.error("Error creating pass:", result.error);
        return result.error;
      }
      
      console.log("✅ Pass created:", result.data);
      return null;
    } catch (err) {
      console.error("Error creating pass:", err);
      return err;
    }
  };

  // Upgrade / overwrite existing active pass via backend API
  const updateMonthlyPass = async (existingPass, plan) => {
    const newValidTill = new Date();
    newValidTill.setDate(newValidTill.getDate() + 30);

    try {
      const res = await fetch(
        `http://localhost:5000/pass/${existingPass.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            total_washes: plan.washes,
            remaining_washes: plan.washes,
            valid_till: newValidTill.toISOString().split("T")[0],
          }),
        }
      );

      const result = await res.json();
      
      if (!result.success) {
        console.error("Error updating pass:", result.error);
        return result.error;
      }
      
      console.log("✅ Pass updated:", result.data);
      return null;
    } catch (err) {
      console.error("Error updating pass:", err);
      return err;
    }
  };

  // Renew existing pass via backend API
  const renewMonthlyPass = async (existingPass) => {
    try {
      const res = await fetch(
        `http://localhost:5000/pass/renew/${existingPass.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      const result = await res.json();
      
      if (!result.success) {
        console.error("Error renewing pass:", result.error);
        return result.error;
      }
      
      console.log("✅ Pass renewed:", result.data);
      return null;
    } catch (err) {
      console.error("Error renewing pass:", err);
      return err;
    }
  };

  /** ---------- Load user + active pass on mount ---------- */
  useEffect(() => {
    const load = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) {
        console.log("⚠️ User not authenticated");
        setLoadingPass(false);
        return;
      }

      console.log("👤 Loading pass for user:", auth.user.id);
      setUser(auth.user);

      const pass = await getActivePass(auth.user.id);
      console.log("📋 Active pass result:", pass);
      setActivePass(pass);
      setLoadingPass(false);
    };

    load();
  }, []);

  /** Logout */
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  /** Buy / Upgrade Plan */
  const buyPlan = async () => {
    if (!user || !selectedPlan) return;

    // Show payment selection
    setPaymentAmount(selectedPlan.price);
    setPaymentStep("method");
    setShowPayment(true);
  };

  // Initiate payment with alternative payment gateway
  const initiateAlternativePayment = async (paymentMethod) => {
  try {
    const payload = {
      amount: paymentAmount,
      customer_id: user.id,
      customer_email: user.email,
      customer_name: user.user_metadata?.full_name || "Customer",
      customer_phone: user.user_metadata?.phone || "9999999999",
      type: "monthly_pass_purchase",
      payment_method: paymentMethod,
      notes: `${selectedPlan.name} Pass - ${selectedPlan.washes} washes`,
    };

    const response = await fetch("http://localhost:5000/alt-payment/initiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!result.success) {
      alert(`Payment initiation failed: ${result.error}`);
      return null;
    }

    // SAVE transaction & details
    setTransactionId(result.transaction_id);
    setPaymentDetails(result.paymentDetails);

    return result;
  } catch (err) {
    console.error("Payment error:", err);
    alert(`Payment error: ${err.message}`);
    return null;
  }
};


  // Generate QR code URL (using QR server API)
  const generateQRCode = (upiLink) => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiLink)}`;
    return qrUrl;
  };

  // Verify payment after user completes payment
  const verifyPayment = async (transactionId, paymentMethod, verificationData) => {
  try {
    let endpoint = "";
    let payload = { transaction_id: transactionId, ...verificationData };

    switch (paymentMethod) {
      case "upi":
        endpoint = "/alt-payment/verify-upi";
        break;
      case "bank_transfer":
        endpoint = "/alt-payment/verify-bank-transfer";
        break;
      case "net_banking":
        endpoint = "/alt-payment/verify-net-banking";
        break;
      case "card":
        endpoint = "/alt-payment/verify-card";
        break;
      default:
        return false;
    }

    const response = await fetch(`http://localhost:5000${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    return result.success;
  } catch (err) {
    console.error("Verification error:", err);
    return false;
  }
};


  // Handle payment method selection
  const handlePaymentMethodSelected = async (method) => {
    setSelectedPaymentMethod(method);
    setPaymentStep("processing");
    setPaymentStatus(null);
    setPaymentVerified(false);
    setLoading(true);

    // Initiate payment with backend
    const paymentData = await initiateAlternativePayment(method);
    if (!paymentData) {
      setLoading(false);
      setPaymentStep("method");
      return;
    }

    // Store transaction ID for verification
    setPaymentStatus("processing");
    setLoading(false);
  };

  /** Complete purchase after payment verified */
  const completePurchase = async (transactionId, paymentMethod, verificationData) => {
  setLoading(true);

  try {
    const verified = await verifyPayment(transactionId, paymentMethod, verificationData);

    if (!verified) {
      setPaymentStatus("failed");
      alert("Payment verification failed. Please try again.");
      setLoading(false);
      return;
    }

    setPaymentVerified(true);
    setPaymentStatus("success");

    const existingPass = await getActivePass(user.id);
    let error = null;

    if (!existingPass) {
      error = await createMonthlyPass(user.id, selectedPlan);
    } else {
      error = await updateMonthlyPass(existingPass, selectedPlan);
    }

    setLoading(false);

    if (error) {
      alert("Something went wrong. Please try again.");
      return;
    }

    setTimeout(async () => {
      setBuyModalOpen(false);
      setShowPayment(false);
      setPaymentStep("method");
      setPaymentStatus(null);
      setPaymentVerified(false);

      const latest = await getActivePass(user.id);
      setActivePass(latest);

      alert("Plan purchased successfully!");
    }, 2000);

  } catch (err) {
    console.error("Payment error:", err);
    setPaymentStatus("failed");
    setLoading(false);
    alert("Payment failed. Please try again.");
  }
};


  /** Renew existing active plan */
  const handleRenew = async () => {
    if (!user) {
      alert("Please log in.");
      return;
    }

    const existingPass = await getActivePass(user.id);
    if (!existingPass) {
      alert("You don't have an active pass to renew.");
      return;
    }

    setLoading(true);
    const error = await renewMonthlyPass(existingPass);
    setLoading(false);

    if (error) {
      alert("Error renewing pass. Please try again.");
      return;
    }

    const latest = await getActivePass(user.id);
    setActivePass(latest);
    alert("Pass renewed successfully!");
  };

  /** Sidebar menu items */
  const menu = [
        { name: "Home", icon: <FiHome />, link: "/" },
        { name: "My Bookings", icon: <FiClipboard />, link: "/bookings" },
        { name: "My Cars", icon: <FaCar />, link: "/my-cars" },
        { name: "Monthly Pass", icon: <FiAward />, link: "/monthly-pass" },
        { name: "Profile", icon: <FiUser />, link: "/profile" },
        { name: "Location", icon: <FiMapPin />, link: "/location" },
        { name: "Transactions", icon: <FiCreditCard />, link: "/transactions" },
      ];

  /** Derived values from activePass */
  const totalWashes = activePass?.total_washes ?? 0;
  const remainingWashes = activePass?.remaining_washes ?? 0;
  const usedWashes = totalWashes - remainingWashes;
  const progress =
    totalWashes > 0 ? Math.round((usedWashes / totalWashes) * 100) : 0;

  const activePlanName = activePass
    ? getPlanNameFromWashes(totalWashes)
    : "No Active Pass";

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-blue-950 text-white flex">
      {/* MOBILE TOP BAR */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between z-40">
        <h1 className="text-xl font-bold">CarWash+</h1>
        <FiMenu
          className="text-2xl cursor-pointer"
          onClick={() => setSidebarOpen(true)}
        />
      </div>

      {/* MOBILE BACKDROP */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-slate-900 border-r border-slate-800 shadow-2xl 
          z-50 transition-all duration-300
          ${collapsed ? "w-16" : "w-56"}
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo Row */}
        <div
          className="hidden lg:flex items-center justify-between p-4 border-b border-slate-800 cursor-pointer hover:bg-slate-800"
          onClick={() => setCollapsed(!collapsed)}
        >
          <span className="font-extrabold text-lg">
            {collapsed ? "CW" : "CarWash+"}
          </span>

          {!collapsed && <FiChevronLeft className="text-slate-400" />}
        </div>

        {/* MENU */}
        <nav className="mt-4 px-3 pb-24">
          {menu.map((item) => (
            <Link
              key={item.name}
              to={item.link}
              className={`
                flex items-center gap-4 px-3 py-2 rounded-lg 
                mb-2 font-medium transition-all
                ${
                  location.pathname === item.link
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-300 hover:bg-slate-800 hover:text-blue-400"
                }
                ${collapsed ? "justify-center" : ""}
              `}
            >
              <span className="text-xl">{item.icon}</span>
              {!collapsed && <span className="text-sm">{item.name}</span>}
            </Link>
          ))}
        </nav>

        {/* LOGOUT */}
        <div
          onClick={handleLogout}
          className={`
            absolute bottom-6 left-3 right-3 bg-red-600 hover:bg-red-700 
            text-white px-4 py-2 font-semibold rounded-lg cursor-pointer 
            flex items-center gap-3 shadow-lg
            ${collapsed ? "justify-center" : ""}
          `}
        >
          <FiLogOut />
          {!collapsed && "Logout"}
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div
        className={`flex-1 transition-all duration-300 mt-14 lg:mt-0 ${
          collapsed ? "lg:ml-16" : "lg:ml-56"
        }`}
      >
        {/* NAVBAR */}
        <header
          className="hidden lg:flex h-16 bg-slate-900/90 border-b border-blue-500/20 
          items-center justify-between px-8 sticky top-0 z-20 shadow-lg"
        >
          <h1 className="text-xl font-bold">Monthly Pass</h1>

          <div className="flex items-center gap-6">
            <FiBell className="text-xl text-slate-300" />
            <img
              src={`https://ui-avatars.com/api/?name=${
                user?.email || "User"
              }&background=3b82f6&color=fff`}
              className="w-10 h-10 rounded-full border-2 border-blue-500"
              alt="User"
            />
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="p-4 md:p-8 space-y-8">
          {/* Title */}
          <div>
            <h2 className="text-3xl font-bold">Choose Your Monthly Pass</h2>
            <p className="text-slate-400 text-sm mt-1">
              Save up to 40% with monthly plans!
            </p>
          </div>

          {/* TWO COLUMN LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT — PLANS */}
            <div className="space-y-4">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-xl hover:border-blue-500/40 transition cursor-pointer"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold">{plan.name}</h3>
                    <p className="text-blue-400 text-lg font-bold">
                      ₹{plan.price}
                    </p>
                  </div>

                  <p className="text-sm text-slate-400 mt-2">
                    {plan.washes} washes / month
                  </p>

                  <ul className="mt-3 space-y-1 text-sm">
                    {plan.perks.map((perk) => (
                      <li
                        key={perk}
                        className="flex items-center gap-2 text-slate-300"
                      >
                        <FiCheckCircle className="text-green-400" />
                        {perk}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => {
                      setSelectedPlan(plan);
                      setBuyModalOpen(true);
                    }}
                    className="mt-4 w-full px-4 py-3 bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg text-sm font-semibold transition shadow-lg"
                  >
                    💳 Buy / Upgrade
                  </button>
                </div>
              ))}
            </div>

            {/* RIGHT — ACTIVE PLAN */}
            <div className="space-y-4">
              {/* ACTIVE PASS CARD */}
              <div className="bg-linear-to-br from-amber-600/20 to-amber-900/20 border border-amber-500/30 rounded-xl p-6 shadow-xl">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FiAward className="text-amber-400" />
                  Active Pass
                </h3>

                {loadingPass ? (
                  <p className="text-sm text-slate-400">Loading pass...</p>
                ) : !activePass ? (
                  <div className="space-y-2">
                    <p className="text-sm text-slate-400">
                      You don't have an active pass yet.
                    </p>
                    <p className="text-xs text-slate-500">
                      Choose a plan from the left to get started!
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-amber-300">
                      {activePlanName} Plan
                    </p>
                    <p className="text-sm text-amber-200 mt-1">
                      {usedWashes}/{totalWashes} washes used
                    </p>

                    {/* Progress bar */}
                    <div className="w-full bg-slate-800 rounded-full h-3 mt-4 overflow-hidden">
                      <div
                        className="bg-linear-to-r from-amber-500 to-amber-400 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 text-right">{progress}% Used</p>

                    <div className="bg-slate-800/50 rounded-lg p-3 mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Expires:</span>
                        <span className="font-semibold text-amber-300">
                          {activePass.valid_till || "—"}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Remaining:</span>
                        <span className="font-semibold text-green-400">{remainingWashes} washes</span>
                      </div>
                    </div>

                    <button
                      onClick={handleRenew}
                      disabled={loading}
                      className="mt-4 w-full px-4 py-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-lg font-semibold transition"
                    >
                      {loading ? "Processing..." : "🔄 Renew Pass"}
                    </button>
                  </>
                )}
              </div>

              {/* INFO CARD */}
              <div className="bg-blue-600/10 border border-blue-500/30 rounded-xl p-4 space-y-2">
                <p className="text-sm font-semibold text-blue-300">💡 Pro Tip</p>
                <p className="text-xs text-slate-400">
                  Renew your pass before expiry to keep your benefits active without any interruption.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* PURCHASE MODAL */}
      {buyModalOpen && selectedPlan && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-6">
            {/* Header */}
            <div>
              <h3 className="text-2xl font-bold">
                Upgrade to {selectedPlan.name}
              </h3>
              <p className="text-slate-400 text-sm mt-1">
                Get {selectedPlan.washes} washes per month
              </p>
            </div>

            {/* Plan Summary */}
            <div className="bg-slate-800/50 rounded-lg p-4 space-y-3">
              <p className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Plan Summary</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Plan Name</span>
                  <span className="font-medium text-white">{selectedPlan.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Washes</span>
                  <span className="font-medium text-white">{selectedPlan.washes}/month</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Validity</span>
                  <span className="font-medium text-white">30 Days</span>
                </div>
              </div>
            </div>

            {/* Price Card */}
            <div className="bg-linear-to-r from-blue-600/20 to-blue-900/20 border border-blue-500/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-300">Base Price:</span>
                <span className="font-semibold">₹{Math.round(selectedPlan.price / 1.18)}</span>
              </div>
              <div className="flex justify-between text-sm pb-2 border-b border-blue-500/30">
                <span className="text-slate-300">GST (18%):</span>
                <span className="font-semibold">₹{Math.round(selectedPlan.price - selectedPlan.price / 1.18)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-300 font-bold">Total:</span>
                <span className="text-3xl font-bold text-blue-300">₹{selectedPlan.price}</span>
              </div>
            </div>

            {/* Perks List */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-300 uppercase tracking-wider">What You Get</p>
              <div className="space-y-1 text-sm">
                {selectedPlan.perks.map((perk) => (
                  <div key={perk} className="flex items-center gap-2 text-slate-300">
                    <FiCheckCircle className="text-green-400 shrink-0" />
                    {perk}
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setBuyModalOpen(false)}
                className="flex-1 px-4 py-3 rounded-lg border border-slate-600 hover:bg-slate-800 font-medium transition"
              >
                Cancel
              </button>

              <button
                onClick={buyPlan}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 rounded-lg text-white font-semibold transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>💳 Proceed to Pay</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ▓▓▓ PAYMENT PAGE ▓▓▓ */}
      {showPayment && selectedPlan && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            {paymentStep === "method" ? (
              // PAYMENT METHOD SELECTION
              <>
                {/* Header */}
                <div>
                  <h2 className="text-2xl font-bold">🛒 Confirm Purchase</h2>
                  <p className="text-slate-400 text-sm mt-1">Select your preferred payment method</p>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => setShowPayment(false)}
                  className="absolute top-6 right-6 text-slate-400 hover:text-white transition"
                >
                  <FiX className="text-2xl" />
                </button>

                {/* Plan Details Card */}
                <div className="space-y-3 bg-slate-800/50 rounded-lg p-4">
                  <p className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Plan Details</p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Plan Name</span>
                      <span className="text-white font-medium capitalize">{selectedPlan.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Washes</span>
                      <span className="text-white font-medium">{selectedPlan.washes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Validity</span>
                      <span className="text-white font-medium">30 Days</span>
                    </div>
                  </div>
                </div>

                {/* Amount Breakdown Card */}
                <div className="bg-blue-600/20 border border-blue-500/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Subtotal:</span>
                    <span className="font-semibold">
                      ₹{Math.round(paymentAmount / 1.18)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm pb-2 border-b border-blue-500/30">
                    <span className="text-slate-300">GST (18%):</span>
                    <span className="font-semibold">
                      ₹{Math.round(paymentAmount - paymentAmount / 1.18)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-300 font-bold">Total Amount:</span>
                    <span className="text-lg font-bold text-blue-300">
                      ₹{paymentAmount}
                    </span>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Payment Methods</p>
                  
                  <div className="space-y-2">
                    {[
                      { id: "upi", label: "📱 UPI", desc: "Google Pay, PhonePe, PayTM" },
                      { id: "card", label: "💳 Card", desc: "Visa, MasterCard, Rupay" },
                      { id: "wallet", label: "👛 Wallet", desc: "CarWash+ Wallet Balance" },
                      { id: "netbanking", label: "🏦 Net Banking", desc: "All major Indian banks" },
                    ].map((method) => (
                      <button
                        key={method.id}
                        onClick={() => handlePaymentMethodSelected(method.id)}
                        className="w-full flex items-center justify-between gap-3 p-4 border border-slate-700 hover:border-blue-500 hover:bg-blue-600/10 rounded-lg transition text-left"
                      >
                        <div>
                          <p className="font-semibold text-white">{method.label}</p>
                          <p className="text-xs text-slate-400">{method.desc}</p>
                        </div>
                        <span className="text-xl">→</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cancel Button */}
                <button
                  onClick={() => setShowPayment(false)}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
              </>
            ) : (
              // PAYMENT PROCESSING
              <>
                {/* SUCCESS MESSAGE - Show when payment verified */}
                {paymentVerified && paymentStatus === "success" && (
                  <div className="text-center space-y-6">
                    <div className="bg-green-600/20 border border-green-500/50 rounded-xl p-6 flex flex-col items-center gap-4 animate-pulse">
                      <div className="text-5xl">✅</div>
                      <div>
                        <h3 className="font-bold text-green-300 mb-1 text-xl">Payment Successful!</h3>
                        <p className="text-sm text-green-200">Amount received in your account.</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm text-slate-400">Completing your purchase...</p>
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                        <span className="text-sm text-slate-400">Processing</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* FAILURE MESSAGE - Show when payment fails */}
                {paymentStatus === "failed" && (
                  <div className="text-center space-y-6">
                    <div className="bg-red-600/20 border border-red-500/50 rounded-xl p-6 flex flex-col items-center gap-4">
                      <div className="text-5xl">❌</div>
                      <div>
                        <h3 className="font-bold text-red-300 mb-1 text-xl">Payment Failed</h3>
                        <p className="text-sm text-red-200">Unable to verify payment. Please try again.</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setPaymentStep("method")}
                      className="w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-semibold transition"
                    >
                      Try Another Method
                    </button>
                  </div>
                )}

                {/* PAYMENT METHODS PROCESSING - Show only if not verified yet */}
                {!paymentVerified && paymentStatus !== "failed" && (
                  <>
                {selectedPaymentMethod === "upi" ? (
                  // UPI QR CODE
                  <div className="text-center space-y-6">
                    <h2 className="text-2xl font-bold">📱 Scan to Pay with UPI</h2>
                    
                    <div className="bg-white p-6 rounded-xl">
                      <img 
                        src={generateQRCode(paymentDetails?.upi_link || "")} 
                        alt="UPI QR Code" 
                        className="w-64 h-64 mx-auto"
                      />
                    </div>

                    <div className="space-y-2">
                      <p className="text-slate-400">Scan with any UPI app:</p>
                      <p className="text-sm text-slate-500">Google Pay • PhonePe • PayTM</p>
                    </div>

                    <div className="bg-blue-600/20 border border-blue-500/50 rounded-lg p-4">
                      <p className="text-lg font-bold text-blue-300">Amount: ₹{paymentAmount}</p>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-slate-300">Enter UTR Number after payment:</label>
                      <input 
                        type="text" 
                        placeholder="UTR / Reference number (e.g., 123456789012)"
                        id="upi-utr"
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-green-500 focus:outline-none text-white"
                      />
                    </div>

                    <button
  onClick={async () => {
    const utr = document.getElementById("upi-utr")?.value?.trim();

    if (!utr) {
      alert("Please enter UTR number");
      return;
    }

    const verified = await verifyPayment(
      transactionId,
      "upi",
      { utr, payment_timestamp: new Date().toISOString() }
    );

    if (verified) {
      setPaymentVerified(true);
      setPaymentStatus("success");

      await completePurchase(transactionId, "upi", { utr });
    } else {
      alert("Payment verification failed. Please check UTR and try again.");
    }
  }}
  className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition"
>
  ✓ Verify Payment
</button>


                    <button
                      onClick={() => {
                        setPaymentStep("method");
                      }}
                      className="w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-semibold transition"
                    >
                      Use Different Method
                    </button>
                  </div>
                ) : selectedPaymentMethod === "card" ? (
                  // CARD PAYMENT
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-center">💳 Card Payment</h2>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Card Number</label>
                        <input 
                          type="text" 
                          placeholder="1234 5678 9012 3456" 
                          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-blue-500 focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Expiry</label>
                          <input 
                            type="text" 
                            placeholder="MM/YY" 
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">CVV</label>
                          <input 
                            type="text" 
                            placeholder="123" 
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-purple-600/20 border border-purple-500/50 rounded-lg p-4 text-center">
                      <p className="text-lg font-bold text-purple-300">Amount: ₹{paymentAmount}</p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setPaymentStep("method")}
                        className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-semibold transition"
                      >
                        Back
                      </button>
                      <button
                        className="flex-1 py-3 bg-linear-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                      >
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Processing...
                      </button>
                    </div>
                  </div>
                ) : selectedPaymentMethod === "wallet" ? (
                  // WALLET PAYMENT
                  <div className="text-center space-y-6">
                    <h2 className="text-2xl font-bold">👛 Wallet Payment</h2>
                    
                    <div className="bg-green-600/20 border border-green-500/50 rounded-lg p-6 space-y-2">
                      <p className="text-slate-400">Paying from:</p>
                      <p className="text-2xl font-bold text-green-300">₹{paymentAmount}</p>
                      <p className="text-sm text-slate-400">CarWash+ Wallet</p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm text-slate-400">Processing wallet payment...</p>
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-sm text-slate-400">Deducting funds</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setPaymentStep("method")}
                      className="w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-semibold transition"
                    >
                      Use Different Method
                    </button>
                  </div>
                ) : (
                  // NET BANKING
                  <div className="text-center space-y-6">
                    <h2 className="text-2xl font-bold">🏦 Net Banking</h2>
                    
                    <div className="space-y-3">
                      <p className="text-slate-400">Select your bank:</p>
                      <div className="grid grid-cols-2 gap-3">
                        {["HDFC", "ICICI", "Axis", "SBI", "BOI", "Kotak"].map((bank) => (
                          <button
                            key={bank}
                            className="py-3 bg-slate-800 hover:bg-orange-600/30 border border-slate-700 hover:border-orange-500 rounded-lg font-medium transition"
                          >
                            {bank}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-orange-600/20 border border-orange-500/50 rounded-lg p-4">
                      <p className="text-lg font-bold text-orange-300">Amount: ₹{paymentAmount}</p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setPaymentStep("method")}
                        className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-semibold transition"
                      >
                        Back
                      </button>
                    </div>
                  </div>
                )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}