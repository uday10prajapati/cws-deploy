import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { Link, useLocation } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext";
import { useRoleBasedRedirect } from "../utils/roleBasedRedirect";
import {
  FiMenu,
  FiBell,
  FiCalendar,
  FiClock,
  FiTag,
  FiTruck,
  FiMessageSquare,
  FiChevronLeft,
  FiLogOut,
  FiHome,
  FiClipboard,
  FiUser,
  FiCreditCard,
  FiAward,
  FiCheckCircle,
  FiX,
  FiMapPin,
} from "react-icons/fi";
import { FaCar } from "react-icons/fa";

export default function BookingPage() {
  const routerLocation = useLocation();
  const { addNotification } = useNotifications();

    useRoleBasedRedirect("customer");

  // Sidebar / layout
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Auth + cars
  const [user, setUser] = useState(null);
  const [cars, setCars] = useState([]);

  // Existing bookings
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Booking form state
  const [selectedCarId, setSelectedCarId] = useState("");
  const [selectedServices, setSelectedServices] = useState([]);
  const [pickup, setPickup] = useState(false);
  const [notes, setNotes] = useState("");
  const [customCarName, setCustomCarName] = useState("");
  const [location, setLocation] = useState("");

  // Calendar-based date picker
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() }; // month 0–11
  });
  const [selectedDate, setSelectedDate] = useState(""); // "YYYY-MM-DD"

  // Time slot
  const [timeSlot, setTimeSlot] = useState("");

  // Add-on modal
  const [addonModalOpen, setAddonModalOpen] = useState(false);
  const [modalServiceName, setModalServiceName] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState({}); // { serviceName: [addonId, ...] }

  // UX state
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [paymentReceived, setPaymentReceived] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [bookingAmount, setBookingAmount] = useState(0);
  const [pendingBookingData, setPendingBookingData] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("upi");
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentStep, setPaymentStep] = useState("method"); // "method" or "processing"

  // Monthly pass state
  const [activePass, setActivePass] = useState(null);
  const [usePass, setUsePass] = useState(false);

  // Menu for sidebar
  const customerMenu = [
    { name: "Dashboard", icon: <FiHome />, link: "/customer-dashboard" },
        { name: "My Bookings", icon: <FiClipboard />, link: "/bookings" },
        { name: "My Cars", icon: <FaCar />, link: "/my-cars" },
        { name: "Monthly Pass", icon: <FiAward />, link: "/monthly-pass" },
        { name: "Profile", icon: <FiUser />, link: "/profile" },
        { name: "Location", icon: <FiMapPin />, link: "/location" },
        { name: "Transactions", icon: <FiCreditCard />, link: "/transactions" },
      ];

  // Service options
  const serviceOptions = [
    { id: 1, name: "Exterior Wash", price: 299 },
    { id: 2, name: "Interior Cleaning", price: 399 },
    { id: 3, name: "Full Wash", price: 649 },
    { id: 4, name: "Premium Detailing", price: 1299 },
  ];

  // Add-on options (shown in modal)
  const addonOptions = [
    { id: "rain", name: "Rain Repellent", price: 199 },
    { id: "tyre", name: "Tyre Shine", price: 149 },
    { id: "engine", name: "Engine Bay Clean", price: 299 },
    { id: "perfume", name: "Premium Perfume", price: 99 },
  ];

  // Time slots
  const timeSlots = [
    "09:00 – 10:00",
    "10:00 – 11:00",
    "11:00 – 12:00",
    "12:00 – 13:00",
    "14:00 – 15:00",
    "15:00 – 16:00",
    "16:00 – 17:00",
  ];

  // Load user + cars + monthly pass + bookings
  useEffect(() => {
    const load = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) return;
      setUser(auth.user);

      const { data: carList } = await supabase
        .from("cars")
        .select("*")
        .eq("customer_id", auth.user.id);

      setCars(carList || []);

      // Load user address from backend API instead of direct Supabase query
      try {
        const response = await fetch(`http://localhost:5000/profile/address/${auth.user.id}`);
        const result = await response.json();

        if (result.success && result.address?.address) {
          // Format address as: street, city, state
          const profileData = result.address;
          const formattedAddress = `${profileData.address}${profileData.city ? ', ' + profileData.city : ''}${profileData.state ? ', ' + profileData.state : ''}`;
          setLocation(formattedAddress);
        }
      } catch (err) {
        console.error("Error loading address:", err);
      }

      // Load existing bookings from backend API instead of direct Supabase query
      setLoadingBookings(true);
      try {
        console.log(`📋 Fetching bookings for customer ${auth.user.id}...`);
        const response = await fetch(`http://localhost:5000/bookings/customer/${auth.user.id}`);
        const result = await response.json();
        
        if (result.success) {
          console.log(`✅ Retrieved ${result.bookings?.length || 0} bookings`);
          setBookings(result.bookings || []);
        } else {
          console.error("❌ Error fetching bookings:", result.error);
          setBookings([]);
        }
      } catch (err) {
        console.error("❌ Error fetching bookings from API:", err);
        setBookings([]);
      }
      setLoadingBookings(false);

      // Load active monthly pass
      try {
        const res = await fetch(
          `http://localhost:5000/pass/current/${auth.user.id}`
        );
        const result = await res.json();
        if (result.success && result.data) {
          setActivePass(result.data);
          console.log("✅ Active pass loaded:", result.data);
        }
      } catch (err) {
        console.error("Error loading pass:", err);
      }
    };

    load();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  /* ---------- Calendar Helpers ---------- */

  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, []);

  const buildCalendarDays = () => {
    const { year, month } = calendarMonth;
    const firstDay = new Date(year, month, 1);
    const startDay = firstDay.getDay(); // 0 (Sun) - 6 (Sat)
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    // leading blanks
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    // actual days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  };

  const calendarDays = buildCalendarDays();

  const isPast = (dateObj) => {
    if (!dateObj) return false;
    const today = new Date();
    // strip time
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateObj);
    target.setHours(0, 0, 0, 0);
    return target < today;
  };

  const formatDateISO = (dateObj) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const goToPrevMonth = () => {
    setCalendarMonth((prev) => {
      const d = new Date(prev.year, prev.month - 1, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const goToNextMonth = () => {
    setCalendarMonth((prev) => {
      const d = new Date(prev.year, prev.month + 1, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  /* ---------- Service & Add-ons ---------- */

  const toggleService = (srvName) => {
    setSelectedServices((prev) =>
      prev.includes(srvName)
        ? prev.filter((s) => s !== srvName)
        : [...prev, srvName]
    );
  };

  const openAddonModal = (serviceName) => {
    setModalServiceName(serviceName);
    setAddonModalOpen(true);
  };

  const closeAddonModal = () => {
    setAddonModalOpen(false);
    setModalServiceName(null);
  };

  const toggleAddon = (addonId) => {
    if (!modalServiceName) return;
    setSelectedAddons((prev) => {
      const currentServiceAddons = prev[modalServiceName] || [];
      const exists = currentServiceAddons.includes(addonId);
      const updated = exists
        ? currentServiceAddons.filter((id) => id !== addonId)
        : [...currentServiceAddons, addonId];

      return {
        ...prev,
        [modalServiceName]: updated,
      };
    });
  };

  const getAddonsForService = (serviceName) =>
    selectedAddons[serviceName] || [];

  /* ---------- PASS BENEFITS ---------- */
  // Determine if pass includes free delivery
  const getPassBenefits = () => {
    if (!activePass) return { freeDelivery: false };
    
    const totalWashes = activePass.total_washes;
    // Premium (16 washes) = Free delivery
    // Standard (8 washes) = Free delivery  
    // Basic (4 washes) = No free delivery
    return {
      freeDelivery: totalWashes >= 8,
    };
  };

  const passbenefits = getPassBenefits();

  /* ---------- Price Calculation ---------- */

  const baseTotal = serviceOptions
    .filter((s) => selectedServices.includes(s.name))
    .reduce((sum, s) => sum + s.price, 0);

  const addonsTotal = Object.entries(selectedAddons).reduce(
    (sum, [serviceName, addonIds]) => {
      if (!selectedServices.includes(serviceName)) return sum; // only count if main service selected
      const serviceAddonPrice = addonIds.reduce((inner, id) => {
        const addon = addonOptions.find((a) => a.id === id);
        return inner + (addon ? addon.price : 0);
      }, 0);
      return sum + serviceAddonPrice;
    },
    0
  );

  // Calculate pickup charge - FREE if using pass with free delivery benefit
  const pickupCharge = 
    pickup ? (usePass && passbenefits.freeDelivery ? 0 : 99) : 0;
  
  // When using pass: User must select only ONE service (the free basic wash)
  // If they select multiple services, they must pay for ALL of them
  // Pass only covers ONE basic wash service
  const totalPrice = usePass ? baseTotal + addonsTotal + pickupCharge : baseTotal + addonsTotal + pickupCharge;

  /* ---------- Submit Booking ---------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    // Services are required UNLESS using monthly pass
    if (!usePass) {
      if (
        !customCarName ||
        !selectedServices.length ||
        !selectedDate ||
        !timeSlot
      )
        return;
    } else {
      // When using pass, only require: car name, date, time
      if (!customCarName || !selectedDate || !timeSlot) return;
    }

    // Check if using pass but no pass available
    if (usePass && !activePass) {
      alert("No active pass available!");
      return;
    }

    // Check if using pass and has remaining washes
    if (usePass && activePass.remaining_washes <= 0) {
      alert("No remaining washes in your pass!");
      return;
    }

    // Show payment page if payment is needed
    if (!usePass && totalPrice > 0) {
      setBookingAmount(totalPrice);
      setPendingBookingData({
        customer_id: user.id,
        car_id: selectedCarId,
        car_name: customCarName,
        services: selectedServices,
        addons: selectedAddons,
        amount: totalPrice,
        date: selectedDate,
        time: timeSlot,
        pickup,
        notes,
        status: "Pending",
        location: location || "Main Outlet",
        pass_id: null,
      });
      setShowPayment(true);
      return;
    }

    // If using pass (free), proceed directly
    await completeBooking();
  };

  const completeBooking = async () => {
    setLoading(true);

    const bookingData = pendingBookingData || {
      customer_id: user.id,
      car_id: selectedCarId,
      car_name: customCarName,
      services: selectedServices,
      addons: selectedAddons,
      amount: usePass ? 0 : totalPrice,
      date: selectedDate,
      time: timeSlot,
      pickup,
      notes,
      status: "Pending",
      location: location || "Main Outlet",
      pass_id: usePass ? activePass.id : null,
    };

    try {
      const response = await fetch("http://localhost:5000/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      });

      const result = await response.json();

      if (!result.success) {
        alert("Failed to create booking!");
        setLoading(false);
        return;
      }

      // If using pass, deduct one wash
      if (usePass && activePass) {
        try {
          const updateRes = await fetch(
            `http://localhost:5000/pass/${activePass.id}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                remaining_washes: activePass.remaining_washes - 1,
              }),
            }
          );

      if (updateResult.success) {
            console.log("✅ Wash deducted from pass");
            // Update local state
            setActivePass({
              ...activePass,
              remaining_washes: activePass.remaining_washes - 1,
            });
            // Send notification for pass usage
            await addNotification(
              "pass",
              "Monthly Pass Used",
              `1 wash deducted. ${activePass.remaining_washes - 1} remaining washes.`,
              { passId: activePass.id }
            );
          }
        } catch (err) {
          console.error("Error deducting wash:", err);
        }
      }
    } catch (err) {
      console.error("BOOKING ERROR:", err);
      alert("Server Error");
      setLoading(false);
      return;
    }

    // Send booking confirmation notification
    await addNotification(
      "booking",
      "✓ Booking Confirmed!",
      `Your ${usePass ? "pass" : "car wash"} booking is confirmed. Booking ID: ${result.data?.id}`,
      { bookingId: result.data?.id }
    );

    setLoading(false);
    setShowSuccess(true);

    setTimeout(() => {
      window.location.href = "/bookings";
    }, 1800);
  };

  const { year, month } = calendarMonth;
  const monthLabel = new Date(year, month, 1).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  // Selected car object
  const selectedCar = cars.find((c) => c.id === selectedCarId);

  // Initiate payment with alternative payment gateway
  const initiateAlternativePayment = async (paymentMethod) => {
    try {
      const payload = {
        amount: bookingAmount,
        customer_id: user.id,
        customer_email: user.email,
        customer_name: user.user_metadata?.full_name || "Customer",
        customer_phone: user.user_metadata?.phone || "9999999999",
        type: "booking_payment",
        payment_method: paymentMethod,
        notes: `Car: ${customCarName}, Services: ${selectedServices.join(", ")}`,
      };

      console.log("💳 Payment payload:", payload);

      const response = await fetch("http://localhost:5000/alt-payment/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log("Payment response:", result);

      if (!result.success) {
        alert(`Payment initiation failed: ${result.error}`);
        return null;
      }

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
  const handlePaymentComplete = async (paymentMethod) => {
    setSelectedPaymentMethod(paymentMethod);
    setProcessingPayment(true);

    // Initiate payment with backend
    const paymentData = await initiateAlternativePayment(paymentMethod);
    if (!paymentData) {
      setProcessingPayment(false);
      return;
    }

    // Store transaction ID for verification
    setPendingBookingData({
      ...pendingBookingData,
      transaction_id: paymentData.transaction_id,
      paymentDetails: paymentData.paymentDetails,
    });

    setPaymentStep("processing");
    setProcessingPayment(false);
  };

  // Show payment page if showPayment is true
  if (showPayment && pendingBookingData) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-blue-950 text-white flex items-center justify-center p-4">
        {/* PAYMENT PAGE */}
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold mb-2">Complete Payment</h1>
            <p className="text-slate-400">Secure payment for your car wash booking</p>
          </div>

          {paymentStep === "method" ? (
            // PAYMENT METHOD SELECTION
            <div className="grid md:grid-cols-3 gap-6">
              {/* Order Summary - Left */}
              <div className="md:col-span-1">
                <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-6 space-y-4">
                  <h3 className="text-lg font-bold">Order Summary</h3>
                  
                  <div className="space-y-3 bg-slate-800/50 p-4 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Services</span>
                      <span className="font-semibold">{selectedServices.length}x</span>
                    </div>
                    {Object.keys(selectedAddons).length > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Add-ons</span>
                        <span className="font-semibold">{Object.values(selectedAddons).flat().length}x</span>
                      </div>
                    )}
                    {pickup && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Pickup</span>
                        <span className="font-semibold">₹100</span>
                      </div>
                    )}
                  </div>

                  {/* Price Breakdown */}
                  <div className="border-t border-slate-700 pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Subtotal</span>
                      <span>₹{(bookingAmount / 1.18).toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between text-sm pb-2 border-b border-slate-700">
                      <span className="text-slate-400">GST (18%)</span>
                      <span>₹{(bookingAmount - bookingAmount / 1.18).toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-green-400">
                      <span>Total</span>
                      <span>₹{bookingAmount}</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 text-center pt-2">
                    🔒 Secure & Encrypted Payment
                  </div>
                </div>
              </div>

              {/* Payment Methods - Right */}
              <div className="md:col-span-2">
                <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-6 space-y-6">
                  <h3 className="text-lg font-bold">Select Payment Method</h3>

                  <div className="space-y-3">
                    {/* UPI */}
                    <label className="flex items-center gap-4 p-4 border-2 border-slate-700 rounded-xl hover:border-blue-500 hover:bg-blue-600/10 cursor-pointer transition">
                      <input
                        type="radio"
                        name="payment-method"
                        value="upi"
                        checked={selectedPaymentMethod === "upi"}
                        onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                        className="w-5 h-5"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-lg">📱 UPI</p>
                        <p className="text-sm text-slate-400">Google Pay, PhonePe, PayTM</p>
                      </div>
                      <span className="text-2xl text-blue-400">→</span>
                    </label>

                    {/* Credit/Debit Card */}
                    <label className="flex items-center gap-4 p-4 border-2 border-slate-700 rounded-xl hover:border-purple-500 hover:bg-purple-600/10 cursor-pointer transition">
                      <input
                        type="radio"
                        name="payment-method"
                        value="card"
                        checked={selectedPaymentMethod === "card"}
                        onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                        className="w-5 h-5"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-lg">💳 Credit/Debit Card</p>
                        <p className="text-sm text-slate-400">Visa, MasterCard, Rupay</p>
                      </div>
                      <span className="text-2xl text-purple-400">→</span>
                    </label>

                    {/* Wallet */}
                    <label className="flex items-center gap-4 p-4 border-2 border-slate-700 rounded-xl hover:border-green-500 hover:bg-green-600/10 cursor-pointer transition">
                      <input
                        type="radio"
                        name="payment-method"
                        value="wallet"
                        checked={selectedPaymentMethod === "wallet"}
                        onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                        className="w-5 h-5"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-lg">👛 Wallet</p>
                        <p className="text-sm text-slate-400">CarWash+ Wallet Balance</p>
                      </div>
                      <span className="text-2xl text-green-400">→</span>
                    </label>

                    {/* Net Banking */}
                    <label className="flex items-center gap-4 p-4 border-2 border-slate-700 rounded-xl hover:border-orange-500 hover:bg-orange-600/10 cursor-pointer transition">
                      <input
                        type="radio"
                        name="payment-method"
                        value="netbanking"
                        checked={selectedPaymentMethod === "netbanking"}
                        onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                        className="w-5 h-5"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-lg">🏦 Net Banking</p>
                        <p className="text-sm text-slate-400">All major Indian banks</p>
                      </div>
                      <span className="text-2xl text-orange-400">→</span>
                    </label>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-slate-700">
                    <button
                      onClick={() => {
                        setShowPayment(false);
                        setPendingBookingData(null);
                        setPaymentStep("method");
                      }}
                      className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-semibold transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handlePaymentComplete(selectedPaymentMethod)}
                      disabled={loading}
                      className="flex-1 py-3 bg-linear-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold transition flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <FiCreditCard /> Pay ₹{bookingAmount}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // PAYMENT PROCESSING - SHOW METHOD SPECIFIC UI
            <div className="max-w-md mx-auto">
              {selectedPaymentMethod === "upi" ? (
                // UPI QR CODE - REAL PAYMENT
                <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-8 space-y-6 text-center">
                  <h2 className="text-2xl font-bold">📱 Scan to Pay with UPI</h2>
                  
                  {pendingBookingData?.paymentDetails?.upi_link ? (
                    <>
                      <div className="bg-white p-6 rounded-xl">
                        <img 
                          src={generateQRCode(pendingBookingData.paymentDetails.upi_link)} 
                          alt="UPI QR Code" 
                          className="w-64 h-64 mx-auto"
                        />
                      </div>

                      <div className="space-y-2">
                        <p className="text-slate-400">Pay to:</p>
                        <p className="text-lg font-bold text-blue-300">{pendingBookingData.paymentDetails.upi_id}</p>
                      </div>
                    </>
                  ) : (
                    <div className="text-slate-400">Loading QR code...</div>
                  )}

                  <div className="space-y-2">
                    <p className="text-slate-400">Scan with any UPI app:</p>
                    <p className="text-sm text-slate-500">Google Pay • PhonePe • PayTM • BHIM</p>
                  </div>

                  <div className="bg-blue-600/20 border border-blue-500/50 rounded-lg p-4">
                    <p className="text-lg font-bold text-blue-300">Amount: ₹{bookingAmount}</p>
                  </div>

                  {/* UTR Input for Verification */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-300">Enter UTR / Reference ID:</label>
                    <input 
                      type="text" 
                      placeholder="e.g., 412412412412 or TXN123456"
                      id="utr-input"
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-green-500 focus:outline-none text-white"
                    />
                    <p className="text-xs text-slate-500">You'll receive this from your UPI app after payment</p>
                  </div>

                  <button
                    onClick={async () => {
                      const utrInput = document.getElementById("utr-input")?.value?.trim();
                      if (!utrInput) {
                        alert("Please enter UTR/Reference ID");
                        return;
                      }
                      
                      const verified = await verifyPayment(
                        pendingBookingData.transaction_id,
                        "upi",
                        { upi_ref_id: utrInput, payment_timestamp: new Date().toISOString() }
                      );
                      
                      if (verified) {
                        setShowPayment(false);
                        // Send payment notification
                        await addNotification(
                          "payment",
                          "💳 Payment Successful!",
                          `Payment of ₹${bookingAmount} received via UPI (UTR: ${utrInput})`,
                          { amount: bookingAmount, method: "UPI", utr: utrInput }
                        );
                        await completeBooking();
                        setShowSuccess(true);
                        setTimeout(() => {
                          window.location.href = "/bookings";
                        }, 1800);
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
              ) : selectedPaymentMethod === "bank_transfer" ? (
                // BANK TRANSFER - MANUAL VERIFICATION
                <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-8 space-y-6">
                  <h2 className="text-2xl font-bold text-center">🏦 Bank Transfer</h2>
                  
                  {pendingBookingData?.paymentDetails ? (
                    <>
                      <div className="bg-slate-800/50 rounded-lg p-4 space-y-3 text-left">
                        <p className="font-semibold text-green-300">Transfer Details:</p>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Bank Name:</span>
                            <span className="font-semibold">{pendingBookingData.paymentDetails.bank_name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Account Holder:</span>
                            <span className="font-semibold">{pendingBookingData.paymentDetails.account_holder}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Account Number:</span>
                            <span className="font-mono">{pendingBookingData.paymentDetails.account_number}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">IFSC Code:</span>
                            <span className="font-mono font-semibold">{pendingBookingData.paymentDetails.ifsc_code}</span>
                          </div>
                          <div className="border-t border-slate-700 pt-2 mt-2 flex justify-between">
                            <span className="text-blue-300">Amount:</span>
                            <span className="text-lg font-bold text-blue-300">₹{bookingAmount}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-amber-600/20 border border-amber-500/50 rounded-lg p-3 text-sm text-amber-200">
                        ⏱️ Transfer may take 1-2 hours to reflect
                      </div>

                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-slate-300">Confirm Transfer & Enter Details:</label>
                        <input 
                          type="text" 
                          placeholder="Reference / Cheque / UTR number"
                          id="bank-ref"
                          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-green-500 focus:outline-none text-white"
                        />
                        <input 
                          type="date" 
                          id="bank-date"
                          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-green-500 focus:outline-none text-white"
                        />
                      </div>

                      <button
                        onClick={async () => {
                          const refNumber = document.getElementById("bank-ref")?.value?.trim();
                          const transferDate = document.getElementById("bank-date")?.value;
                          if (!refNumber || !transferDate) {
                            alert("Please fill all fields");
                            return;
                          }
                          
                          const verified = await verifyPayment(
                            pendingBookingData.transaction_id,
                            "bank_transfer",
                            { reference_number: refNumber, transfer_date: transferDate }
                          );
                          
                          if (verified) {
                            setShowPayment(false);
                            await completeBooking();
                            setShowSuccess(true);
                            setTimeout(() => {
                              window.location.href = "/bookings";
                            }, 1800);
                          } else {
                            alert("Payment verification failed. Admin will confirm manually.");
                          }
                        }}
                        className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition"
                      >
                        ✓ Verify Transfer
                      </button>

                      <button
                        onClick={() => setPaymentStep("method")}
                        className="w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-semibold transition"
                      >
                        Back
                      </button>
                    </>
                  ) : (
                    <p className="text-slate-400">Loading bank details...</p>
                  )}
                </div>
              ) : selectedPaymentMethod === "net_banking" ? (
                // NET BANKING
                <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-8 space-y-6 text-center">
                  <h2 className="text-2xl font-bold">🏦 Net Banking</h2>
                  
                  <div className="space-y-3">
                    <p className="text-slate-400">Select your bank and complete payment:</p>
                    <div className="grid grid-cols-2 gap-3">
                      {["HDFC", "ICICI", "Axis", "SBI", "BOI", "Kotak"].map((bank) => (
                        <button
                          key={bank}
                          onClick={async () => {
                            const confirmed = window.confirm(`Complete payment via ${bank} Net Banking?`);
                            if (confirmed) {
                              const verified = await verifyPayment(
                                pendingBookingData.transaction_id,
                                "net_banking",
                                { bank_name: bank, confirmation_number: `${bank}-${Date.now()}` }
                              );
                              
                              if (verified) {
                                setShowPayment(false);
                                await completeBooking();
                                setShowSuccess(true);
                                setTimeout(() => {
                                  window.location.href = "/bookings";
                                }, 1800);
                              }
                            }
                          }}
                          className="py-3 bg-slate-800 hover:bg-orange-600/30 border border-slate-700 hover:border-orange-500 rounded-lg font-medium transition"
                        >
                          {bank}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-orange-600/20 border border-orange-500/50 rounded-lg p-4">
                    <p className="text-lg font-bold text-orange-300">Amount: ₹{bookingAmount}</p>
                  </div>

                  <button
                    onClick={() => setPaymentStep("method")}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-semibold transition"
                  >
                    Back
                  </button>
                </div>
              ) : selectedPaymentMethod === "card" ? (
                // CARD PAYMENT
                <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-8 space-y-6">
                  <h2 className="text-2xl font-bold text-center">💳 Card Payment</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Card Number</label>
                      <input 
                        type="text" 
                        placeholder="1234 5678 9012 3456" 
                        id="card-number"
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Expiry</label>
                        <input 
                          type="text" 
                          placeholder="MM/YY" 
                          id="card-expiry"
                          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">CVV</label>
                        <input 
                          type="text" 
                          placeholder="123" 
                          id="card-cvv"
                          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Authorization Code</label>
                      <input 
                        type="text" 
                        placeholder="Received from bank"
                        id="card-auth"
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="purple-600/20 border border-purple-500/50 rounded-lg p-4 text-center">
                    <p className="text-lg font-bold text-purple-300">Amount: ₹{bookingAmount}</p>
                  </div>

                  <button
                    onClick={async () => {
                      const last4 = document.getElementById("card-number")?.value?.slice(-4);
                      const authCode = document.getElementById("card-auth")?.value?.trim();
                      
                      if (!last4 || !authCode) {
                        alert("Please fill all fields");
                        return;
                      }

                      const verified = await verifyPayment(
                        pendingBookingData.transaction_id,
                        "card",
                        { card_last4: last4, auth_code: authCode }
                      );
                      
                      if (verified) {
                        setShowPayment(false);
                        await completeBooking();
                        setShowSuccess(true);
                        setTimeout(() => {
                          window.location.href = "/bookings";
                        }, 1800);
                      } else {
                        alert("Card payment verification failed");
                      }
                    }}
                    className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                  >
                    ✓ Confirm Payment
                  </button>

                  <button
                    onClick={() => setPaymentStep("method")}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-semibold transition"
                  >
                    Back
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
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
                  routerLocation.pathname === item.link
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
          <h1 className="text-2xl font-bold">Book a Wash</h1>

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

        {/* PAGE CONTENT */}
        <main className="p-4 md:p-8 space-y-6">
          {/* Heading */}
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-2">
              <FaCar className="text-blue-400" />
              Car Wash Booking
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Choose your car, services, and schedule. We’ll confirm your slot
              via SMS / WhatsApp.
            </p>
          </div>

          {/* EXISTING BOOKINGS SECTION */}
          {bookings.length > 0 && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FiClipboard className="text-amber-400" />
                Your Bookings ({bookings.length})
              </h3>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {bookings.map((booking) => {
                  const statusSteps = ["Pending", "Confirmed", "In Progress", "Completed"];
                  const currentStatusIdx = statusSteps.findIndex(s => s.toLowerCase() === (booking.status || "pending").toLowerCase());
                  
                  return (
                    <div
                      key={booking.id}
                      className="p-4 bg-slate-900/60 border border-slate-700 rounded-lg hover:border-blue-500 hover:bg-slate-900/80 transition"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-semibold text-blue-300">
                          {booking.car_name || "Unknown Car"}
                        </p>
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold border ${
                          booking.status === 'Completed' ? 'bg-green-600/30 text-green-300 border-green-500/30' :
                          booking.status === 'In Progress' ? 'bg-blue-600/30 text-blue-300 border-blue-500/30' :
                          booking.status === 'Confirmed' ? 'bg-yellow-600/30 text-yellow-300 border-yellow-500/30' :
                          'bg-slate-600/30 text-slate-300 border-slate-500/30'
                        }`}>
                          {booking.status || 'Pending'}
                        </span>
                      </div>

                      {/* Status Timeline */}
                      <div className="mb-3 p-3 bg-slate-800/50 rounded border border-slate-700">
                        <div className="flex justify-between items-center gap-1">
                          {statusSteps.map((step, idx) => (
                            <div key={step} className="flex flex-col items-center flex-1">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                  idx < currentStatusIdx
                                    ? "bg-green-600 text-white"
                                    : idx === currentStatusIdx
                                    ? "bg-blue-600 text-white ring-2 ring-blue-400"
                                    : "bg-slate-700 text-slate-400"
                                }`}
                              >
                                {idx + 1}
                              </div>
                              <p className="text-[10px] text-center mt-1 text-slate-400">{step}</p>
                              {idx < statusSteps.length - 1 && (
                                <div className={`h-1 w-2 mt-1 ${idx < currentStatusIdx ? "bg-green-600" : "bg-slate-600"}`} />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Booking Info */}
                      <p className="text-xs text-slate-400 mb-2">
                        📅 {booking.date} at {booking.time} • 📍 {booking.location}
                      </p>
                      <p className="text-sm text-slate-300">
                        Amount: <span className="font-semibold text-blue-300">₹{booking.amount}</span>
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* LEFT: FORM CARD */}
            <form
              onSubmit={handleSubmit}
              className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6"
            >
              {/* Car Selection */}
              <div>
                <label className="font-semibold flex items-center gap-2 mb-2 text-sm">
                  <FaCar className="text-blue-400" />
                  Your Car
                  <span className="text-red-400">*</span>
                </label>

                <input
                  type="text"
                  placeholder="Enter your car name (e.g., Honda City, Swift, Creta)…"
                  value={customCarName}
                  onChange={(e) => setCustomCarName(e.target.value)}
                  required
                  className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-sm 
               focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Services */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-semibold flex items-center gap-2 text-sm">
                    <FiTag className="text-green-400" />
                    Services
                    <span className="text-red-400">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Tap a card to select. Use “Add-ons” for extras.
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {serviceOptions.map((srv) => {
                    const active = selectedServices.includes(srv.name);
                    const addonsForService = getAddonsForService(srv.name);
                    const addonsPrice = addonsForService.reduce((sum, id) => {
                      const addon = addonOptions.find((a) => a.id === id);
                      return sum + (addon ? addon.price : 0);
                    }, 0);

                    return (
                      <div
                        key={srv.id}
                        className={`rounded-lg border p-4 text-sm cursor-pointer transition
                          ${
                            active
                              ? "bg-blue-600/20 border-blue-500/80 shadow-lg"
                              : "bg-slate-900 border-slate-700 hover:border-blue-500/70"
                          }`}
                        onClick={() => toggleService(srv.name)}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="font-semibold">{srv.name}</p>
                          <p className="font-semibold text-blue-400">
                            ₹{srv.price + addonsPrice}
                          </p>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {srv.name === "Exterior Wash" &&
                            "Foam wash, rinse, wipe, wheels"}
                          {srv.name === "Interior Cleaning" &&
                            "Vacuum, dash cleaning, windows"}
                          {srv.name === "Full Wash" &&
                            "Interior + exterior combo"}
                          {srv.name === "Premium Detailing" &&
                            "Machine polish, wax, deep clean"}
                        </p>
                        <div className="flex items-center justify-between mt-3">
                          <span
                            className={`text-[11px] px-2 py-1 rounded-full border
                              ${
                                active
                                  ? "border-green-500 text-green-300 bg-green-600/20"
                                  : "border-slate-600 text-slate-400"
                              }`}
                          >
                            {active ? "Selected" : "Tap to select"}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openAddonModal(srv.name);
                            }}
                            className="text-[11px] underline text-slate-300 hover:text-pink-300"
                          >
                            Add-ons
                          </button>
                        </div>

                        {addonsForService.length > 0 && (
                          <div className="mt-2 text-[11px] text-pink-300">
                            Extras:{" "}
                            {addonsForService
                              .map(
                                (id) =>
                                  addonOptions.find((a) => a.id === id)?.name ||
                                  ""
                              )
                              .join(", ")}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Date + Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Calendar date picker */}
                <div>
                  <label className="font-semibold flex items-center gap-2 mb-2 text-sm">
                    <FiCalendar className="text-purple-400" />
                    Date
                    <span className="text-red-400">*</span>
                  </label>

                  <div className="bg-slate-900 border border-slate-700 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2 text-xs">
                      <button
                        type="button"
                        onClick={goToPrevMonth}
                        className="px-2 py-1 rounded hover:bg-slate-800"
                      >
                        ◀
                      </button>
                      <span className="font-semibold">{monthLabel}</span>
                      <button
                        type="button"
                        onClick={goToNextMonth}
                        className="px-2 py-1 rounded hover:bg-slate-800"
                      >
                        ▶
                      </button>
                    </div>

                    <div className="grid grid-cols-7 text-[10px] text-slate-400 mb-1">
                      {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                        <div key={d} className="text-center py-1">
                          {d}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-xs">
                      {calendarDays.map((day, idx) => {
                        if (!day) {
                          return <div key={idx} className="h-7 rounded"></div>;
                        }

                        const dayStr = formatDateISO(day);
                        const disabled = isPast(day);
                        const selected = selectedDate === dayStr;

                        return (
                          <button
                            key={idx}
                            type="button"
                            disabled={disabled}
                            onClick={() => setSelectedDate(dayStr)}
                            className={`h-7 rounded flex items-center justify-center border
                              ${
                                disabled
                                  ? "border-slate-800 text-slate-600 cursor-not-allowed"
                                  : selected
                                  ? "border-blue-500 bg-blue-600/30 text-white"
                                  : "border-slate-700 hover:border-blue-500 hover:bg-slate-800"
                              }`}
                          >
                            {day.getDate()}
                          </button>
                        );
                      })}
                    </div>

                    <p className="mt-2 text-[11px] text-slate-400">
                      Selected:{" "}
                      {selectedDate ? selectedDate : "No date selected yet"}
                    </p>
                  </div>
                </div>

                {/* Time slot */}
                <div>
                  <label className="font-semibold flex items-center gap-2 mb-2 text-sm">
                    <FiClock className="text-yellow-400" />
                    Time Slot
                    <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    required
                    className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select time…</option>
                    {timeSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>

                  <p className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-400" />
                    Same-day slots are subject to availability.
                  </p>
                </div>
              </div>

              {/* Pickup / Notes */}
              <div className="flex flex-col gap-3">
                <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pickup}
                    onChange={(e) => setPickup(e.target.checked)}
                    className="accent-blue-500"
                  />
                  <span className="flex items-center gap-1">
                    <FiTruck className="text-orange-400" />
                    Need pickup & drop?{" "}
                    <span className="text-xs text-slate-400">
                      (+₹99 convenience)
                    </span>
                  </span>
                </label>
                <div>
                  <label className="flex items-center gap-2 mb-1 text-sm">
                    <FiMessageSquare className="text-blue-400" />
                    Location 
                  </label>
                  <input
  type="text"
  placeholder="Enter pickup or wash location…"
  value={location}
  onChange={(e) => setLocation(e.target.value)}
  className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-sm 
  focus:outline-none focus:ring-2 focus:ring-blue-500"
/>

                </div>

                <div>
                  <label className="flex items-center gap-2 mb-1 text-sm">
                    <FiMessageSquare className="text-pink-400" />
                    Notes (optional)
                  </label>
                  <textarea
                    className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Landmark, gate instructions, pet hair, extra dirty, etc."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={
                  loading ||
                  !customCarName ||
                  (!usePass && !selectedServices.length) ||
                  !selectedDate ||
                  !timeSlot
                }
                className={`w-full py-3 rounded-lg font-semibold mt-2 transition shadow-lg flex items-center justify-center gap-2
                  ${
                    loading ||
                    !customCarName ||
                    (!usePass && !selectedServices.length) ||
                    !selectedDate ||
                    !timeSlot
                      ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Booking…
                  </>
                ) : (
                  <>
                    Confirm Booking
                    <span>→</span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-slate-500 mt-1">
                By confirming, you agree to receive booking updates over SMS /
                WhatsApp.
              </p>
            </form>

            {/* RIGHT: MONTHLY PASS + SUMMARY CARD */}
            <div className="space-y-6">
              {/* MONTHLY PASS CARD - Only show if user has active pass */}
              {activePass && (
                <div className="bg-linear-to-br from-amber-600/20 to-amber-900/20 border border-amber-500/50 rounded-xl p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <FiAward className="text-amber-400" />
                      Monthly Pass
                    </h3>
                    <span className="text-xs bg-amber-600/30 px-3 py-1 rounded-full text-amber-300">
                      Active
                    </span>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center p-2 bg-slate-800/30 rounded">
                      <span className="text-sm text-slate-300">Remaining Washes:</span>
                      <span className="text-sm font-bold text-amber-400">
                        {activePass.remaining_washes} / {activePass.total_washes}
                      </span>
                    </div>

                    <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-amber-500 h-3 rounded-full transition-all"
                        style={{
                          width: `${
                            ((activePass.total_washes -
                              activePass.remaining_washes) /
                              activePass.total_washes) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>

                    <div className="flex justify-between text-xs text-slate-400">
                      <span>
                        Expires: {new Date(activePass.valid_till).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Pass Benefits */}
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-xs">
                      <p className="font-semibold text-amber-300 mb-2">✨ Pass Benefits:</p>
                      <ul className="space-y-1 text-amber-200">
                        <li>✓ Free wash service</li>
                        {passbenefits.freeDelivery && (
                          <li>✓ Free pickup & delivery</li>
                        )}
                        <li>✓ Services optional (quick booking)</li>
                      </ul>
                    </div>
                  </div>

                  <label className="inline-flex items-center gap-3 cursor-pointer w-full">
                    <input
                      type="checkbox"
                      checked={usePass}
                      onChange={(e) => setUsePass(e.target.checked)}
                      className="accent-amber-500 w-4 h-4"
                    />
                    <span className="text-sm font-medium text-white">
                      Use this pass for this booking
                    </span>
                  </label>

                  {usePass && (
                    <p className="text-xs text-amber-300 mt-2 p-2 bg-amber-600/20 rounded">
                      ✓ This booking will be free! One wash will be deducted from your pass.
                    </p>
                  )}
                </div>
              )}

              {/* BOOKING SUMMARY CARD */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-xl h-fit sticky top-24 space-y-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FiCheckCircle className="text-green-400" />
                    Booking Summary
                  </h3>
                  <span className="text-[11px] px-3 py-1 rounded-full bg-blue-600/20 border border-blue-500 text-blue-200 uppercase tracking-wide">
                    Live
                  </span>
                </div>

                <div className="space-y-3 text-sm">
                {/* Car */}
                <div className="border border-slate-800 rounded-lg p-3">
                  <p className="text-[11px] text-slate-400 mb-1">Car</p>
                  <p className="font-semibold flex items-center gap-2">
                    <FaCar className="text-blue-400" />
                    {customCarName || "Not selected"}
                  </p>
                </div>

                {/* Services */}
                <div className="border border-slate-800 rounded-lg p-3">
                  <p className="text-[11px] text-slate-400 mb-1">Services</p>
                  {selectedServices.length ? (
                    <ul className="space-y-1">
                      {selectedServices.map((srv) => {
                        const base = serviceOptions.find((s) => s.name === srv);
                        const addonIds = getAddonsForService(srv);
                        const addonNames = addonIds
                          .map(
                            (id) =>
                              addonOptions.find((a) => a.id === id)?.name || ""
                          )
                          .filter(Boolean);
                        const addonPrice = addonIds.reduce((sum, id) => {
                          const addon = addonOptions.find((a) => a.id === id);
                          return sum + (addon ? addon.price : 0);
                        }, 0);

                        return (
                          <li
                            key={srv}
                            className="flex justify-between items-start gap-2"
                          >
                            <div>
                              <p className="font-medium">{srv}</p>
                              {addonNames.length > 0 && (
                                <p className="text-[11px] text-pink-300">
                                  + Extras: {addonNames.join(", ")}
                                </p>
                              )}
                            </div>
                            <p className="font-semibold text-blue-300 text-sm">
                              ₹{(base?.price || 0) + addonPrice}
                            </p>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-slate-400 text-xs">
                      No services selected yet.
                    </p>
                  )}
                </div>

                {/* Schedule */}
                <div className="border border-slate-800 rounded-lg p-3">
                  <p className="text-[11px] text-slate-400 mb-1">Schedule</p>
                  <p className="flex items-center gap-2">
                    <FiCalendar className="text-purple-400" />
                    {selectedDate || "No date"}{" "}
                    <span className="text-slate-500">•</span>
                    <FiClock className="text-yellow-400" />
                    {timeSlot || "No time"}
                  </p>
                  {selectedDate === todayStr && (
                    <p className="text-[11px] text-amber-300 mt-1">
                      You picked <span className="font-semibold">today</span> —
                      we’ll try to prioritise.
                    </p>
                  )}
                </div>

                {/* Pickup */}
                <div className="border border-slate-800 rounded-lg p-3">
                  <p className="text-[11px] text-slate-400 mb-1">
                    Pickup & Drop
                  </p>
                  <p className="flex items-center gap-2 text-sm">
                    <FiTruck className="text-orange-400" />
                    {pickup ? (
                      <>
                        Pickup & drop requested{" "}
                        {(usePass && passbenefits.freeDelivery) ? (
                          <span className="text-amber-300">(FREE)</span>
                        ) : (
                          <span>(+₹99)</span>
                        )}
                      </>
                    ) : (
                      "Not required"
                    )}
                  </p>
                </div>

                {/* Total */}
                <div className="border border-slate-800 rounded-lg p-3">
                  <p className="text-[11px] text-slate-400 mb-1">
                    Estimated Total
                  </p>
                  <p className="text-3xl font-bold text-blue-400">
                    ₹{totalPrice || 0}
                  </p>
                  {usePass ? (
                    <div className="text-[11px] text-amber-300 mt-2 space-y-1">
                      {selectedServices.length === 1 ? (
                        <>
                          <p>✓ {selectedServices[0]}: FREE with pass</p>
                        </>
                      ) : selectedServices.length > 1 ? (
                        <>
                          <p>⚠️ Multiple services selected:</p>
                          <p>Pass covers only 1 service FREE</p>
                          <p>Other services: Full charge applies</p>
                        </>
                      ) : (
                        <p>✓ One wash: FREE with pass</p>
                      )}
                      {addonsTotal > 0 && (
                        <p>+ Add-ons: ₹{addonsTotal}</p>
                      )}
                      {pickup && passbenefits.freeDelivery && (
                        <p>✓ Pickup & delivery: FREE</p>
                      )}
                      {pickup && !passbenefits.freeDelivery && (
                        <p>+ Pickup & delivery: ₹99</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 mt-1">
                      Final amount may change slightly based on vehicle condition.
                    </p>
                  )}
                </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ADD-ON MODAL */}
      {addonModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-semibold mb-1">
              Add-ons for {modalServiceName}
            </h3>
            <p className="text-[11px] text-slate-400 mb-4">
              Make your wash extra premium with these optional extras.
            </p>

            <div className="space-y-2 mb-4">
              {addonOptions.map((addon) => {
                const checked =
                  modalServiceName &&
                  (selectedAddons[modalServiceName] || []).includes(addon.id);
                return (
                  <label
                    key={addon.id}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm cursor-pointer transition
                      ${
                        checked
                          ? "bg-pink-600/20 border-pink-500"
                          : "bg-slate-900 border-slate-700 hover:border-pink-500/70"
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleAddon(addon.id)}
                        className="accent-pink-500"
                      />
                      <span>{addon.name}</span>
                    </div>
                    <span className="text-pink-300 font-semibold">
                      +₹{addon.price}
                    </span>
                  </label>
                );
              })}
            </div>

            <div className="flex justify-end gap-3 text-sm">
              <button
                type="button"
                onClick={closeAddonModal}
                className="px-4 py-2 rounded-lg border border-slate-600 text-slate-200 hover:bg-slate-800"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS OVERLAY */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-green-500/60 rounded-2xl p-8 w-full max-w-sm text-center shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-green-500 flex items-center justify-center animate-bounce">
              <FiCheckCircle className="text-3xl text-green-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">Booking Confirmed!</h3>
            <p className="text-sm text-slate-300 mb-4">
              Payment successful. Your wash is booked. Redirecting to your bookings page…
            </p>
            <button
              onClick={() => (window.location.href = "/bookings")}
              className="px-5 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-sm font-semibold"
            >
              Go to My Bookings
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
