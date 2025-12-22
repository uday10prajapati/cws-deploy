import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Link, useLocation } from "react-router-dom";
import { useRoleBasedRedirect } from "../utils/roleBasedRedirect";
import NotificationBell from "../components/NotificationBell";
import NavbarNew from "../components/NavbarNew";
import {
  FiBell,
  FiCalendar,
  FiMapPin,
  FiTrendingUp,
  FiCheckCircle,
  FiAlertCircle,
  FiDollarSign,
  FiLogOut,
  FiClipboard,
  FiUser,
  FiHome,
  FiTag,
  FiGift,
  FiCreditCard,
  FiTruck,
  FiAward,
  FiSettings,
  FiWind,
  FiPhone,
  FiMail,
  FiX,
  FiClock
} from "react-icons/fi";
import { FaCar, FaStar } from "react-icons/fa";

export default function CustomerDashboard() {
  const location = useLocation();
  const [user, setUser] = useState(null);

  /* 🔥 USE ROLE-BASED REDIRECT HOOK */
  useRoleBasedRedirect("customer");

  const [bookings, setBookings] = useState([]);
  const [currentPass, setCurrentPass] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [completedBookings, setCompletedBookings] = useState(0);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [loyaltyData, setLoyaltyData] = useState(null);
  const [washTracking, setWashTracking] = useState([]);
  const [monthlyWashes, setMonthlyWashes] = useState(0);
  const [nonWashDays, setNonWashDays] = useState(0);
  const [customerCars, setCustomerCars] = useState([]);
  const [customerAddress, setCustomerAddress] = useState("");
  const [carPasses, setCarPasses] = useState({});
  
  // Rating modal state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) return;

      try {
        const res = await fetch(
          `http://localhost:5000/pass/current/${auth.user.id}`
        );
        const result = await res.json();

        if (result.success && result.data) {
          setCurrentPass(result.data);
          console.log("✅ Active pass loaded:", result.data);
        } else {
          console.log("ℹ️ No active pass found");
          setCurrentPass(null);
        }
      } catch (err) {
        console.error("❌ Error fetching pass:", err);
        setCurrentPass(null);
      }
    };

    load();
  }, []);

  /* LOAD LOGGED-IN CUSTOMER + BOOKINGS + WALLET */
  useEffect(() => {
    const load = async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        if (!auth?.user) return;

        setUser(auth.user);

        // Fetch customer profile for address
        const { data: profile } = await supabase
          .from("profiles")
          .select("address")
          .eq("id", auth.user.id)
          .single();

        if (profile) {
          setCustomerAddress(profile.address || "");
        }

        // Fetch bookings from backend API instead of direct Supabase query to avoid RLS issues
        try {
          const response = await fetch(
            `http://localhost:5000/bookings/customer/${auth.user.id}`
          );
          const result = await response.json();
          
          if (result.success) {
            setBookings(result.bookings || []);

            // Calculate completed bookings
            const completed = (result.bookings || []).filter((b) => b.status === "Completed").length;
            setCompletedBookings(completed);

            // Fetch loyalty data from customer_loyalty_points table
            await fetchLoyaltyData(auth.user.id);

            // Fetch wash tracking data from car_wash_tracking table
            await fetchWashTrackingData(auth.user.id);

            // Fetch customer cars
            await fetchCustomerCars(auth.user.id);
          } else {
            console.error("❌ Error fetching bookings:", result.error);
            setBookings([]);
          }
        } catch (err) {
          console.error("❌ Error fetching bookings from backend:", err);
          setBookings([]);
        }

        // Fetch wallet balance and total spent from transactions
        await fetchWalletBalance(auth.user.id);
      } catch (err) {
        console.error("❌ Error loading customer data:", err);
        setBookings([]);
      }
    };

    load();
  }, []);

  // Fetch wallet balance from transactions
  const fetchWalletBalance = async (customerId) => {
    try {
      // Get the session token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `http://localhost:5000/transactions/customer/${customerId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          }
        }
      );
      
      if (!response.ok) {
        console.error("❌ API Error:", response.status, response.statusText);
        setWalletBalance(0);
        setTotalSpent(0);
        return;
      }
      
      const result = await response.json();

      if (result.success && result.transactions) {
        // Calculate wallet balance (credit transactions only - pending & success)
        const balance = result.transactions
          .filter(
            (tx) =>
              tx.direction === "credit" &&
              (tx.status === "success" || tx.status === "pending")
          )
          .reduce((sum, tx) => sum + (tx.amount || 0), 0);

        // Calculate total spent (all successful debit/payment transactions)
        const spent = result.transactions
          .filter(
            (tx) =>
              tx.status === "success" &&
              (tx.direction === "debit" || 
               tx.payment_method === "card" || 
               tx.type === "booking_payment" ||
               tx.type === "payment" ||
               tx.type === "pass_purchase")
          )
          .reduce((sum, tx) => sum + (parseFloat(tx.total_amount) || parseFloat(tx.amount) || 0), 0);

        setWalletBalance(balance);
        setTotalSpent(spent);
        console.log("✅ Wallet balance fetched:", { balance, spent, allTransactions: result.transactions });
      } else {
        console.warn("⚠️ No transactions found");
        setWalletBalance(0);
        setTotalSpent(0);
      }
    } catch (err) {
      console.warn("⚠️ Could not fetch wallet balance:", err);
      setWalletBalance(0);
      setTotalSpent(0);
    }
  };

  // Fetch wash tracking data from car_wash_tracking table
  const fetchWashTrackingData = async (customerId) => {
    try {
      // Fetch all customer cars via backend API
      const carResponse = await fetch(
        `http://localhost:5000/cars/${customerId}`
      );
      const carResult = await carResponse.json();

      if (!carResult.success || !carResult.data) {
        console.warn("⚠️ Could not fetch customer cars");
        return;
      }

      const cars = carResult.data;

      if (!cars || cars.length === 0) {
        console.log("ℹ️ No cars found for customer");
        setMonthlyWashes(0);
        setNonWashDays(0);
        return;
      }

      // Get all car numbers
      const carNumbers = cars.map(c => c.number_plate);

      // Fetch wash tracking records for this month
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      const monthStart = new Date(currentYear, now.getMonth(), 1);
      const monthStartStr = monthStart.toISOString().split('T')[0];

      const { data: washRecords, error: washError } = await supabase
        .from("car_wash_tracking")
        .select("*")
        .in("car_number", carNumbers)
        .gte("wash_date", monthStartStr)
        .eq("status", "washed");

      if (washError) {
        console.warn("⚠️ Could not fetch wash tracking:", washError);
        return;
      }

      setWashTracking(washRecords || []);

      // Calculate monthly washes
      const totalWashes = washRecords?.length || 0;
      setMonthlyWashes(totalWashes);

      // Calculate non-wash days
      const washDates = new Set();
      if (washRecords) {
        washRecords.forEach(record => {
          const date = new Date(record.wash_date);
          washDates.add(date.getDate());
        });
      }

      // Count days from 1st to today without a wash
      const today = now.getDate();
      let nonWashCount = 0;
      for (let i = 1; i <= today; i++) {
        if (!washDates.has(i)) {
          nonWashCount++;
        }
      }

      setNonWashDays(nonWashCount);
      console.log("✅ Wash tracking loaded:", { totalWashes, nonWashCount });
    } catch (err) {
      console.warn("⚠️ Error fetching wash tracking:", err);
      setMonthlyWashes(0);
      setNonWashDays(0);
    }
  };

  // Fetch customer cars
  const fetchCustomerCars = async (customerId) => {
    try {
      const response = await fetch(`http://localhost:5000/cars/${customerId}`);
      const result = await response.json();

      if (result.success && result.data) {
        setCustomerCars(result.data);
        
        // Fetch passes for each car individually from monthly_pass table
        const passes = {};
        for (const car of result.data) {
          try {
            const { data: passData, error } = await supabase
              .from('monthly_pass')
              .select('*')
              .eq('car_id', car.id)
              .eq('active', true)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();
            
            if (passData) {
              passes[car.id] = passData;
              console.log(`✅ Active pass found for car ${car.id}:`, passData);
            } else {
              passes[car.id] = null;
              console.log(`ℹ️ No active pass for car ${car.id}`);
            }
          } catch (err) {
            console.log(`ℹ️ No active pass for car ${car.id}`);
            passes[car.id] = null;
          }
        }
        
        setCarPasses(passes);
        console.log("✅ Customer cars loaded:", result.data);
      } else {
        console.log("ℹ️ No cars found");
        setCustomerCars([]);
      }
    } catch (err) {
      console.warn("⚠️ Error fetching customer cars:", err);
      setCustomerCars([]);
    }
  };

  // Fetch loyalty data from customer_loyalty_points table
  const fetchLoyaltyData = async (customerId) => {
    try {
      // First try to fetch from customer_loyalty_points table
      const { data: loyaltyRecord, error: loyaltyError } = await supabase
        .from("customer_loyalty_points")
        .select("total_points, cars_washed, last_wash_date")
        .eq("customer_id", customerId)
        .single();

      if (loyaltyError && loyaltyError.code !== 'PGRST116') {
        // PGRST116 = no rows returned
        console.warn("⚠️ Could not fetch loyalty points from table:", loyaltyError);
        setLoyaltyPoints(0);
        setLoyaltyData(null);
        return;
      }

      if (loyaltyRecord) {
        // Use total_points from the table
        setLoyaltyPoints(loyaltyRecord.total_points || 0);
        setLoyaltyData({
          total_points: loyaltyRecord.total_points || 0,
          cars_washed: loyaltyRecord.cars_washed || 0,
          last_wash_date: loyaltyRecord.last_wash_date
        });
        console.log("✅ Loyalty points fetched from table:", loyaltyRecord);
      } else {
        // No loyalty record found, try API as fallback
        console.log("ℹ️ No loyalty record in table, trying API fallback");
        try {
          const res = await fetch(
            `http://localhost:5000/customer-loyalty/loyalty/${customerId}`
          );
          const result = await res.json();

          if (result.success && result.loyalty) {
            setLoyaltyData(result.loyalty);
            setLoyaltyPoints(result.loyalty.total_points || 0);
            console.log("✅ Loyalty data fetched from API:", result.loyalty);
          } else {
            setLoyaltyPoints(0);
            setLoyaltyData(null);
          }
        } catch (apiErr) {
          console.warn("⚠️ Could not fetch loyalty data from API:", apiErr);
          setLoyaltyPoints(0);
          setLoyaltyData(null);
        }
      }
    } catch (err) {
      console.warn("⚠️ Error in fetchLoyaltyData:", err);
      setLoyaltyPoints(0);
      setLoyaltyData(null);
    }
  };

  // Refresh active pass (call this after purchasing a pass)
  const refreshActivePass = async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return;

    try {
      const res = await fetch(
        `http://localhost:5000/pass/current/${auth.user.id}`
      );
      const result = await res.json();

      if (result.success && result.data) {
        setCurrentPass(result.data);
        console.log("✅ Pass refreshed:", result.data);
      } else {
        setCurrentPass(null);
      }
    } catch (err) {
      console.error("❌ Error refreshing pass:", err);
    }
  };

  // Submit rating to backend
  const submitRating = async () => {
    if (!selectedBooking || rating === 0) {
      alert("Please select a rating");
      return;
    }

    setSubmittingRating(true);
    try {
      const ratingData = {
        booking_id: selectedBooking.id,
        customer_id: user.id,
        rating: rating,
        comment: ratingComment,
        car_name: selectedBooking.car_name,
        service_date: selectedBooking.date,
      };

      const response = await fetch(
        "http://localhost:5000/bookings/add-rating",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(ratingData),
        }
      );

      const result = await response.json();

      if (result.success) {
        alert("✅ Rating submitted successfully!");
        
        // Update booking status to include rating
        const updatedBookings = bookings.map((b) =>
          b.id === selectedBooking.id ? { ...b, has_rated: true } : b
        );
        setBookings(updatedBookings);

        // Close modal and reset
        setShowRatingModal(false);
        setSelectedBooking(null);
        setRating(0);
        setRatingComment("");
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (err) {
      console.error("❌ Rating submission error:", err);
      alert(`Error submitting rating: ${err.message}`);
    } finally {
      setSubmittingRating(false);
    }
  };

  // Open rating modal for completed booking
  const openRatingModal = (booking) => {
    if (booking.status === "Completed" && !booking.has_rated) {
      setSelectedBooking(booking);
      setRating(0);
      setRatingComment("");
      setShowRatingModal(true);
    }
  };

  // Calculate car wash frequency for current month
  const getCurrentMonthWashes = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return bookings.filter((b) => {
      const bookingDate = new Date(b.booking_date);
      return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear && b.status === "Completed";
    }).length;
  };

  // Calculate car wash-free days in current month (days without completed bookings)
  const getCurrentMonthNonWashDays = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Get the last day of current month
    const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Get all days with completed bookings in this month
    const washDays = new Set();
    bookings.forEach((b) => {
      if (b.status === "Completed") {
        const bookingDate = new Date(b.booking_date);
        if (bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear) {
          washDays.add(bookingDate.getDate());
        }
      }
    });
    
    // Calculate non-wash days (today onwards)
    const todayDate = now.getDate();
    let nonWashDays = 0;
    for (let i = 1; i <= todayDate; i++) {
      if (!washDays.has(i)) {
        nonWashDays++;
      }
    }
    
    return nonWashDays;
  };

  // Use state values from fetchWashTrackingData instead of calculating from bookings
  const stats = [
    {
      title: "Month Washes",
      value: monthlyWashes,
      icon: <FiWind />,
      change: `${monthlyWashes} times washed this month`,
    },
    {
      title: "Non-Wash Days",
      value: nonWashDays,
      icon: <FiCalendar />,
      change: `${nonWashDays} days not washed`,
    },
    {
      title: "Total Spent",
      value: `₹${totalSpent.toLocaleString("en-IN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })}`,
      icon: <FiDollarSign />,
      change: `${completedBookings} bookings completed`,
    },
    {
      title: "Loyalty Points",
      value: loyaltyPoints,
      icon: <FiTrendingUp />,
      change: `${loyaltyPoints} points earned from washes`,
    },
  ];

  // Active bookings (bookings with status not Completed)
  const activeBookings = bookings.filter((b) => b.status !== "Completed");

  // Offers/Promotions mock data
  const offers = [
    {
      id: 1,
      title: "30% Off Premium Wash",
      code: "PREMIUM30",
      discount: "30%",
      icon: "🎯",
    },
    {
      id: 2,
      title: "Free Interior Clean",
      code: "INTERIOR",
      discount: "Free",
      icon: "✨",
    },
    {
      id: 3,
      title: "Loyalty Bonus",
      code: "LOYAL100",
      discount: "+100 pts",
      icon: "⭐",
    },
  ];

  // Notifications mock data
  const notifications = [
    {
      id: 1,
      message: "Your booking is confirmed for today at 2:00 PM",
      type: "success",
    },
    { id: 2, message: "New offer: 50% off on monthly pass", type: "offer" },
    { id: 3, message: "Your vehicle is ready for pickup", type: "info" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* NAVBAR */}
      <NavbarNew />

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-10">
          {/* Welcome Section */}
          <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-2 leading-tight">
                Welcome back 👋
              </h1>
              <p className="text-slate-600 text-base">
                Track your bookings, manage your pass & earn loyalty points
              </p>
            </div>
            {/* <div className="mt-6 md:mt-0 flex gap-3">
              <Link
                to="/bookings"
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center gap-2"
              >
                <FiTruck size={20} /> Book a Wash
              </Link>
            </div> */}
          </div>

          {/* 🎯 QUICK ACTIONS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
            {[
              { to: "/wash-history", icon: FiClock, label: "Wash History", colors: "from-blue-600 to-cyan-600", bg: "from-blue-50 to-cyan-50", border: "border-blue-200" },
              { to: "/monthly-pass", icon: FiAward, label: "My Pass", colors: "from-amber-600 to-orange-600", bg: "from-amber-50 to-orange-50", border: "border-amber-200" },
              { to: "/my-cars", icon: FaCar, label: "My Cars", colors: "from-green-600 to-emerald-600", bg: "from-green-50 to-emerald-50", border: "border-green-200" },
              { to: "/transactions", icon: FiCreditCard, label: "Transactions", colors: "from-pink-600 to-rose-600", bg: "from-pink-50 to-rose-50", border: "border-pink-200" },
              { to: "/location", icon: FiMapPin, label: "Location", colors: "from-indigo-600 to-purple-600", bg: "from-indigo-50 to-purple-50", border: "border-indigo-200" },
              { to: "/emergency-wash", icon: FiAlertCircle, label: "Quick Wash", colors: "from-red-600 to-pink-600", bg: "from-red-50 to-pink-50", border: "border-red-200" },
            ].map(({ to, icon: Icon, label, colors, bg, border }) => (
              <Link
                key={label}
                to={to}
                className={`group rounded-xl p-5 border ${border} bg-gradient-to-br ${bg} shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 text-center cursor-pointer`}
              >
                <div className={`text-3xl mb-3 mx-auto w-12 h-12 flex items-center justify-center rounded-lg bg-gradient-to-r ${colors} text-white group-hover:scale-110 transition-transform`}>
                  <Icon />
                </div>
                <p className="text-sm font-bold text-slate-900">{label}</p>
              </Link>
            ))}
          </div>

          {/* 📊 STAT CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
            {stats.map((item, index) => {
              const colors = [
                { icon: "text-blue-600", bg: "from-blue-600 to-cyan-600", bgGradient: "from-blue-50 to-cyan-50" },
                { icon: "text-amber-600", bg: "from-amber-600 to-orange-600", bgGradient: "from-amber-50 to-orange-50" },
                { icon: "text-emerald-600", bg: "from-emerald-600 to-green-600", bgGradient: "from-emerald-50 to-green-50" },
                { icon: "text-purple-600", bg: "from-purple-600 to-pink-600", bgGradient: "from-purple-50 to-pink-50" },
              ][index % 4];
              
              return (
                <div
                  key={item.title}
                  className={`bg-gradient-to-br ${colors.bgGradient} rounded-2xl p-6 shadow-lg border border-opacity-30 hover:shadow-xl hover:scale-105 transition-all duration-300`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-slate-700 text-sm font-semibold tracking-wide">
                      {item.title}
                    </p>
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${colors.bg} text-white flex items-center justify-center text-xl opacity-90`}>
                      {item.icon}
                    </div>
                  </div>
                  <p className={`text-4xl font-black bg-gradient-to-r ${colors.bg} bg-clip-text text-transparent`}>
                    {item.value}
                  </p>
                  <p className="text-slate-600 text-xs font-medium mt-3 leading-relaxed">
                    {item.change}
                  </p>
                </div>
              );
            })}
          </div>

          {/* 💳 WALLET & MONTHLY PASS STATUS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            {/* Promotional Carousel */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all overflow-hidden relative">
              <style>{`
                @keyframes scroll-right-to-left {
                  0% {
                    transform: translateX(100%);
                  }
                  100% {
                    transform: translateX(-100%);
                  }
                }
                .carousel-item {
                  animation: scroll-right-to-left 12s linear infinite;
                }
                .carousel-item:nth-child(1) { animation-delay: 0s; }
                .carousel-item:nth-child(2) { animation-delay: 2.4s; }
                .carousel-item:nth-child(3) { animation-delay: 4.8s; }
                .carousel-item:nth-child(4) { animation-delay: 7.2s; }
                .carousel-item:nth-child(5) { animation-delay: 9.6s; }
              `}</style>
              
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white flex items-center justify-center text-2xl">
                    <FiTrendingUp />
                  </div>
                  Special Offers
                </h3>
              </div>

              {/* Carousel Container */}
              <div className="relative w-full h-48 overflow-hidden rounded-xl bg-gradient-to-r from-slate-800 to-slate-700">
                <div className="absolute inset-0 flex">
                  {[
                    { title: "50% Off Premium Wash", color: "from-blue-500 to-cyan-500", icon: "🚗" },
                    { title: "Free Interior Clean", color: "from-purple-500 to-pink-500", icon: "✨" },
                    { title: "Loyalty Bonus +100 pts", color: "from-green-500 to-emerald-500", icon: "⭐" },
                    { title: "Monthly Pass Discount", color: "from-orange-500 to-red-500", icon: "🎯" },
                    { title: "Express Wash Service", color: "from-indigo-500 to-blue-500", icon: "⚡" },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="carousel-item flex-shrink-0 w-full h-48 bg-gradient-to-br px-8 py-6 flex flex-col items-center justify-center text-center"
                      style={{
                        backgroundImage: `linear-gradient(135deg, var(--color-1), var(--color-2))`,
                        "--color-1": index === 0 ? "#0369a1" : index === 1 ? "#7c3aed" : index === 2 ? "#059669" : index === 3 ? "#ea580c" : "#4f46e5",
                        "--color-2": index === 0 ? "#06b6d4" : index === 1 ? "#ec4899" : index === 2 ? "#10b981" : index === 3 ? "#dc2626" : "#3b82f6",
                      }}
                    >
                      <div className="text-5xl mb-3">{item.icon}</div>
                      <h4 className="text-white font-bold text-lg">{item.title}</h4>
                      <p className="text-white/80 text-sm mt-2">Limited Time Offer</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Info Section */}
              {/* <div className="mt-6 pt-6 border-t border-slate-700 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-300">Current Balance:</span>
                  <span className="font-bold text-emerald-300">
                    ₹{walletBalance.toLocaleString("en-IN", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-300">Total Spent:</span>
                  <span className="font-bold text-blue-300">
                    ₹{totalSpent.toLocaleString("en-IN", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div> */}

              {/* <Link
                to="/transactions"
                className="inline-block mt-6 px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-lg font-bold text-sm transition-all hover:shadow-lg hover:scale-105 w-full text-center"
              >
                + Add Money
              </Link> */}
            </div>

            {/* Monthly Pass Status */}
            <div
              className="bg-gradient-to-br from-slate-900 to-slate-800 border border-amber-500/40 rounded-xl p-5 shadow-xl hover:shadow-2xl transition-all relative overflow-hidden"
              style={{
                boxShadow: "0 0 20px rgba(255,193,7,0.15)",
              }}
            >
              {/* Decorative element */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full blur-3xl"></div>
              
              <div className="relative z-10 flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 text-white flex items-center justify-center text-xl">
                    <FiAward />
                  </div>
                  Monthly Pass
                </h3>

                {currentPass ? (
                  <span className="text-xs bg-amber-600/40 text-amber-200 px-3 py-1 rounded-full font-bold border border-amber-500/50">
                    ACTIVE
                  </span>
                ) : (
                  <span className="text-xs bg-red-600/40 text-red-200 px-3 py-1 rounded-full font-bold border border-red-500/50">
                    INACTIVE
                  </span>
                )}
              </div>

              {!currentPass ? (
                <>
                  <p className="text-slate-300 text-xs mb-4 leading-relaxed">
                    Unlock unlimited car washes with a monthly pass and save big! 🎉
                  </p>
                  <Link
                    to="/monthly-pass"
                    className="inline-block px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white rounded-lg font-bold text-xs transition-all hover:shadow-lg"
                  >
                    Get Pass Now
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-lg font-black text-amber-300 mb-1">
                    {currentPass.total_washes === 4
                      ? "Basic Plan"
                      : currentPass.total_washes === 8
                      ? "Standard Plan"
                      : currentPass.total_washes === 16
                      ? "Premium Plan"
                      : "Monthly Plan"}
                  </p>

                  <p className="text-slate-300 text-sm mb-4 font-semibold">
                    {currentPass.total_washes - currentPass.remaining_washes}/{currentPass.total_washes} washes used
                  </p>

                  {/* PROGRESS BAR */}
                  <div className="w-full bg-slate-700 rounded-full h-3 mb-4 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-400 to-amber-500 h-3 rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          ((currentPass.total_washes -
                            currentPass.remaining_washes) /
                            currentPass.total_washes) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>

                  <div className="space-y-3 mt-6 pt-6 border-t border-slate-700">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">Expires:</span>
                      <span className="font-bold text-amber-300">
                        {new Date(currentPass.valid_till).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">Remaining:</span>
                      <span className="font-bold text-emerald-300">{currentPass.remaining_washes} washes</span>
                    </div>
                  </div>

                  <Link
                    to="/monthly-pass"
                    className="inline-block mt-6 px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white rounded-lg font-bold text-sm transition-all hover:shadow-lg hover:scale-105"
                  >
                    Renew Pass
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* 🔔 NOTIFICATIONS */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-lg mb-8">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white flex items-center justify-center text-sm">
                <FiBell />
              </div>
              Recent Notifications
            </h2>
            {notifications.length === 0 ? (
              <p className="text-slate-500 text-center py-4">No notifications yet</p>
            ) : (
              <div className="space-y-2">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3 rounded-lg border-l-4 font-medium text-xs transition-all ${
                      notif.type === "success"
                        ? "bg-green-50 border-green-500 text-green-700"
                        : notif.type === "offer"
                        ? "bg-purple-50 border-purple-500 text-purple-700"
                        : "bg-blue-50 border-blue-500 text-blue-700"
                    }`}
                  >
                    {notif.message}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 🎁 OFFERS & PROMOTIONS */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-5 shadow-xl mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-pink-500/10 to-transparent rounded-full blur-3xl"></div>
            
            <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2 relative z-10">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-pink-600 to-rose-600 text-white flex items-center justify-center text-sm">
                <FiGift />
              </div>
              Active Offers & Promotions
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
              {offers.map((offer) => (
                <div
                  key={offer.id}
                  className="bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-300 rounded-lg p-4 hover:shadow-lg hover:scale-105 transition-all duration-300 group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-3xl">{offer.icon}</span>
                    <span className="text-xs bg-gradient-to-r from-pink-600 to-rose-600 text-white px-2 py-0.5 rounded-full font-bold">
                      {offer.discount}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 mb-1">
                    {offer.title}
                  </p>
                  <p className="text-xs text-slate-600 mb-3">
                    Code:{" "}
                    <span className="inline-block bg-white px-2 py-0.5 rounded text-pink-600 font-bold font-mono group-hover:bg-pink-100 transition">
                      {offer.code}
                    </span>
                  </p>
                  <button className="w-full px-3 py-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white rounded-lg font-bold text-xs transition-all hover:shadow-lg">
                    Claim Now
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 🚗 MY CARS */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white flex items-center justify-center text-sm">
                <FaCar />
              </div>
              My Cars
            </h2>

            {customerCars.length === 0 ? (
              <div className="bg-white border-2 border-slate-200 rounded-2xl p-12 text-center shadow-lg">
                <FaCar size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-600 text-lg font-semibold mb-4">No cars added yet</p>
                <Link
                  to="/my-cars"
                  className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-lg font-bold transition-all hover:shadow-lg"
                >
                  Add Your First Car
                </Link>
              </div>
            ) : (
              <div className="bg-white border-2 border-slate-200 rounded-2xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
                        <th className="px-6 py-4 text-left text-sm font-bold">Car Name</th>
                        <th className="px-6 py-4 text-left text-sm font-bold">License Plate</th>
                        <th className="px-6 py-4 text-left text-sm font-bold">Location</th>
                        <th className="px-6 py-4 text-left text-sm font-bold">Pass Status</th>
                        <th className="px-6 py-4 text-center text-sm font-bold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerCars.map((car, index) => {
                        // Use individual car pass from carPasses object
                        const carPass = carPasses[car.id];
                        const passStatus = carPass
                          ? {
                              status: "ACTIVE",
                              dueDate: new Date(carPass.valid_till).toLocaleDateString("en-IN"),
                              color: "green",
                              icon: "✓",
                            }
                          : {
                              status: "NO PASS",
                              dueDate: null,
                              color: "red",
                              icon: "✕",
                            };

                        return (
                          <tr
                            key={car.id}
                            className={`border-b border-slate-200 hover:bg-blue-50 transition-colors ${
                              index % 2 === 0 ? "bg-white" : "bg-slate-50"
                            }`}
                          >
                            {/* Car Name */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white flex items-center justify-center">
                                  <FaCar size={18} />
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900">{car.model || "Unknown"}</p>
                                  <p className="text-xs text-slate-600">{car.brand || ""}</p>
                                </div>
                              </div>
                            </td>

                            {/* License Plate */}
                            <td className="px-6 py-4">
                              <div className="bg-yellow-100 border border-yellow-300 rounded px-3 py-2 text-center">
                                <p className="font-mono font-bold text-slate-900">{car.number_plate}</p>
                              </div>
                            </td>

                            {/* Location */}
                            <td className="px-6 py-4">
                              <div className="flex items-start gap-2">
                                <FiMapPin size={16} className="text-blue-600 mt-1 flex-shrink-0" />
                                <div>
                                  <p className="font-semibold text-slate-900">{customerAddress || "Not Specified"}</p>
                                  <p className="text-xs text-slate-600">{car.location || "N/A"}</p>
                                </div>
                              </div>
                            </td>

                            {/* Pass Status */}
                            <td className="px-6 py-4">
                              <div
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm ${
                                  passStatus.color === "green"
                                    ? "bg-green-100 text-green-800 border border-green-300"
                                    : "bg-red-100 text-red-800 border border-red-300"
                                }`}
                              >
                                <span className="text-lg">{passStatus.icon}</span>
                                {passStatus.status}
                              </div>
                              {passStatus.dueDate && (
                                <p className="text-xs text-slate-600 mt-2">Expires: {passStatus.dueDate}</p>
                              )}
                            </td>

                            {/* Action */}
                            <td className="px-6 py-4 text-center">
                              <Link
                                to="/my-cars"
                                className="inline-block px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg font-semibold text-xs transition-all hover:shadow-lg"
                              >
                                Manage
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* ⭐ RATING MODAL */}
        {showRatingModal && selectedBooking && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl border border-slate-200 relative">
              {/* Close Button */}
              <button
                onClick={() => setShowRatingModal(false)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold transition-all hover:scale-110"
              >
                <FiX size={24} />
              </button>

              {/* Header */}
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-slate-900">Rate Your Service</h2>
                <p className="text-slate-600 text-sm mt-2">Help us improve by sharing your experience</p>
              </div>

              {/* Service Details */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-5 mb-6 border border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white flex items-center justify-center">
                    <FaCar />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{selectedBooking.car_name}</p>
                    <p className="text-xs text-slate-600">Completed: {selectedBooking.date}</p>
                  </div>
                </div>
              </div>

              {/* Rating Stars */}
              <div className="mb-8">
                <p className="text-sm font-bold text-slate-700 mb-5">How was your experience?</p>
                <div className="flex justify-center gap-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="transition transform hover:scale-125 focus:outline-none"
                    >
                      <FaStar
                        size={48}
                        className={`${
                          star <= (hoverRating || rating)
                            ? "text-yellow-400 fill-yellow-400 drop-shadow-lg"
                            : "text-slate-300"
                        } transition-all duration-200`}
                      />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-center mt-5 text-lg font-bold">
                    <span className="bg-gradient-to-r from-yellow-500 to-amber-500 bg-clip-text text-transparent">
                      {rating} out of 5 stars
                    </span>
                  </p>
                )}
              </div>

              {/* Comment (Optional) */}
              <div className="mb-6">
                <label className="text-sm font-bold text-slate-700 block mb-3">
                  Comments (Optional)
                </label>
                <textarea
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder="Share your feedback about the service..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-medium"
                  rows="3"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRatingModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg font-bold transition-all hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  onClick={submitRating}
                  disabled={rating === 0 || submittingRating}
                  className="flex-1 py-3 bg-linear-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-bold transition-all hover:scale-105 flex items-center justify-center gap-2 disabled:hover:scale-100"
                >
                  {submittingRating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <span className="text-lg">⭐</span> Submit Rating
                    </>
                  )}
                </button>
              </div>

              {/* Rating Info */}
              <p className="text-center text-xs text-slate-500 mt-5 font-medium">
                Your honest feedback helps us provide better service
              </p>
            </div>
          </div>
        )}
      </div>
);
}
