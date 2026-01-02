import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Link, useLocation } from "react-router-dom";
import { useRoleBasedRedirect } from "../utils/roleBasedRedirect";
import NavbarNew from "../components/NavbarNew";
import { FiBell, FiCalendar, FiGift, FiMapPin, FiTrendingUp,  FiDollarSign, FiLogOut, FiUser, FiHome, FiClock, FiCheckCircle, FiAlertCircle, FiClipboard, FiAward, FiCreditCard, FiTruck, FiWind, FiPhone, FiX } from "react-icons/fi";
import { FaCar, FaStar } from "react-icons/fa";


export default function EmployeeDashboard() {
  const location = useLocation();
  const [user, setUser] = useState(null);

  /* 🔥 USE ROLE-BASED REDIRECT HOOK */
  useRoleBasedRedirect("employee");

  const [assignments, setAssignments] = useState([]);
  const [earnings, setEarnings] = useState({ thisMonthEarnings: 0, totalEarnings: 0 });
  const [averageRating, setAverageRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [assignedTaluka, setAssignedTaluka] = useState(null);
  const [assignedCity, setAssignedCity] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [newCustomersToday, setNewCustomersToday] = useState(0);
  const [completedThisWeek, setCompletedThisWeek] = useState(0);

  /* LOAD LOGGED-IN EMPLOYEE + ASSIGNMENTS */
  useEffect(() => {
    const load = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) return;

      setUser(auth.user);

      try {
        // Fetch employee's assigned taluka and city
        const empResponse = await fetch(`http://localhost:5000/employee/profile/${auth.user.id}`);
        if (empResponse.ok) {
          const empData = await empResponse.json();
          setAssignedTaluka(empData.taluka || null);
          setAssignedCity(empData.city || null);
        }

        // Fetch bookings from backend API
        const response = await fetch(`http://localhost:5000/employee/bookings/${auth.user.id}`);
        if (response.ok) {
          const result = await response.json();
          console.log("Bookings fetched successfully:", result.bookings?.length || 0);
          setAssignments(result.bookings || []);
        } else {
          console.error("Backend error fetching bookings");
          setAssignments([]);
        }

        // Fetch new customers added today from sales_cars table
        // Get today's date in ISO format (YYYY-MM-DD)
        const todayISO = new Date().toISOString().split('T')[0]; // e.g., "2026-01-01"
        const tomorrowDate = new Date();
        tomorrowDate.setDate(tomorrowDate.getDate() + 1);
        const tomorrowISO = tomorrowDate.toISOString().split('T')[0]; // e.g., "2026-01-02"

        const todayStart = `${todayISO}T00:00:00Z`;
        const todayEnd = `${tomorrowISO}T00:00:00Z`;

        console.log("Fetching sales_cars between:", todayStart, "and", todayEnd);
        console.log("Today's date:", todayISO);

        // First, try to fetch ALL sales_cars to see if RLS is blocking
        const { data: allCars, error: allCarsError } = await supabase
          .from("sales_cars")
          .select("customer_name, created_at");

        if (allCarsError) {
          console.error("Error fetching all sales_cars:", allCarsError);
        } else {
          console.log("All sales_cars data:", allCars);
        }

        // Now filter by date on the client side
        const newCarsToday = allCars?.filter(car => {
          const carDate = new Date(car.created_at).toISOString().split('T')[0];
          return carDate === todayISO;
        }) || [];

        console.log("Filtered sales_cars for today:", newCarsToday);
        const uniqueCustomers = new Set(newCarsToday.map(car => car.customer_name).filter(Boolean));
        console.log("New customers today from sales_cars:", uniqueCustomers.size, Array.from(uniqueCustomers));
        setNewCustomersToday(uniqueCustomers.size);

        // Fetch completed bookings this week
        const weekAgoDate = new Date();
        weekAgoDate.setDate(weekAgoDate.getDate() - 7);
        const weekAgoISO = weekAgoDate.toISOString().split('T')[0];
        const weekAgoStart = `${weekAgoISO}T00:00:00Z`;

        console.log("Fetching bookings between:", weekAgoStart, "and", todayEnd);
        console.log("Week ago date:", weekAgoISO);

        // First, try to fetch ALL completed bookings
        const { data: allCompleted, error: allCompletedError } = await supabase
          .from("bookings")
          .select("id, status, created_at")
          .eq("status", "Completed");

        if (allCompletedError) {
          console.error("Error fetching all completed bookings:", allCompletedError);
        } else {
          console.log("All completed bookings data:", allCompleted);
        }

        // Filter by date range on the client side
        const completedThisWeekData = allCompleted?.filter(booking => {
          const bookingDate = new Date(booking.created_at).toISOString().split('T')[0];
          return bookingDate >= weekAgoISO && bookingDate <= todayISO;
        }) || [];

        console.log("Filtered completed bookings for this week:", completedThisWeekData);
        console.log("Completed bookings this week:", completedThisWeekData.length);
        setCompletedThisWeek(completedThisWeekData.length);

      } catch (err) {
        console.error("Error fetching data:", err);
        setAssignments([]);
      }

      // Calculate average rating from completed bookings (will update after assignments are set)
    };

    load();
  }, []);

  /* CALCULATE RATINGS AND LOAD NOTIFICATIONS */
  useEffect(() => {
    if (assignments.length > 0 && user?.id) {
      // Calculate average rating from completed bookings
      const completedJobs = assignments.filter(b => b.status === "Completed" && b.rating);
      if (completedJobs.length > 0) {
        const avgRating = (completedJobs.reduce((sum, b) => sum + (b.rating || 0), 0) / completedJobs.length).toFixed(1);
        setAverageRating(parseFloat(avgRating));
        setRatingCount(completedJobs.length);
      }

      // Fetch earnings from transactions
      fetchEarnings(user.id);

      // Load notifications
      loadNotifications(user.id);
    }
  }, [assignments, user]);

  /* CALCULATE WEEKLY RATINGS DATA */
  const getWeeklyRatingsData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeklyRatings = Array(7).fill(0);
    const ratingCounts = Array(7).fill(0);

    const now = new Date();
    const currentDay = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - (currentDay === 0 ? 6 : currentDay - 1));

    assignments.forEach(job => {
      if (job.status === "Completed" && job.rating && job.date) {
        const jobDate = new Date(job.date);
        const dayOfWeek = jobDate.getDay();
        const index = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

        if (jobDate >= startOfWeek && jobDate <= now) {
          weeklyRatings[index] += job.rating;
          ratingCounts[index]++;
        }
      }
    });

    return days.map((day, idx) => ({
      day,
      rating: ratingCounts[idx] > 0 ? (weeklyRatings[idx] / ratingCounts[idx]).toFixed(1) : 0,
      count: ratingCounts[idx]
    }));
  };

  /* LOAD NOTIFICATIONS FOR EMPLOYEE */
  const loadNotifications = async (userId) => {
    try {
      const url = new URL(`http://localhost:5000/notifications/user/${userId}`);
      url.searchParams.append('user_id', userId);
      
      const response = await fetch(url.toString(), {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      const data = await response.json();
      
      if (data.success && data.notifications) {
        // Map notifications to include display format
        const formattedNotifications = data.notifications.map((notif) => ({
          ...notif,
          icon: getNotificationIcon(notif.type),
          time: getTimeAgo(notif.created_at || new Date()),
        }));
        setNotifications(formattedNotifications);
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
  };

  /* FETCH EARNINGS FROM TRANSACTIONS */
  const fetchEarnings = async (userId) => {
    try {
      const url = new URL(`http://localhost:5000/earnings/dashboard-summary/${userId}`);
      url.searchParams.append('user_id', userId);
      
      const response = await fetch(url.toString(), {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setEarnings({
          thisMonthEarnings: data.data.thisMonthEarnings || 0,
          totalEarnings: data.data.thisMonthEarnings || 0 // Using this month for display
        });
      }
    } catch (error) {
      console.error("Failed to load earnings:", error);
    }
  };

  /* GET NOTIFICATION ICON BASED ON TYPE */
  const getNotificationIcon = (type) => {
    const icons = {
      rating: "⭐",
      upcoming: "🚗",
      completed: "✅",
      payment: "💰",
      rating_needed: "⭐",
      new_job: "📋",
    };
    return icons[type] || "📢";
  };

  /* FORMAT TIME AGO */
  const getTimeAgo = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
    
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  // Filter pending and completed bookings
  const filterBookingsByLocation = (bookings) => {
    if (selectedFilter === "all") return bookings;
    if (selectedFilter === "taluka" && assignedTaluka) {
      return bookings.filter(b => b.taluka === assignedTaluka);
    }
    if (selectedFilter === "city" && assignedCity) {
      return bookings.filter(b => b.city === assignedCity);
    }
    return bookings;
  };

  const filteredAssignments = filterBookingsByLocation(assignments);
  const pendingBookings = filteredAssignments.filter(a => a.status !== "Completed");
  const completedBookings = filteredAssignments.filter(a => a.status === "Completed");

  const stats = [
    { title: "New Customers Today", value: newCustomersToday, icon: <FiUser />, change: "Added today", gradient: "from-blue-600 to-cyan-600" },
    { title: "Completed This Week", value: completedThisWeek, icon: <FiCheckCircle />, change: "Last 7 days", gradient: "from-purple-600 to-pink-600" },
    { title: "Customer Locations", value: new Set(assignments.map(a => a.city)).size, icon: <FiMapPin />, change: "Unique cities", gradient: "from-orange-600 to-red-600" },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* NAVBAR */}
      <NavbarNew />

      {/* MAIN CONTENT */}
      <main className="pt-20 px-4 md:px-6 py-10">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-2 leading-tight">
              Welcome back 👋
            </h1>
            <p className="text-slate-600 text-base">
              Track your jobs, manage your ratings & earn money
            </p>
          </div>
        </div>

        {/* 🎯 QUICK ACTIONS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
          {[
            { to: "/employee/cars", icon: FaCar, label: "Cars", colors: "from-purple-600 to-pink-600", bg: "from-purple-50 to-pink-50", border: "border-purple-200" },
            { to: "/employee/customers", icon: FiUser, label: "Customers", colors: "from-indigo-600 to-blue-600", bg: "from-indigo-50 to-blue-50", border: "border-indigo-200" },
            { to: "/employee/assign-areas", icon: FiMapPin, label: "Areas", colors: "from-rose-600 to-red-600", bg: "from-rose-50 to-red-50", border: "border-rose-200" },
            // { to: "/employee/allcars", icon: FiTruck, label: "All Cars", colors: "from-cyan-600 to-blue-600", bg: "from-cyan-50 to-blue-50", border: "border-cyan-200" },
            { to: "/employee/salespeople", icon: FiAward, label: "All Salesman", colors: "from-amber-600 to-orange-600", bg: "from-amber-50 to-orange-50", border: "border-amber-200" },
            { to: "/employee/documents", icon: FiCalendar, label: "All Documents", colors: "from-red-600 to-red-700", bg: "from-red-50 to-red-50", border: "border-red-200" },
          ].map(({ to, onClick, icon: Icon, label, colors, bg, border }) => (
            <Link
              key={label}
              to={to}
              onClick={onClick}
              className={`group rounded-xl p-5 border ${border} bg-linear-to-br ${bg} shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 text-center cursor-pointer`}
            >
              <div className={`text-3xl mb-3 mx-auto w-12 h-12 flex items-center justify-center rounded-lg bg-linear-to-r ${colors} text-white group-hover:scale-110 transition-transform`}>
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
              { icon: "text-emerald-600", bg: "from-emerald-600 to-green-600", bgGradient: "from-emerald-50 to-green-50" },
              { icon: "text-purple-600", bg: "from-purple-600 to-pink-600", bgGradient: "from-purple-50 to-pink-50" },
              { icon: "text-orange-600", bg: "from-orange-600 to-red-600", bgGradient: "from-orange-50 to-red-50" },
            ][index % 4];
            
            return (
              <div
                key={item.title}
                className={`bg-linear-to-br ${colors.bgGradient} rounded-2xl p-6 shadow-lg border border-opacity-30 hover:shadow-xl hover:scale-105 transition-all duration-300`}
              >
                <div className="flex items-center justify-between mb-4">
                  <p className="text-slate-700 text-sm font-semibold tracking-wide">
                    {item.title}
                  </p>
                  <div className={`w-12 h-12 rounded-lg bg-linear-to-r ${colors.bg} text-white flex items-center justify-center text-xl opacity-90`}>
                    {item.icon}
                  </div>
                </div>
                <p className={`text-4xl font-black bg-linear-to-r ${colors.bg} bg-clip-text text-transparent`}>
                  {item.value}
                </p>
                <p className="text-slate-600 text-xs font-medium mt-3 leading-relaxed">
                  {item.change}
                </p>
              </div>
            );
          })}
        </div>

        {/* 📊 WEEKLY RATINGS CHART */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
          <h2 className="text-slate-900 text-xl font-bold mb-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-linear-to-r from-yellow-600 to-orange-600 text-white flex items-center justify-center">
              <FaStar />
            </div>
            Weekly Ratings Performance
          </h2>
          <div className="h-56 bg-linear-to-br from-slate-50 to-slate-100 rounded-xl p-6 flex items-end justify-around gap-2">
            {getWeeklyRatingsData().map((data, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2 flex-1">
                <div className="relative group w-full flex flex-col items-center">
                  <div
                    className="w-full max-w-8 bg-linear-to-t from-yellow-500 to-yellow-400 rounded-t-lg transition-all hover:from-yellow-600 hover:to-yellow-500 shadow-md"
                    style={{ height: `${data.rating > 0 ? (data.rating / 5) * 150 : 15}px` }}
                  />
                  {data.count > 0 && (
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none">
                      {data.rating}/5 • {data.count} jobs
                    </div>
                  )}
                </div>
                <p className="text-xs font-semibold text-slate-600 mt-1">{data.day}</p>
                {data.count > 0 && <p className="text-xs text-slate-500">{data.rating}</p>}
              </div>
            ))}
          </div>
          <div className="mt-4 text-xs text-slate-500 flex justify-between items-center">
            <span>💡 Your performance this week</span>
            <span>Hover over bars for details</span>
          </div>
        </div>

        {/*  TIPS & SUPPORT */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Quick Tips Card */}
          <div className="bg-linear-to-br from-blue-600 to-blue-700 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all text-white border border-blue-500/30">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center text-2xl">
                💡
              </div>
              <h3 className="text-2xl font-bold">Quick Tips</h3>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-lg">✓</span>
                <span className="text-sm text-blue-100">Accept jobs within 30 seconds for better ratings</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-lg">✓</span>
                <span className="text-sm text-blue-100">Arrive 5 minutes early for a 10% bonus</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-lg">✓</span>
                <span className="text-sm text-blue-100">Complete jobs on time to maintain 5-star rating</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-lg">✓</span>
                <span className="text-sm text-blue-100">Take photos before and after each wash</span>
              </li>
            </ul>
          </div>

          {/* Support Card */}
          <div className="bg-linear-to-br from-purple-600 to-pink-600 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all text-white border border-purple-500/30">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center text-2xl">
                🤝
              </div>
              <h3 className="text-2xl font-bold">Need Help?</h3>
            </div>
            <p className="text-purple-100 text-sm mb-6 leading-relaxed">
              Our support team is here to help you with any questions or issues.
            </p>
            <button className="w-full px-6 py-3 bg-white text-purple-600 hover:bg-purple-50 font-bold rounded-lg transition-all hover:shadow-lg active:scale-95">
              Contact Support
            </button>
          </div>
        </div>
        </div>

      </main>
    </div>
  );
}
