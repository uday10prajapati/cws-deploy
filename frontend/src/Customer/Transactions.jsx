import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  FiCreditCard,
  FiDollarSign,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiDownload,
  FiPhone,
  FiArrowLeft,
  FiBell,
  FiChevronLeft,
  FiLogOut,
  FiHome,
  FiClipboard,
  FiUser,
  FiMenu,
} from "react-icons/fi";

import { FaWallet, FaCar } from "react-icons/fa";
import { SiGooglepay, SiPhonepe } from "react-icons/si";

/**
 * @typedef {Object} Transaction
 * @property {string} id
 * @property {string=} bookingId
 * @property {string=} passId
 * @property {string} customerId
 * @property {"booking_payment"|"monthly_pass"|"wallet_topup"|"refund"|"cashback"} type
 * @property {"credit"|"debit"} direction
 * @property {"success"|"failed"|"pending"|"refunded"} status
 * @property {number} amount
 * @property {number=} gst
 * @property {number=} totalAmount
 * @property {string} currency
 * @property {"upi"|"card"|"wallet"|"netbanking"|"other"} paymentMethod
 * @property {string=} gatewayOrderId
 * @property {string=} gatewayPaymentId
 * @property {string=} invoiceUrl
 * @property {string=} notes
 * @property {string} createdAt
 */

// ===========================
// BACKEND API INTEGRATION
// ===========================
const API_BASE = "http://localhost:5000";

async function fetchTransactions(customerId) {
  try {
    const response = await fetch(
      `${API_BASE}/transactions/customer/${customerId}`,
      { signal: AbortSignal.timeout(5000) } // 5 second timeout
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();

    if (result.success) {
      // Transform backend response to frontend format
      return (result.transactions || []).map((tx) => ({
        id: tx.id,
        bookingId: tx.booking_id,
        passId: tx.pass_id,
        customerId: tx.customer_id,
        type: tx.type,
        direction: tx.direction,
        status: tx.status,
        amount: tx.amount,
        gst: tx.gst || 0,
        totalAmount: tx.total_amount || tx.amount,
        currency: tx.currency,
        paymentMethod: tx.payment_method,
        gatewayOrderId: tx.gateway_order_id,
        gatewayPaymentId: tx.gateway_payment_id,
        invoiceUrl: tx.invoice_url,
        gstNumber: tx.gst_number,
        notes: tx.notes,
        createdAt: tx.created_at,
        updatedAt: tx.updated_at,
      }));
    }
    return [];
  } catch (err) {
    console.error("❌ Error fetching transactions:", err.message);
    // Don't throw, just return empty array
    return [];
  }
}

async function createTransaction(transactionData) {
  try {
    const response = await fetch(`${API_BASE}/transactions/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(transactionData),
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();

    if (result.success) {
      return result.transaction;
    }
    throw new Error(result.error || "Failed to create transaction");
  } catch (err) {
    console.error("❌ Error creating transaction:", err.message);
    throw err;
  }
}

// UI Helpers
const statusConfig = {
  success: {
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-700",
    badge: "bg-green-100",
    icon: <FiCheckCircle className="text-green-600" />,
  },
  failed: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    badge: "bg-red-100",
    icon: <FiXCircle className="text-red-600" />,
  },
  pending: {
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    text: "text-yellow-700",
    badge: "bg-yellow-100",
    icon: <FiClock className="text-yellow-600" />,
  },
  refunded: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    badge: "bg-blue-100",
    icon: <FiDownload className="text-blue-600" />,
  },
};

const typeLabel = {
  booking_payment: "Booking Payment",
  monthly_pass: "Monthly Pass",
  wallet_topup: "Wallet Top-up",
  refund: "Refund",
  cashback: "Cashback",
};

const paymentModes = [
  { id: "upi", label: "UPI", icon: <SiGooglepay /> },
  { id: "card", label: "Credit/Debit Card", icon: <FiCreditCard /> },
  { id: "wallet", label: "Wallet", icon: <FaWallet /> },
  { id: "netbanking", label: "Net Banking", icon: <FiPhone /> },
];

const paymentLabel = {
  upi: "UPI",
  card: "Card",
  wallet: "Wallet",
  netbanking: "Netbanking",
  other: "Other",
};

// Generate QR Code Data URL for UPI
function generateQRCode(text) {
  const encodedText = encodeURIComponent(text);
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedText}`;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatAmount(amount, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
  }).format(amount);
}

/**
 * ===========================
 * PAYMENT PAGE COMPONENT
 * ===========================
 */
function PaymentPage({ amount, type, bookingId, passId, onBack, onSuccess }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState("upi");
  const [loading, setLoading] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null); // null, 'success', 'failed'
  const [paymentVerified, setPaymentVerified] = useState(false); // Track if payment is verified in account
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const customerMenu = [
    { name: "Home", icon: <FiHome />, link: "/" },
    { name: "My Bookings", icon: <FiClipboard />, link: "/bookings" },
    { name: "My Cars", icon: <FaCar />, link: "/my-cars" },
    { name: "Profile", icon: <FiUser />, link: "/profile" },
  ];

  const GST_RATE = 0.18; // 18% GST
  const GST_NUMBER = "18AABCT1234H1Z0"; // Company GST Number
  const gstAmount = Math.round(amount * GST_RATE);
  const totalAmount = amount + gstAmount;

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const handlePayment = async () => {
    if (!selectedPayment) {
      alert("Please select a payment method");
      return;
    }

    setPaymentProcessing(true);
    setPaymentStatus(null);
    setPaymentVerified(false);

    try {
      // Simulate payment gateway communication
      // In real scenario, this would integrate with actual payment gateway
      // This simulates waiting for user to complete payment (UPI scan, card entry, etc.)
      const paymentResponse = await new Promise((resolve) => {
        setTimeout(() => {
          resolve({ success: true, verified: true });
        }, 3000);
      });

      if (!paymentResponse.success) {
        setPaymentStatus("failed");
        return;
      }

      // Verify payment in account
      if (paymentResponse.verified) {
        setPaymentVerified(true);

        // Create transaction in backend only after payment is verified
        const transaction = await createTransaction({
          customer_id: user.id,
          booking_id: bookingId || null,
          pass_id: passId || null,
          type,
          direction: "debit",
          status: "success",
          amount: parseFloat(amount),
          gst: gstAmount,
          total_amount: totalAmount,
          currency: "INR",
          payment_method: selectedPayment,
          gateway_order_id: `order_${Date.now()}`,
          gateway_payment_id: `pay_${Date.now()}`,
          gst_number: GST_NUMBER,
          notes: `Payment via ${paymentLabel[selectedPayment]}`,
        });

        console.log("✅ Payment successful:", transaction);
        setPaymentStatus("success");

        // Close payment card after 2 seconds of success message
        setTimeout(() => {
          setShowPayment(false);
          setPaymentData(null);
          setPaymentStatus(null);
          setPaymentVerified(false);
          alert(`Payment of ₹${totalAmount} successful!\nTransaction ID: ${transaction.id}`);
          onSuccess(transaction);
        }, 2000);
      } else {
        setPaymentStatus("failed");
        setTimeout(() => {
          alert("Payment could not be verified. Please contact support.");
        }, 500);
      }
    } catch (err) {
      console.error("❌ Payment error:", err);
      setPaymentStatus("failed");
      setTimeout(() => {
        alert(`Payment failed: ${err.message}`);
      }, 500);
    } finally {
      setPaymentProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-blue-950 text-white flex">
      {/* ▓▓▓ MOBILE TOP BAR ▓▓▓ */}
      <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 py-4 shadow-lg flex items-center justify-between fixed top-0 left-0 right-0 z-40">
        <h1 className="text-xl font-bold bg-linear-to-r from-blue-400 to-blue-600 text-transparent bg-clip-text">
          CarWash+
        </h1>
        <FiMenu
          className="text-2xl text-white cursor-pointer hover:text-blue-400 transition-colors"
          onClick={() => setSidebarOpen(true)}
        />
      </div>

      {/* ▓▓▓ BACKDROP FOR MOBILE ▓▓▓ */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ▓▓▓ SIDEBAR ▓▓▓ */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-slate-900 border-r border-slate-800 shadow-2xl 
          z-50 transition-all duration-300
          ${collapsed ? "w-16" : "w-56"}
          ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }
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
          {customerMenu.map((item) => (
            <Link
              key={item.name}
              to={item.link}
              onClick={() => setSidebarOpen(false)}
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
              title={collapsed ? item.name : ""}
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
            flex items-center gap-3 shadow-lg transition-all
            ${collapsed ? "justify-center" : ""}
          `}
          title={collapsed ? "Logout" : ""}
        >
          <FiLogOut className="text-lg" />
          {!collapsed && "Logout"}
        </div>
      </aside>

      {/* ▓▓▓ MAIN CONTENT ▓▓▓ */}
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
          <h1 className="text-2xl font-bold">Complete Payment</h1>

          <div className="flex items-center gap-8">
            <button className="text-xl text-slate-300 hover:text-blue-400 transition">
              <FiBell />
            </button>

            <img
              src={`https://ui-avatars.com/api/?name=${user?.email}&background=3b82f6&color=fff`}
              className="w-10 h-10 rounded-full border-2 border-blue-500 cursor-pointer hover:border-blue-400 transition"
              alt="Profile"
            />
          </div>
        </header>

        <div className="bg-slate-900 border-b border-slate-800 px-4 md:px-8 py-4 lg:hidden">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-4"
          >
            <FiArrowLeft /> Back
          </button>
          <h1 className="text-2xl md:text-3xl font-bold">Complete Payment</h1>
          <p className="text-slate-400 text-sm">Secure checkout with 18% GST</p>
        </div>

        {/* CONTENT */}
        <div className="max-w-2xl mx-auto p-4 md:p-8 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* AMOUNT SUMMARY */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Subtotal</span>
                <span className="font-semibold">{formatAmount(amount)}</span>
              </div>
              <div className="flex justify-between text-orange-400">
                <span>GST (18%)</span>
                <span className="font-semibold">+ {formatAmount(gstAmount)}</span>
              </div>
              <div className="border-t border-slate-700 pt-3 flex justify-between text-lg">
                <span className="font-semibold">Total Amount</span>
                <span className="text-2xl font-bold text-blue-400">
                  {formatAmount(totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* SUCCESS/FAILURE MESSAGE - Only show if verified */}
          {paymentVerified && paymentStatus === "success" && (
            <div className="bg-green-600/20 border border-green-500/50 rounded-xl p-6 mb-6 flex items-center gap-4">
              <div className="text-4xl">✅</div>
              <div>
                <h3 className="font-bold text-green-300 mb-1">Payment Successful!</h3>
                <p className="text-sm text-green-200">Amount received in your account. Processing your order...</p>
              </div>
            </div>
          )}

          {/* FAILURE MESSAGE */}
          {paymentStatus === "failed" && (
            <div className="bg-red-600/20 border border-red-500/50 rounded-xl p-6 mb-6 flex items-center gap-4">
              <div className="text-4xl">❌</div>
              <div>
                <h3 className="font-bold text-red-300 mb-1">Payment Failed</h3>
                <p className="text-sm text-red-200">Unable to process your payment. Please try again.</p>
              </div>
            </div>
          )}

          {/* ORDER DETAILS */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Order Details</h3>
            <div className="space-y-2 text-sm">
              {bookingId && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Booking ID</span>
                  <span className="font-mono text-blue-400">#{bookingId}</span>
                </div>
              )}
              {passId && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Pass ID</span>
                  <span className="font-mono text-blue-400">#{passId}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Type</span>
                <span>{typeLabel[type]}</span>
              </div>
            </div>
          </div>

          {/* PAYMENT METHODS */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Select Payment Method</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {paymentModes.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setSelectedPayment(mode.id)}
                  disabled={paymentProcessing}
                  className={`p-4 rounded-lg border-2 transition ${
                    selectedPayment === mode.id
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-slate-700 bg-slate-900 hover:border-slate-600"
                  } ${paymentProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{mode.icon}</div>
                    <div className="text-left">
                      <div className="font-semibold">{mode.label}</div>
                      <div className="text-xs text-slate-400">
                        {mode.id === "upi" && "Instant & Secure"}
                        {mode.id === "card" && "Visa, Mastercard, Amex"}
                        {mode.id === "wallet" && "Use wallet balance"}
                        {mode.id === "netbanking" && "All major banks"}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* GST & INVOICE INFO */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 mb-6 space-y-3">
            <div className="flex gap-2 text-sm">
              <span className="text-slate-400">📋 GST Number:</span>
              <span className="font-mono text-blue-300 font-semibold">{GST_NUMBER}</span>
            </div>
            <div className="flex gap-2 text-sm">
              <span className="text-slate-400">🏢 Business Name:</span>
              <span className="text-slate-300">CarWash+ Services</span>
            </div>
            <p className="text-xs text-slate-500">
              Invoice will be generated after successful payment and can be downloaded from your transactions page
            </p>
          </div>

          {/* TERMS */}
          <div className="bg-slate-900/50 rounded-lg p-4 mb-6">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" defaultChecked className="rounded" disabled={paymentProcessing} />
              <span className="text-slate-300">
                I agree to the terms & conditions and privacy policy
              </span>
            </label>
          </div>

          {/* PAY BUTTON */}
          <button
            onClick={handlePayment}
            disabled={paymentProcessing}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold text-lg transition flex items-center justify-center gap-2"
          >
            {paymentProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing Payment...
              </>
            ) : (
              <>
                <FiDollarSign /> Pay {formatAmount(totalAmount)}
              </>
            )}
          </button>

          {/* SECURITY */}
          <div className="text-center mt-6 text-xs text-slate-400">
            🔒 Your payment is secure and encrypted
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ===========================
 * TRANSACTIONS PAGE COMPONENT
 * ===========================
 */
export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  const [selectedTx, setSelectedTx] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [addMoneyAmount, setAddMoneyAmount] = useState("");
  const [addMoneyPaymentMethod, setAddMoneyPaymentMethod] = useState("upi");
  const [addMoneyStep, setAddMoneyStep] = useState("amount"); // amount, confirm, processing, success
  const [addMoneyStatus, setAddMoneyStatus] = useState(null); // null, success, failed
  const [addMoneyVerified, setAddMoneyVerified] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVV, setCardCVV] = useState("");
  const [cardName, setCardName] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const customerMenu = [
    { name: "Home", icon: <FiHome />, link: "/" },
    { name: "My Bookings", icon: <FiClipboard />, link: "/bookings" },
    { name: "My Cars", icon: <FaCar />, link: "/my-cars" },
    { name: "Profile", icon: <FiUser />, link: "/profile" },
  ];

  // Check if redirected from booking/pass purchase
  const redirectedPaymentData = location.state?.paymentData;
  const showPaymentPageOnLoad = location.state?.showPayment || false;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  // Auth state listener - runs once on mount
  useEffect(() => {
    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT" || !session?.user) {
          console.log("🔐 Auth state changed - user logged out");
          navigate("/login");
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get current user (more reliable than getSession)
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError || !userData?.user) {
          console.log("⚠️ No user found, redirecting to login", userError);
          navigate("/login");
          return;
        }

        setUser(userData.user);

        // Fetch transactions from backend with fallback
        try {
          const txData = await fetchTransactions(userData.user.id);
          setTransactions(txData);
        } catch (txErr) {
          console.warn("⚠️ Could not fetch transactions:", txErr);
          setTransactions([]); // Set empty list instead of error
        }

        // Show payment page if redirected
        if (showPaymentPageOnLoad && redirectedPaymentData) {
          setShowPayment(true);
          setPaymentData(redirectedPaymentData);
        }
      } catch (err) {
        console.error("❌ Error loading data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [redirectedPaymentData, showPaymentPageOnLoad, navigate]);

  // Filter Logic
  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      if (statusFilter !== "all" && tx.status !== statusFilter) return false;
      if (typeFilter !== "all" && tx.type !== typeFilter) return false;
      if (paymentFilter !== "all" && tx.paymentMethod !== paymentFilter)
        return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const haystack = `${tx.id} ${tx.bookingId ?? ""} ${
          tx.notes ?? ""
        } ${tx.amount}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [transactions, search, statusFilter, typeFilter, paymentFilter]);

  // Wallet Balance (total credits)
  const walletBalance = useMemo(() => {
    return transactions
      .filter(
        (tx) =>
          tx.direction === "credit" &&
          (tx.status === "success" || tx.status === "pending")
      )
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);
  }, [transactions]);

  const handleInitiatePayment = (amount, type, bookingId, passId) => {
    setPaymentData({ amount, type, bookingId, passId });
    setShowPayment(true);
  };

  const handlePaymentSuccess = (transaction) => {
    // Add new transaction to list
    setTransactions([transaction, ...transactions]);
    setShowPayment(false);
    setPaymentData(null);
  };

  const handleAddMoneyPayment = async () => {
    if (!user || !addMoneyAmount) return;

    const amount = parseInt(addMoneyAmount);
    if (amount < 100 || amount > 100000) {
      alert("Amount must be between ₹100 and ₹1,00,000");
      return;
    }

    setAddMoneyStep("processing");
    setAddMoneyStatus(null);
    setAddMoneyVerified(false);

    try {
      // Step 1: Create order on backend
      console.log("📝 Creating payment order...");
      const orderResponse = await fetch(`${API_BASE}/payment/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amount,
          customer_id: user.id,
          customer_email: user.email,
          customer_name: user.user_metadata?.full_name || "Customer",
          type: "wallet_topup",
          payment_method: addMoneyPaymentMethod,
          notes: `Wallet top-up via ${paymentLabel[addMoneyPaymentMethod]}`,
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderData.success) {
        console.error("❌ Order creation failed:", orderData.error);
        setAddMoneyStatus("failed");
        alert("Failed to create payment order: " + orderData.error);
        return;
      }

      console.log("✅ Order created:", orderData.order.id);

      // Step 2: Open Razorpay payment modal
      const gstAmount = Math.round(amount * 0.18);
      const totalAmount = amount + gstAmount;

      const options = {
        key: orderData.razorpay_key,
        amount: totalAmount * 100, // Amount in paise
        currency: "INR",
        name: "CarWash+",
        description: `Add ₹${amount} to Wallet`,
        order_id: orderData.order.id,
        customer_id: user.id,
        customer_email: user.email,
        customer_name: user.user_metadata?.full_name || "Customer",
        prefill: {
          name: user.user_metadata?.full_name || "Customer",
          email: user.email,
        },
        notes: {
          type: "wallet_topup",
          payment_method: addMoneyPaymentMethod,
        },
        theme: {
          color: "#2563eb", // Blue color
        },
        // Handler function
        handler: async (paymentResponse) => {
          console.log("💰 Payment response received:", paymentResponse);

          // Step 3: Verify payment on backend
          try {
            const verifyResponse = await fetch(`${API_BASE}/payment/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
                customer_id: user.id,
                amount: amount,
                gst: gstAmount,
                total_amount: totalAmount,
                type: "wallet_topup",
                payment_method: addMoneyPaymentMethod,
                notes: `Wallet top-up via ${paymentLabel[addMoneyPaymentMethod]}`,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              console.log("✅ Payment verified successfully!");
              setAddMoneyVerified(true);
              setAddMoneyStatus("success");

              // Add transaction to list
              setTransactions([verifyData.transaction, ...transactions]);

              // Show success for 2 seconds then auto-close
              setTimeout(() => {
                setShowAddMoney(false);
                setAddMoneyAmount("");
                setAddMoneyStep("amount");
                setAddMoneyStatus(null);
                setAddMoneyVerified(false);
                setCardNumber("");
                setCardExpiry("");
                setCardCVV("");
                setCardName("");
                alert(
                  `💰 ₹${totalAmount} added to your wallet successfully!\nTransaction ID: ${verifyData.transaction.id}\nOrder ID: ${paymentResponse.razorpay_order_id}`
                );
              }, 2000);
            } else {
              console.error("❌ Payment verification failed:", verifyData.error);
              setAddMoneyStatus("failed");
              alert("Payment verification failed: " + verifyData.error);
            }
          } catch (verifyErr) {
            console.error("❌ Verification error:", verifyErr);
            setAddMoneyStatus("failed");
            alert("Error verifying payment: " + verifyErr.message);
          }
        },
        // Error handler
        modal: {
          ondismiss: () => {
            console.log("❌ Payment modal closed");
            setAddMoneyStep("confirm");
            setAddMoneyStatus("failed");
          },
        },
      };

      // Create Razorpay instance and open payment modal
      const rzp = new window.Razorpay(options);
      rzp.open();

      // Catch payment modal errors
      rzp.on("payment.failed", (response) => {
        console.error("❌ Payment failed:", response.error);
        setAddMoneyStatus("failed");
        alert(
          `Payment failed: ${response.error.reason}\nError code: ${response.error.code}`
        );
      });
    } catch (err) {
      console.error("❌ Payment error:", err);
      setAddMoneyStatus("failed");
      alert(`Payment failed: ${err.message}`);
    }
  };

  if (showPayment && paymentData) {
    return (
      <PaymentPage
        amount={paymentData.amount}
        type={paymentData.type}
        bookingId={paymentData.bookingId}
        passId={paymentData.passId}
        onBack={() => setShowPayment(false)}
        onSuccess={handlePaymentSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-blue-950 text-white flex">
      {/* ▓▓▓ MOBILE TOP BAR ▓▓▓ */}
      <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 py-4 shadow-lg flex items-center justify-between fixed top-0 left-0 right-0 z-40">
        <h1 className="text-xl font-bold bg-linear-to-r from-blue-400 to-blue-600 text-transparent bg-clip-text">
          CarWash+
        </h1>
        <FiMenu
          className="text-2xl text-white cursor-pointer hover:text-blue-400 transition-colors"
          onClick={() => setSidebarOpen(true)}
        />
      </div>

      {/* ▓▓▓ BACKDROP FOR MOBILE ▓▓▓ */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ▓▓▓ SIDEBAR ▓▓▓ */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-slate-900 border-r border-slate-800 shadow-2xl 
          z-50 transition-all duration-300
          ${collapsed ? "w-16" : "w-56"}
          ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }
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
          {customerMenu.map((item) => (
            <Link
              key={item.name}
              to={item.link}
              onClick={() => setSidebarOpen(false)}
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
              title={collapsed ? item.name : ""}
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
            flex items-center gap-3 shadow-lg transition-all
            ${collapsed ? "justify-center" : ""}
          `}
          title={collapsed ? "Logout" : ""}
        >
          <FiLogOut className="text-lg" />
          {!collapsed && "Logout"}
        </div>
      </aside>

      {/* ▓▓▓ MAIN CONTENT ▓▓▓ */}
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
          <h1 className="text-2xl font-bold">My Transactions</h1>

          <div className="flex items-center gap-8">
            <button className="text-xl text-slate-300 hover:text-blue-400 transition">
              <FiBell />
            </button>

            <img
              src={`https://ui-avatars.com/api/?name=${user?.email}&background=3b82f6&color=fff`}
              className="w-10 h-10 rounded-full border-2 border-blue-500 cursor-pointer hover:border-blue-400 transition"
              alt="Profile"
            />
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* WALLET BALANCE */}
          <div className="bg-linear-to-r from-blue-600 to-blue-700 rounded-xl p-6 mb-8">
            <div className="text-slate-200 text-sm mb-2">Wallet Balance</div>
            <div className="flex items-end justify-between flex-col md:flex-row gap-4">
              <div className="text-4xl font-bold">{formatAmount(walletBalance)}</div>
              <button
                onClick={() => setShowAddMoney(true)}
                className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-slate-100 transition"
              >
                + Add Money
              </button>
            </div>
          </div>

          {/* FILTERS */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6 space-y-4">
            <div className="flex flex-col gap-3">
              {/* Search */}
              <input
                placeholder="Search by ID, Amount, Notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />

              {/* Filters Row */}
              <div className="flex flex-wrap gap-3">
                {/* Status */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 text-sm"
                >
                  <option value="all">Status: All</option>
                  <option value="success">Success</option>
                  <option value="failed">Failed</option>
                  <option value="pending">Pending</option>
                  <option value="refunded">Refunded</option>
                </select>

                {/* Type */}
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 text-sm"
                >
                  <option value="all">Type: All</option>
                  <option value="booking_payment">Booking Payment</option>
                  <option value="wallet_topup">Wallet Top-up</option>
                  <option value="monthly_pass">Monthly Pass</option>
                  <option value="refund">Refund</option>
                </select>

                {/* Payment */}
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 text-sm"
                >
                  <option value="all">Payment: All</option>
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                  <option value="wallet">Wallet</option>
                  <option value="netbanking">Netbanking</option>
                </select>
              </div>
            </div>
          </div>

          {/* TRANSACTIONS LIST - MODERN CARDS */}
          <div className="space-y-4">
            {loading && (
              <div className="text-center py-12">
                <div className="inline-block">
                  <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
                <p className="text-slate-400 mt-4">Loading transactions...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-600/20 border border-red-500/50 rounded-xl p-6 text-center">
                <p className="text-red-300">⚠️ {error}</p>
              </div>
            )}

            {!loading && !error && filtered.length === 0 && (
              <div className="bg-slate-900/50 border-2 border-dashed border-slate-700 rounded-xl p-12 text-center">
                <div className="text-5xl mb-4">📋</div>
                <p className="text-lg font-semibold text-white">No Transactions Yet</p>
                <p className="text-sm text-slate-400 mt-2">
                  Your transactions will appear here once you make a payment
                </p>
                <button
                  onClick={() => handleInitiatePayment(399, "booking_payment", null, null)}
                  className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition"
                >
                  Make Your First Payment
                </button>
              </div>
            )}

            {filtered.map((tx) => {
              const config = statusConfig[tx.status];
              const isCredit = tx.direction === "credit";
              return (
                <div
                  key={tx.id}
                  onClick={() => setSelectedTx(tx)}
                  className={`
                    group cursor-pointer p-4 md:p-6 rounded-xl border-2 transition-all
                    hover:shadow-xl hover:scale-[1.01] hover:-translate-y-1
                    bg-linear-to-br from-slate-900/80 to-slate-800/80
                    border-slate-700 hover:border-blue-500/50
                  `}
                >
                  <div className="flex items-center justify-between flex-col md:flex-row gap-4">
                    {/* LEFT SECTION - Transaction Info */}
                    <div className="flex-1 w-full flex items-start gap-4">
                      {/* Icon Circle */}
                      <div
                        className={`
                          shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-2xl
                          transition-all group-hover:scale-110
                          ${
                            isCredit
                              ? "bg-green-600/20 border border-green-500/50"
                              : tx.status === "success"
                              ? "bg-blue-600/20 border border-blue-500/50"
                              : tx.status === "failed"
                              ? "bg-red-600/20 border border-red-500/50"
                              : "bg-yellow-600/20 border border-yellow-500/50"
                          }
                        `}
                      >
                        {config.icon}
                      </div>

                      {/* Info Column */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-bold text-white text-base md:text-lg">
                            {typeLabel[tx.type]}
                          </p>
                          {tx.direction === "credit" && (
                            <span className="text-xs px-2 py-1 bg-green-600/30 text-green-300 rounded-full font-semibold">
                              +
                            </span>
                          )}
                        </div>
                        <p className="text-xs md:text-sm text-slate-400 mb-1">
                          {formatDate(tx.createdAt)}
                        </p>
                        {tx.notes && (
                          <p className="text-xs text-slate-500 truncate">
                            {tx.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* RIGHT SECTION - Amount & Status */}
                    <div className="flex items-end gap-4 md:flex-col md:items-end md:gap-2">
                      {/* Amount */}
                      <div className="text-right">
                        <p
                          className={`text-xl md:text-2xl font-black transition-all group-hover:scale-110 origin-right ${
                            isCredit ? "text-green-400" : "text-slate-100"
                          }`}
                        >
                          {isCredit ? "+" : "-"}
                          {formatAmount(tx.totalAmount || tx.amount)}
                        </p>
                      </div>

                      {/* Status Badge */}
                      <div className="shrink-0">
                        <span
                          className={`
                            inline-flex items-center gap-1 text-xs md:text-sm px-3 py-1.5 rounded-full font-semibold
                            transition-all
                            ${config.badge} ${config.text}
                          `}
                        >
                          <span className="w-2 h-2 rounded-full bg-current opacity-80"></span>
                          {tx.status === "success"
                            ? "Success"
                            : tx.status === "failed"
                            ? "Failed"
                            : tx.status === "pending"
                            ? "Pending"
                            : "Refunded"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Method Indicator */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-700/50">
                    <span className="text-xs text-slate-500">
                      💳 {paymentLabel[tx.paymentMethod]}
                    </span>
                    {tx.bookingId && (
                      <span className="text-xs text-slate-500">
                        • ID: {tx.bookingId.slice(0, 8)}...
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* DETAIL MODAL - IMPROVED */}
      {selectedTx && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-linear-to-b from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Transaction Details</h2>
              <button
                onClick={() => setSelectedTx(null)}
                className="text-2xl text-slate-400 hover:text-white transition hover:bg-slate-800 w-8 h-8 flex items-center justify-center rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Transaction ID */}
            <p className="text-xs text-slate-400 mb-6 bg-slate-800/50 px-3 py-2 rounded-lg font-mono">
              ID: {selectedTx.id}
            </p>

            <div className="space-y-4">
              {/* AMOUNT - Large Display */}
              <div className="bg-linear-to-br from-blue-600/20 to-blue-900/20 border border-blue-500/30 rounded-xl p-6 text-center">
                <p className="text-sm text-slate-400 mb-2">Transaction Amount</p>
                <div className="text-4xl font-black mb-2">
                  <span
                    className={
                      selectedTx.direction === "credit" ? "text-green-400" : "text-white"
                    }
                  >
                    {selectedTx.direction === "debit" ? "-" : "+"}
                    {formatAmount(selectedTx.totalAmount || selectedTx.amount)}
                  </span>
                </div>
                {selectedTx.gst ? (
                  <div className="text-xs text-slate-400 mt-3 pt-3 border-t border-blue-500/20">
                    <div className="flex justify-between mb-1">
                      <span>Subtotal</span>
                      <span className="text-blue-300">
                        {formatAmount(selectedTx.amount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST (18%)</span>
                      <span className="text-orange-300">
                        +{formatAmount(selectedTx.gst)}
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* STATUS */}
              <div className="flex items-center gap-3 bg-slate-800/50 p-4 rounded-lg">
                <span className="text-2xl">{statusConfig[selectedTx.status].icon}</span>
                <div>
                  <p className="text-xs text-slate-400">Status</p>
                  <p
                    className={`font-bold text-lg ${statusConfig[selectedTx.status].text}`}
                  >
                    {selectedTx.status.toUpperCase()}
                  </p>
                </div>
              </div>

              {/* DETAILS GRID */}
              <div className="space-y-3 bg-slate-800/30 p-4 rounded-xl">
                <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Details
                </p>

                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-700">
                    <span className="text-sm text-slate-400">Type</span>
                    <span className="font-semibold text-blue-300">
                      {typeLabel[selectedTx.type]}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b border-slate-700">
                    <span className="text-sm text-slate-400">Payment Method</span>
                    <span className="font-semibold text-slate-300 capitalize flex items-center gap-2">
                      💳 {paymentLabel[selectedTx.paymentMethod]}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b border-slate-700">
                    <span className="text-sm text-slate-400">Date & Time</span>
                    <span className="font-semibold text-slate-300">
                      {formatDate(selectedTx.createdAt)}
                    </span>
                  </div>

                  {selectedTx.bookingId && (
                    <div className="flex justify-between items-center pb-2 border-b border-slate-700">
                      <span className="text-sm text-slate-400">Booking ID</span>
                      <span className="font-mono text-blue-400 bg-blue-600/20 px-2 py-1 rounded">
                        {selectedTx.bookingId.slice(0, 12)}
                      </span>
                    </div>
                  )}

                  {selectedTx.passId && (
                    <div className="flex justify-between items-center pb-2 border-b border-slate-700">
                      <span className="text-sm text-slate-400">Pass ID</span>
                      <span className="font-mono text-purple-400 bg-purple-600/20 px-2 py-1 rounded">
                        {selectedTx.passId.slice(0, 12)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* NOTES */}
              {selectedTx.notes && (
                <div className="bg-slate-800/30 p-4 rounded-xl">
                  <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Notes
                  </p>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {selectedTx.notes}
                  </p>
                </div>
              )}

              {/* GST INFO */}
              {selectedTx.gstNumber && (
                <div className="bg-amber-600/20 border border-amber-500/30 rounded-xl p-4">
                  <p className="text-xs font-semibold text-amber-300 uppercase tracking-wider mb-3">
                    💼 GST Information
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">GST Number</span>
                      <span className="font-mono text-amber-300">
                        {selectedTx.gstNumber}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">GST Amount</span>
                      <span className="font-bold text-orange-300">
                        {formatAmount(selectedTx.gst || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* INVOICE BUTTON */}
              {selectedTx.invoiceUrl && (
                <button className="w-full mt-4 py-3 bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg flex items-center justify-center gap-2 font-medium transition">
                  <FiDownload /> Download Invoice
                </button>
              )}

              {/* CLOSE BUTTON */}
              <button
                onClick={() => setSelectedTx(null)}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-medium transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ▓▓▓ ADD MONEY MODAL ▓▓▓ */}
      {showAddMoney && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full p-6 md:p-8 space-y-6 my-8">
            {/* Header */}
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">💰 Add Money to Wallet</h2>
              <p className="text-slate-400 text-sm">Quick & Secure Top-up</p>
            </div>

            {/* STEP 1: AMOUNT SELECTION */}
            {addMoneyStep === "amount" && (
              <>
                {/* Amount Input */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-300 uppercase tracking-wider">
                    Enter Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={addMoneyAmount}
                    onChange={(e) => setAddMoneyAmount(e.target.value)}
                    placeholder="Enter amount"
                    disabled={addMoneyStep !== "amount"}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-lg font-semibold"
                  />
                  <p className="text-xs text-slate-500">
                    ℹ️ Minimum: ₹100 | Maximum: ₹1,00,000
                  </p>
                </div>

                {/* Quick Amount Buttons */}
                <div className="grid grid-cols-3 gap-3">
                  {[500, 1000, 2000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setAddMoneyAmount(amt.toString())}
                      disabled={addMoneyStep !== "amount"}
                      className="py-2 px-3 bg-slate-800 hover:bg-blue-600 border border-slate-700 hover:border-blue-500 rounded-lg text-sm font-medium transition disabled:opacity-50"
                    >
                      ₹{amt.toLocaleString()}
                    </button>
                  ))}
                </div>

                {/* Payment Methods */}
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Select Payment Method</p>
                  <div className="space-y-2">
                    {paymentModes.map((method) => (
                      <label
                        key={method.id}
                        className="flex items-center gap-3 p-3 border border-slate-700 hover:bg-blue-600/10 hover:border-blue-500 rounded-lg cursor-pointer transition"
                      >
                        <input
                          type="radio"
                          name="add-money-method"
                          value={method.id}
                          checked={addMoneyPaymentMethod === method.id}
                          onChange={(e) => setAddMoneyPaymentMethod(e.target.value)}
                          className="w-4 h-4"
                        />
                        <span className="text-lg">{method.icon}</span>
                        <span className="text-sm font-medium text-slate-300">
                          {method.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Total Amount Preview */}
                {addMoneyAmount && (
                  <div className="bg-linear-to-r from-green-600/20 to-green-900/20 border border-green-500/50 rounded-lg p-4 space-y-2">
                    <p className="text-xs font-semibold text-green-300 uppercase tracking-wider mb-3">💳 Amount Summary</p>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-300">Base Amount:</span>
                      <span className="font-semibold">
                        ₹{parseInt(addMoneyAmount || 0).toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-green-500/30 mb-2">
                      <span className="text-slate-300">GST (18%):</span>
                      <span className="font-semibold">
                        ₹
                        {Math.round(
                          (parseInt(addMoneyAmount || 0) * 0.18)
                        ).toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-green-300 font-bold">Total to Pay:</span>
                      <span className="text-lg font-bold text-green-300">
                        ₹
                        {(
                          parseInt(addMoneyAmount || 0) +
                          Math.round(parseInt(addMoneyAmount || 0) * 0.18)
                        ).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowAddMoney(false);
                      setAddMoneyAmount("");
                      setAddMoneyPaymentMethod("upi");
                      setAddMoneyStep("amount");
                    }}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-medium transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setAddMoneyStep("confirm")}
                    disabled={!addMoneyAmount || parseInt(addMoneyAmount) < 100}
                    className="flex-1 py-3 bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold transition flex items-center justify-center gap-2"
                  >
                    💳 Next
                  </button>
                </div>
              </>
            )}

            {/* STEP 2: CONFIRM & PAYMENT METHOD */}
            {addMoneyStep === "confirm" && (
              <>
                {/* Payment Method Specific UI */}
                {addMoneyPaymentMethod === "upi" && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-sm text-slate-400 mb-4">Scan the QR code with your UPI app</p>
                      <img
                        src={generateQRCode(`upi://pay?pa=merchant@axis&pn=CarWash&am=${addMoneyAmount}&tn=Add%20Money&tr=order_${Date.now()}`)}
                        alt="UPI QR Code"
                        className="w-40 h-40 mx-auto border-4 border-blue-500 rounded-lg"
                      />
                    </div>
                    <div className="bg-blue-600/20 border border-blue-500/50 rounded-lg p-3">
                      <p className="text-xs text-blue-300 text-center">
                        📱 Scan this QR code and complete payment on your UPI app
                      </p>
                    </div>
                  </div>
                )}

                {addMoneyPaymentMethod === "card" && (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-300 mb-4">Enter your card details</p>
                    
                    {/* Card Holder Name */}
                    <div>
                      <label className="text-xs text-slate-400 mb-2 block">Card Holder Name</label>
                      <input
                        type="text"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Card Number */}
                    <div>
                      <label className="text-xs text-slate-400 mb-2 block">Card Number</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\s/g, "").slice(0, 16);
                          const formatted = val.replace(/(\d{4})/g, "$1 ").trim();
                          setCardNumber(formatted);
                        }}
                        placeholder="1234 5678 9012 3456"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>

                    {/* Expiry & CVV */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-400 mb-2 block">Expiry (MM/YY)</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                            if (val.length >= 2) {
                              setCardExpiry(`${val.slice(0, 2)}/${val.slice(2)}`);
                            } else {
                              setCardExpiry(val);
                            }
                          }}
                          placeholder="MM/YY"
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 mb-2 block">CVV</label>
                        <input
                          type="text"
                          value={cardCVV}
                          onChange={(e) => setCardCVV(e.target.value.replace(/\D/g, "").slice(0, 3))}
                          placeholder="123"
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {addMoneyPaymentMethod === "wallet" && (
                  <div className="space-y-4 bg-purple-600/20 border border-purple-500/50 rounded-lg p-4">
                    <p className="text-sm text-slate-300">Paying from Wallet</p>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Amount:</span>
                      <span className="text-lg font-bold text-purple-300">
                        ₹{(parseInt(addMoneyAmount || 0) + Math.round(parseInt(addMoneyAmount || 0) * 0.18)).toLocaleString("en-IN")}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">You can add money to wallet to use this option</p>
                  </div>
                )}

                {addMoneyPaymentMethod === "netbanking" && (
                  <div className="space-y-3">
                    <p className="text-sm text-slate-300 mb-3">Select your bank</p>
                    <div className="grid grid-cols-2 gap-2">
                      {["HDFC", "ICICI", "Axis", "SBI", "BOI", "Kotak"].map((bank) => (
                        <button
                          key={bank}
                          className="py-3 px-2 bg-slate-800 border border-slate-700 hover:border-blue-500 hover:bg-blue-600/10 rounded-lg text-sm font-medium text-slate-300 transition"
                        >
                          {bank}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Amount Summary */}
                <div className="bg-linear-to-r from-green-600/20 to-green-900/20 border border-green-500/50 rounded-lg p-4 space-y-2">
                  <p className="text-xs font-semibold text-green-300 uppercase tracking-wider mb-3">💳 Amount Summary</p>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-300">Amount:</span>
                    <span className="font-semibold">₹{parseInt(addMoneyAmount || 0).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-green-500/30 mb-2">
                    <span className="text-slate-300">GST (18%):</span>
                    <span className="font-semibold">
                      ₹{Math.round((parseInt(addMoneyAmount || 0) * 0.18)).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-green-300 font-bold">Total:</span>
                    <span className="text-lg font-bold text-green-300">
                      ₹{(parseInt(addMoneyAmount || 0) + Math.round(parseInt(addMoneyAmount || 0) * 0.18)).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setAddMoneyStep("amount")}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-medium transition"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleAddMoneyPayment}
                    disabled={addMoneyPaymentMethod === "card" && (!cardNumber || !cardExpiry || !cardCVV || !cardName)}
                    className="flex-1 py-3 bg-linear-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold transition"
                  >
                    Pay Now
                  </button>
                </div>
              </>
            )}

            {/* STEP 3: PROCESSING */}
            {addMoneyStep === "processing" && (
              <div className="space-y-6 text-center">
                <div className="flex justify-center">
                  <div className="w-16 h-16 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
                <div>
                  <p className="text-lg font-semibold text-white mb-2">Processing Payment...</p>
                  <p className="text-sm text-slate-400">Please wait while we verify your payment</p>
                </div>
                <div className="bg-blue-600/10 border border-blue-500/50 rounded-lg p-3">
                  <p className="text-xs text-blue-300">
                    {addMoneyPaymentMethod === "upi" && "📱 Complete payment on your UPI app"}
                    {addMoneyPaymentMethod === "card" && "💳 Processing card payment"}
                    {addMoneyPaymentMethod === "wallet" && "👛 Deducting from wallet"}
                    {addMoneyPaymentMethod === "netbanking" && "🏦 Processing net banking"}
                  </p>
                </div>
              </div>
            )}

            {/* SUCCESS MESSAGE */}
            {addMoneyStep === "processing" && addMoneyVerified && addMoneyStatus === "success" && (
              <div className="space-y-4 text-center">
                <div className="text-5xl animate-pulse">✅</div>
                <div>
                  <p className="text-lg font-bold text-green-300 mb-1">Payment Successful!</p>
                  <p className="text-sm text-green-200">₹{(parseInt(addMoneyAmount || 0) + Math.round(parseInt(addMoneyAmount || 0) * 0.18)).toLocaleString("en-IN")} added to your wallet</p>
                </div>
                <div className="bg-green-600/20 border border-green-500/50 rounded-lg p-3">
                  <p className="text-xs text-green-300">Amount received in your account. Closing...</p>
                </div>
              </div>
            )}

            {/* FAILURE MESSAGE */}
            {addMoneyStatus === "failed" && (
              <div className="space-y-4 text-center">
                <div className="text-5xl">❌</div>
                <div>
                  <p className="text-lg font-bold text-red-300 mb-1">Payment Failed</p>
                  <p className="text-sm text-red-200">Unable to process your payment</p>
                </div>
                <button
                  onClick={() => {
                    setAddMoneyStep("confirm");
                    setAddMoneyStatus(null);
                  }}
                  className="w-full py-3 bg-orange-600 hover:bg-orange-700 rounded-lg font-medium transition"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Security Info */}
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <p className="text-xs text-slate-400">
                🔒 Your payment is encrypted and secure
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
