import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Link, useLocation } from "react-router-dom";
import {
  FiMenu,
  FiLogOut,
  FiChevronLeft,
  FiHome,
  FiClipboard,
  FiDollarSign,
  FiBell,
  FiStar,
} from "react-icons/fi";
import { FaCar } from "react-icons/fa";

export default function Ratings() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [averageRating, setAverageRating] = useState(0);

  /* LOAD RATINGS DATA */
  useEffect(() => {
    const loadData = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) return;

      setUser(auth.user);

      try {
        // Fetch ratings from backend API
        const response = await fetch(`http://localhost:5000/ratings/employee/${auth.user.id}`);
        const result = await response.json();

        if (result.success) {
          setRatings(result.data.ratings);
          setAverageRating(result.data.statistics.averageRating);
        }
      } catch (error) {
        console.error("Error fetching ratings:", error);
      }
    };

    loadData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const employeeMenu = [
    { name: "Dashboard", icon: <FiHome />, link: "/employee/dashboard" },
    { name: "My Jobs", icon: <FiClipboard />, link: "/employee/jobs" },
    { name: "Earnings", icon: <FiDollarSign />, link: "/employee/earnings" },
    { name: "Ratings", icon: <FiStar />, link: "/employee/ratings" },
  ];

  // Count ratings by star value
  const ratingCounts = {
    5: ratings.filter(r => r.rating === 5).length,
    4: ratings.filter(r => r.rating === 4).length,
    3: ratings.filter(r => r.rating === 3).length,
    2: ratings.filter(r => r.rating === 2).length,
    1: ratings.filter(r => r.rating === 1).length,
  };

  const maxCount = Math.max(...Object.values(ratingCounts));

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-blue-950 text-white flex">
      {/* ▓▓ MOBILE TOP BAR ▓▓ */}
      <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 py-4 shadow-lg flex items-center justify-between fixed top-0 left-0 right-0 z-40">
        <h1 className="text-xl font-bold bg-linear-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
          CarWash+
        </h1>
        <FiMenu
          className="text-2xl cursor-pointer"
          onClick={() => setSidebarOpen(true)}
        />
      </div>

      {/* ▓▓ BACKDROP FOR MOBILE ▓▓ */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ▓▓ SIDEBAR ▓▓ */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-slate-900 border-r border-slate-800 shadow-2xl 
          z-50 transition-all duration-300
          ${collapsed ? "w-16" : "w-56"}
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div
          className="hidden lg:flex items-center justify-between p-4 border-b border-slate-800 cursor-pointer hover:bg-slate-800"
          onClick={() => setCollapsed(!collapsed)}
        >
          <span className="font-extrabold text-lg">{collapsed ? "CW" : "CarWash+"}</span>
          {!collapsed && <FiChevronLeft className="text-slate-400" />}
        </div>

        <nav className="mt-4 px-3 pb-24">
          {employeeMenu.map((item) => (
            <Link
              key={item.name}
              to={item.link}
              className={`
                flex items-center gap-4 px-3 py-2 rounded-lg mb-2 font-medium transition-all 
                ${
                  location.pathname === item.link
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-300 hover:bg-slate-800 hover:text-blue-400"
                }
                ${collapsed ? "justify-center" : ""}
              `}
              onClick={() => setSidebarOpen(false)}
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
            px-4 py-2 rounded-lg cursor-pointer flex items-center gap-3
            ${collapsed ? "justify-center" : ""}
          `}
        >
          <FiLogOut className="text-lg" />
          {!collapsed && "Logout"}
        </div>
      </aside>

      {/* ▓▓ MAIN CONTENT AREA ▓▓ */}
      <div className={`flex-1 transition-all duration-300 mt-14 lg:mt-0 ${collapsed ? "lg:ml-16" : "lg:ml-56"}`}>
        {/* NAVBAR (Desktop Only) */}
        <header className="hidden lg:flex h-16 bg-slate-900/90 border-b border-blue-500/20 items-center justify-between px-8 sticky top-0 z-20 shadow-lg">
          <h1 className="text-2xl font-bold">Customer Ratings</h1>

          <div className="flex items-center gap-6">
            <FiBell className="text-xl text-slate-300 hover:text-blue-400 cursor-pointer" />

            {user && (
              <img
                src={`https://ui-avatars.com/api/?name=${user.email}&background=3b82f6&color=fff`}
                className="w-10 h-10 rounded-full border-2 border-blue-500"
                alt="User"
              />
            )}
          </div>
        </header>

        {/* ▓▓ PAGE CONTENT ▓▓ */}
        <main className="p-4 md:p-8 space-y-6">
          {/* RATING SUMMARY CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-linear-to-br from-yellow-600/20 to-yellow-900/20 border border-yellow-500/30 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <p className="text-slate-400 text-sm font-medium">Average Rating</p>
                <FiStar className="text-yellow-400 text-2xl" />
              </div>
              <p className="text-4xl font-bold text-yellow-400">{averageRating > 0 ? averageRating : "N/A"}</p>
              <p className="text-slate-500 text-xs mt-2">out of 5 stars</p>
            </div>

            <div className="bg-linear-to-br from-blue-600/20 to-blue-900/20 border border-blue-500/30 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <p className="text-slate-400 text-sm font-medium">Total Ratings</p>
                <FiStar className="text-blue-400 text-2xl" />
              </div>
              <p className="text-4xl font-bold text-blue-400">{ratings.length}</p>
              <p className="text-slate-500 text-xs mt-2">from customers</p>
            </div>

            <div className="bg-linear-to-br from-green-600/20 to-green-900/20 border border-green-500/30 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <p className="text-slate-400 text-sm font-medium">5-Star Ratings</p>
                <span className="text-green-400 text-2xl">⭐</span>
              </div>
              <p className="text-4xl font-bold text-green-400">{ratingCounts[5]}</p>
              <p className="text-slate-500 text-xs mt-2">excellent service</p>
            </div>
          </div>

          {/* RATING DISTRIBUTION CHART */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-xl">
            <h2 className="text-white text-lg font-semibold mb-6">Rating Distribution</h2>

            <div className="space-y-4">
              {[5, 4, 3, 2, 1].map((star) => (
                <div key={star} className="flex items-center gap-4">
                  <div className="flex items-center gap-1 w-16">
                    {Array(star).fill(0).map((_, i) => (
                      <span key={i} className="text-yellow-400 text-lg">⭐</span>
                    ))}
                    {Array(5 - star).fill(0).map((_, i) => (
                      <span key={i} className="text-slate-600 text-lg">⭐</span>
                    ))}
                  </div>

                  <div className="flex-1 bg-slate-800 rounded-full h-8 overflow-hidden">
                    <div
                      className="bg-linear-to-r from-yellow-500 to-yellow-400 h-full transition-all"
                      style={{
                        width: maxCount > 0 ? `${(ratingCounts[star] / maxCount) * 100}%` : "0%",
                      }}
                    />
                  </div>

                  <p className="text-sm text-slate-300 w-12 text-right font-semibold">
                    {ratingCounts[star]}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* DETAILED RATINGS LIST */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-xl">
            <h2 className="text-white text-lg font-semibold mb-4">Detailed Reviews</h2>

            {ratings.length === 0 ? (
              <div className="text-center py-12">
                <FiStar className="text-5xl text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No ratings yet. Complete more jobs to earn ratings!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {ratings.map((rating, idx) => (
                  <div
                    key={rating.id || idx}
                    className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-blue-500/50 transition"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
                          {rating.customer_name?.charAt(0) || "C"}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{rating.customer_name || "Customer"}</p>
                          <p className="text-xs text-slate-500">
                            {new Date(rating.rated_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {Array(rating.rating || 0).fill(0).map((_, i) => (
                          <span key={i} className="text-yellow-400 text-lg">⭐</span>
                        ))}
                        {Array(5 - (rating.rating || 0)).fill(0).map((_, i) => (
                          <span key={i} className="text-slate-600 text-lg">⭐</span>
                        ))}
                      </div>
                    </div>

                    {/* SERVICE INFO */}
                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
                      <FaCar className="text-blue-400" />
                      <span>{rating.car_name || "Car"}</span>
                      <span className="text-slate-600">•</span>
                      <span>
                        {Array.isArray(rating.services) && rating.services.length > 0
                          ? rating.services[0]
                          : "Service"}
                      </span>
                    </div>

                    {/* RATING COMMENT */}
                    {rating.rating_comment && (
                      <p className="text-slate-300 text-sm leading-relaxed italic">
                        "{rating.rating_comment}"
                      </p>
                    )}

                    {!rating.rating_comment && (
                      <p className="text-slate-500 text-sm italic">No comment provided</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
