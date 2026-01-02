import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useRoleBasedRedirect } from "../utils/roleBasedRedirect";
import NavbarNew from "../components/NavbarNew";

import {
  FiAward,
  FiCheckCircle,
  FiX,
  FiCreditCard,
} from "react-icons/fi";
import { FaCar } from "react-icons/fa";

export default function MonthlyPass() {
  useRoleBasedRedirect("customer");
  const [transactionId, setTransactionId] = useState(null);
const [paymentDetails, setPaymentDetails] = useState(null); // stores upi_link, upi_id etc.


  /** User */
  const [user, setUser] = useState(null);
  const [cars, setCars] = useState([]);

  /** Active pass from backend */
  const [activePass, setActivePass] = useState(null);
  const [loadingPass, setLoadingPass] = useState(true);

  /** Modal for purchase */
  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedCar, setSelectedCar] = useState(null);
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
      washes: "Daily wash",
      price: 1199,
      perks: ["Daily car Wash / month"]
    },
    {
      id: "standard",
      name: "Standard",
      washes: "Daily wash",
      price: 3399,
      perks: ["Daily car Wash / 3 months"]
    },
    {
      id: "premium",
      name: "Premium",
      washes: "Daily wash",
      price: 6499,
      perks: ["Daily car wash / 6 months"]
    },
    {
      id: "quick",
      name: "Quick Wash",
      washes: "Quick Wash",
      price: 149,
      perks: ["Quick Wash"]
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

  // Get active pass for a specific car from backend API
  const getActivePassForCar = async (customerId, carId) => {
    if (!customerId || !carId) return null;
    try {
      const res = await fetch(
        `http://localhost:5000/pass/car/${customerId}/${carId}`
      );
      const result = await res.json();
      
      if (result.success) {
        return result.data;
      }
      return null;
    } catch (err) {
      console.error("Error fetching car pass from backend:", err);
      return null;
    }
  };

  // Create a new monthly pass via backend API
  const createMonthlyPass = async (customerId, plan, carId) => {
    const newValidTill = new Date();
    newValidTill.setDate(newValidTill.getDate() + 30);

    try {
      const res = await fetch("http://localhost:5000/pass/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: customerId,
          car_id: carId || null,
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

  /** ---------- Load user + cars + active pass on mount ---------- */
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

      // Load cars from backend API
      try {
        const carResponse = await fetch(
          `http://localhost:5000/cars/${auth.user.id}`
        );
        const carResult = await carResponse.json();
        const carList = carResult.success ? carResult.data || [] : [];
        setCars(carList);
        // Preselect first car if available
        if (carList && carList.length > 0) {
          setSelectedCar(carList[0]);
        }
      } catch (err) {
        console.error("Error loading cars:", err);
      }

      setLoadingPass(false);
    };

    load();
  }, []);

  /** Load active pass when selected car changes */
  useEffect(() => {
    const loadPassForCar = async () => {
      if (!user || !selectedCar) {
        setActivePass(null);
        return;
      }

      setLoadingPass(true);
      const pass = await getActivePassForCar(user.id, selectedCar.id);
      setActivePass(pass);
      setLoadingPass(false);
    };

    loadPassForCar();
  }, [user, selectedCar]);

  /** Buy / Upgrade Plan */
  const buyPlan = async () => {
    if (!user || !selectedPlan) return;
    
    // Validate car selection
    if (!selectedCar) {
      alert("Please select a car for this pass");
      return;
    }

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
      customer_name: user.user_metadata?.name || "Customer",
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

    const existingPass = await getActivePassForCar(user.id, selectedCar?.id);
    let error = null;

    if (!existingPass) {
      error = await createMonthlyPass(user.id, selectedPlan, selectedCar?.id);
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

      const latest = await getActivePassForCar(user.id, selectedCar?.id);
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

    const existingPass = await getActivePassForCar(user.id, selectedCar?.id);
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

    const latest = await getActivePassForCar(user.id, selectedCar?.id);
    setActivePass(latest);
    alert("Pass renewed successfully!");
  };

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
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* NAVBAR */}
      <NavbarNew />

      {/* PAGE CONTENT */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 space-y-8">
        {/* Title */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-linear-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/40">
                <FiCreditCard />
              </span>
              <span>Monthly Pass</span>
            </h2>
            <p className="text-slate-600 text-sm md:text-base mt-2 max-w-xl">
              Save more on regular washes. Pick a plan and link it to your car for quick, discounted bookings.
            </p>
          </div>
        </div>

        {/* TWO COLUMN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT — PLANS */}
          <div className="space-y-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md hover:shadow-xl hover:border-blue-300 transition cursor-pointer"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-slate-900">
                    {plan.name}
                  </h3>
                  <p className="text-blue-600 text-lg font-bold">
                    ₹{plan.price}
                  </p>
                </div>

                <p className="text-sm text-slate-600 mt-2">
                  {plan.washes} washes / month
                </p>

                <ul className="mt-3 space-y-1 text-sm">
                  {plan.perks.map((perk) => (
                    <li
                      key={perk}
                      className="flex items-center gap-2 text-slate-700"
                    >
                      <FiCheckCircle className="text-emerald-500" />
                      {perk}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => {
                    setSelectedPlan(plan);
                    setSelectedCar(null); // Reset car selection in modal
                    setBuyModalOpen(true);
                  }}
                  className="mt-4 w-full px-4 py-3 bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg text-sm font-semibold text-white transition shadow-sm hover:shadow-md"
                >
                  💳 Buy / Upgrade
                </button>
              </div>
            ))}
          </div>

          {/* RIGHT — ACTIVE PLAN */}
          <div className="space-y-4">
            {/* ACTIVE PASS CARD */}
            <div className="bg-linear-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 shadow-md">
              <div className="flex items-center justify-between mb-3 gap-2">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-900">
                  <FiAward className="text-amber-500" />
                  Active Pass
                </h3>
                {/* Car selector to determine which car's pass to show */}
                {cars.length > 0 && (
                  <select
                    value={selectedCar?.id || ""}
                    onChange={(e) => {
                      const carId = e.target.value;
                      const car =
                        cars.find((c) => String(c.id) === carId) || null;
                      setSelectedCar(car);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="">Select car</option>
                    {cars.map((car) => (
                      <option key={car.id} value={car.id}>
                        {car.brand} {car.model} - {car.number_plate}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {loadingPass ? (
                <p className="text-sm text-slate-600">Loading pass...</p>
              ) : !selectedCar ? (
                <div className="space-y-2">
                  <p className="text-sm text-slate-600">
                    Select a car above to view its monthly pass status.
                  </p>
                </div>
              ) : !activePass ? (
                <div className="space-y-2">
                  <p className="text-sm text-slate-700">
                    No active pass for{" "}
                    <span className="font-semibold">
                      {selectedCar.brand} {selectedCar.model} (
                      {selectedCar.number_plate})
                    </span>
                    .
                  </p>
                  <p className="text-xs text-slate-500">
                    Choose a plan on the left to activate a pass for this car.
                  </p>
                </div>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-amber-800">
                      {activePlanName} Plan
                    </p>
                    <p className="text-sm text-amber-700 mt-1">
                      {usedWashes}/{totalWashes} washes used
                    </p>

                    {/* Progress bar */}
                    <div className="w-full bg-amber-100 rounded-full h-3 mt-4 overflow-hidden">
                      <div
                        className="bg-amber-500 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-amber-700 mt-2 text-right">
                      {progress}% Used
                    </p>

                    <div className="bg-white/70 rounded-lg p-3 mt-4 space-y-2 border border-amber-100">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Expires:</span>
                        <span className="font-semibold text-amber-800">
                          {activePass.valid_till || "—"}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Remaining:</span>
                        <span className="font-semibold text-emerald-600">
                          {remainingWashes} washes
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={handleRenew}
                      disabled={loading}
                      className="mt-4 w-full px-4 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 rounded-lg font-semibold transition text-white"
                    >
                      {loading ? "Processing..." : "🔄 Renew Pass"}
                    </button>
                  </>
                )}
              </div>

              {/* INFO CARD */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
                <p className="text-sm font-semibold text-blue-700">💡 Pro Tip</p>
                <p className="text-xs text-slate-600">
                  Renew your pass before expiry to keep your benefits active without any interruption.
                </p>
              </div>
            </div>
          </div>
        </div>

      {/* PURCHASE MODAL */}
      {buyModalOpen && selectedPlan && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-6">
            {/* Header */}
            <div>
              <h3 className="text-2xl font-bold text-slate-900">
                Upgrade to {selectedPlan.name}
              </h3>
              <p className="text-slate-600 text-sm mt-1">
                Get {selectedPlan.washes} washes per month
              </p>
            </div>

            {/* Car Selection */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <label className="text-sm font-semibold text-slate-800 uppercase tracking-wider block mb-3">
                Select Car
              </label>
              {cars.length > 0 ? (
                <div className="space-y-2">
                  {cars.map((car) => (
                    <button
                      key={car.id}
                      onClick={() => setSelectedCar(car)}
                      className={`w-full p-3 rounded-lg text-left transition border ${
                        selectedCar?.id === car.id
                          ? "bg-blue-50 border-blue-400 text-blue-700"
                          : "bg-white border-slate-300 text-slate-700 hover:border-slate-400"
                      }`}
                    >
                      <div className="font-medium text-slate-900">
                        {car.brand} {car.model}
                      </div>
                      <div className="text-xs text-slate-500">
                        {car.number_plate}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm">
                  No cars found. Add a car first.
                </p>
              )}
            </div>

            {/* Plan Summary */}
            <div className="bg-slate-50 rounded-lg p-4 space-y-3 border border-slate-200">
              <p className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
                Plan Summary
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Plan Name</span>
                  <span className="font-medium text-slate-900">
                    {selectedPlan.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Washes</span>
                  <span className="font-medium text-slate-900">
                    {selectedPlan.washes}/month
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Validity</span>
                  <span className="font-medium text-slate-900">30 Days</span>
                </div>
              </div>
            </div>

            {/* Price Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Base Price:</span>
                <span className="font-semibold">
                  ₹{Math.round(selectedPlan.price / 1.18)}
                </span>
              </div>
              <div className="flex justify-between text-sm pb-2 border-b border-blue-200">
                <span className="text-slate-600">GST (18%):</span>
                <span className="font-semibold">
                  ₹
                  {Math.round(
                    selectedPlan.price - selectedPlan.price / 1.18
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-700 font-bold">Total:</span>
                <span className="text-3xl font-bold text-blue-700">
                  ₹{selectedPlan.price}
                </span>
              </div>
            </div>

            {/* Perks List */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
                What You Get
              </p>
              <div className="space-y-1 text-sm">
                {selectedPlan.perks.map((perk) => (
                  <div
                    key={perk}
                    className="flex items-center gap-2 text-slate-700"
                  >
                    <FiCheckCircle className="text-emerald-500 shrink-0" />
                    {perk}
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setBuyModalOpen(false)}
                className="flex-1 px-4 py-3 rounded-lg border border-slate-300 hover:bg-slate-100 font-medium transition text-slate-800"
              >
                Cancel
              </button>

              <button
                onClick={buyPlan}
                disabled={loading || !selectedCar}
                className="flex-1 px-4 py-3 bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-semibold transition flex items-center justify-center gap-2"
                title={!selectedCar ? "Please select a car first" : ""}
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
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
            {paymentStep === "method" ? (
              // PAYMENT METHOD SELECTION
              <>
                {/* Header */}
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">🛒 Confirm Purchase</h2>
                  <p className="text-slate-600 text-sm mt-1">Select your preferred payment method</p>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => setShowPayment(false)}
                  className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition"
                >
                  <FiX className="text-2xl" />
                </button>

                {/* Plan Details Card */}
                <div className="space-y-3 bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <p className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Plan Details</p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Plan Name</span>
                      <span className="text-slate-900 font-medium capitalize">{selectedPlan.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Washes</span>
                      <span className="text-slate-900 font-medium">{selectedPlan.washes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Validity</span>
                      <span className="text-slate-900 font-medium">30 Days</span>
                    </div>
                  </div>
                </div>

                {/* Amount Breakdown Card */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Subtotal:</span>
                    <span className="font-semibold">
                      ₹{Math.round(paymentAmount / 1.18)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm pb-2 border-b border-blue-200">
                    <span className="text-slate-600">GST (18%):</span>
                    <span className="font-semibold">
                      ₹{Math.round(paymentAmount - paymentAmount / 1.18)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-700 font-bold">Total Amount:</span>
                    <span className="text-lg font-bold text-blue-700">
                      ₹{paymentAmount}
                    </span>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Payment Methods</p>
                  
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
                        className="w-full flex items-center justify-between gap-3 p-4 border border-slate-200 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition text-left"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">{method.label}</p>
                          <p className="text-xs text-slate-500">{method.desc}</p>
                        </div>
                        <span className="text-xl">→</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cancel Button */}
                <button
                  onClick={() => setShowPayment(false)}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition text-slate-700"
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
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 flex flex-col items-center gap-4 animate-pulse">
                      <div className="text-5xl">✅</div>
                      <div>
                        <h3 className="font-bold text-emerald-700 mb-1 text-xl">Payment Successful!</h3>
                        <p className="text-sm text-emerald-600">Amount received in your account.</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm text-slate-600">Completing your purchase...</p>
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-slate-600">Processing</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* FAILURE MESSAGE - Show when payment fails */}
                {paymentStatus === "failed" && (
                  <div className="text-center space-y-6">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex flex-col items-center gap-4">
                      <div className="text-5xl">❌</div>
                      <div>
                        <h3 className="font-bold text-red-700 mb-1 text-xl">Payment Failed</h3>
                        <p className="text-sm text-red-600">Unable to verify payment. Please try again.</p>
                      </div>
                    </div>

                    <button
                        onClick={() => setPaymentStep("method")}
                        className="w-full py-3 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold transition text-slate-800"
                    >
                      Try Another Method
                    </button>
                  </div>
                )}

                {/* PAYMENT METHODS PROCESSING - Show only if not verified yet */}
                {!paymentVerified && paymentStatus !== "failed" && (
                  selectedPaymentMethod === "upi" ? (
                  <div className="text-center space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900">📱 Scan to Pay with UPI</h2>
                    
                    <div className="bg-white p-6 rounded-xl border border-slate-200">
                      <img 
                        src={generateQRCode(paymentDetails?.upi_link || "")} 
                        alt="UPI QR Code" 
                        className="w-64 h-64 mx-auto"
                      />
                    </div>

                    <div className="space-y-2">
                      <p className="text-slate-600">Scan with any UPI app:</p>
                      <p className="text-sm text-slate-500">Google Pay • PhonePe • PayTM</p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-lg font-bold text-blue-700">Amount: ₹{paymentAmount}</p>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-slate-800">Enter UTR Number after payment:</label>
                      <input 
                        type="text" 
                        placeholder="UTR / Reference number (e.g., 123456789012)"
                        id="upi-utr"
                        className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:border-emerald-500 focus:outline-none text-slate-900"
                      />
                    </div>

                    <button
                      onClick={async () => {
                        const utr = document
                          .getElementById("upi-utr")
                          ?.value?.trim();

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
                          alert(
                            "Payment verification failed. Please check UTR and try again."
                          );
                        }
                      }}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-semibold transition text-white"
                    >
                      ✓ Verify Payment
                    </button>

                    <button
                      onClick={() => {
                        setPaymentStep("method");
                      }}
                      className="w-full py-3 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold transition text-slate-800"
                    >
                      Use Different Method
                    </button>
                  </div>
                ) : selectedPaymentMethod === "card" ? (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-center text-slate-900">💳 Card Payment</h2>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-slate-800">Card Number</label>
                        <input 
                          type="text" 
                          placeholder="1234 5678 9012 3456" 
                          className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2 text-slate-800">Expiry</label>
                          <input 
                            type="text" 
                            placeholder="MM/YY" 
                            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2 text-slate-800">CVV</label>
                          <input 
                            type="text" 
                            placeholder="123" 
                            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                      <p className="text-lg font-bold text-purple-700">Amount: ₹{paymentAmount}</p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setPaymentStep("method")}
                        className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold transition text-slate-800"
                      >
                        Back
                      </button>
                      <button
                        className="flex-1 py-3 bg-linear-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-lg font-semibold transition flex items-center justify-center gap-2 text-white"
                      >
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Processing...
                      </button>
                    </div>
                  </div>
                ) : selectedPaymentMethod === "wallet" ? (
                  <div className="text-center space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900">👛 Wallet Payment</h2>
                    
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 space-y-2">
                      <p className="text-slate-600">Paying from:</p>
                      <p className="text-2xl font-bold text-emerald-700">₹{paymentAmount}</p>
                      <p className="text-sm text-slate-600">CarWash+ Wallet</p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm text-slate-600">Processing wallet payment...</p>
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-slate-600">Deducting funds</span>
                      </div>
                    </div>

                    <button
                        onClick={() => setPaymentStep("method")}
                        className="w-full py-3 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold transition text-slate-800"
                    >
                      Use Different Method
                    </button>
                  </div>
                ) : (
                  <div className="text-center space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900">🏦 Net Banking</h2>
                    
                    <div className="space-y-3">
                      <p className="text-slate-600">Select your bank:</p>
                      <div className="grid grid-cols-2 gap-3">
                        {["HDFC", "ICICI", "Axis", "SBI", "BOI", "Kotak"].map((bank) => (
                          <button
                            key={bank}
                            className="py-3 bg-slate-50 hover:bg-orange-50 border border-slate-200 hover:border-orange-400 rounded-lg font-medium transition text-slate-800"
                          >
                            {bank}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <p className="text-lg font-bold text-orange-700">Amount: ₹{paymentAmount}</p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setPaymentStep("method")}
                        className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold transition text-slate-800"
                      >
                        Back
                      </button>
                    </div>
                  </div>
                )
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* 🎨 CUSTOM SCROLLBAR STYLES */}
      <style>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #3b82f6 #1e293b;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1e293b;
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3b82f6, #1e40af);
          border-radius: 10px;
          border: 2px solid #1e293b;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #1e40af, #1e3a8a);
        }
      `}</style>
    </div>
  );
}