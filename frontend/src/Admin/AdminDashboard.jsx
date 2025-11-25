import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import {
  FiHome,
  FiUsers,
  FiTrendingUp,
  FiDollarSign,
  FiBell,
  FiMenu,
  FiSettings,
  FiClipboard,
  FiLogOut,
  FiChevronLeft,
} from "react-icons/fi";

export default function AdminDashboard() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (auth?.user) {
        setUser(auth.user);
      }
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const stats = [
    { title: "Today's Bookings", value: "42", change: "+20%" },
    { title: "Revenue Today", value: "₹18,450", change: "+12%" },
    { title: "Active Washers", value: "12", change: "+2" },
    { title: "New Users", value: "9", change: "+3" },
  ];

  const recentBookings = [
    { id: "BK-1023", customer: "Rahul Sharma", car: "i20", city: "Ahmedabad", slot: "10:20 AM", status: "Completed" },
    { id: "BK-1024", customer: "Neha Singh", car: "Honda City", city: "Surat", slot: "10:45 AM", status: "In Progress" },
    { id: "BK-1025", customer: "Aman Verma", car: "Kia Seltos", city: "Vadodara", slot: "11:15 AM", status: "Scheduled" },
  ];

  const adminMenu = [
    { name: "Dashboard", icon: <FiHome />, link: "/admin/dashboard" },
    { name: "Bookings", icon: <FiClipboard />, link: "/admin/bookings" },
    { name: "Users", icon: <FiUsers />, link: "/admin/users" },
    { name: "Revenue", icon: <FiDollarSign />, link: "/admin/revenue" },
    { name: "Analytics", icon: <FiTrendingUp />, link: "/admin/analytics" },
    { name: "Settings", icon: <FiSettings />, link: "/admin/settings" },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-blue-950 text-white flex">

      {/* ▓▓▓ MOBILE TOP BAR ▓▓▓ */}
      <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 py-4 shadow-lg flex items-center justify-between fixed top-0 left-0 right-0 z-40">
        <h1 className="text-xl font-bold bg-linear-to-r from-blue-400 to-blue-600 text-transparent bg-clip-text">CarWash+</h1>
        <FiMenu className="text-2xl text-white cursor-pointer hover:text-blue-400 transition-colors" onClick={() => setSidebarOpen(true)} />
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

          {!collapsed && (
            <FiChevronLeft className="text-slate-400" />
          )}
        </div>

        {/* MENU */}
        <nav className="mt-4 px-3 pb-24">
          {adminMenu.map((item) => (
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
      <div className={`flex-1 transition-all duration-300 mt-14 lg:mt-0 ${collapsed ? "lg:ml-16" : "lg:ml-56"}`}>

        {/* ▓▓▓ NAVBAR ▓▓▓ */}
        <header className="hidden lg:flex h-16 bg-slate-900/90 border-b border-blue-500/20 
        items-center justify-between px-8 sticky top-0 z-20 shadow-lg">

          <h1 className="text-2xl font-bold">Admin Dashboard</h1>

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

        {/* ▓▓▓ PAGE CONTENT ▓▓▓ */}
        <main className="p-4 md:p-8 space-y-8">

          {/* Title */}
          <div>
            <h1 className="text-3xl font-bold">Dashboard Overview</h1>
            <p className="text-slate-400 text-sm mt-1">Live business insights</p>
          </div>

          {/* 🌈 STAT CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {stats.map((item, index) => (
              <div
                key={item.title}
                className={`rounded-xl p-6 shadow-lg border border-slate-800 
                bg-linear-to-br
                ${index % 2 === 0 ? "from-blue-600/20 to-blue-900/20" : "from-purple-600/20 to-pink-900/20"} 
                hover:scale-105 transition-transform duration-300 cursor-pointer`}
              >
                <p className="text-slate-400 text-sm font-medium">{item.title}</p>
                <p className="text-4xl font-bold mt-3 text-white">{item.value}</p>
                <p className="text-green-400 text-xs mt-2 font-medium">{item.change}</p>
              </div>
            ))}
          </div>

          {/* 📊 CHART PLACEHOLDER */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-xl">
            <h2 className="text-white text-lg font-semibold mb-4">Bookings Trend</h2>
            <div className="h-56 bg-slate-800/50 rounded-lg flex items-center justify-center text-slate-500 border border-slate-700">
              <div className="text-center">
                <FiTrendingUp className="text-4xl mx-auto mb-2 opacity-50" />
                <p>Chart Coming Soon</p>
              </div>
            </div>
          </div>

          {/* 📝 Recent Bookings */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold text-white">Recent Bookings</h2>
              <button className="text-blue-400 text-sm hover:text-blue-300 transition font-medium">View All →</button>
            </div>

            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400">
                    <th className="py-3 text-left font-medium">ID</th>
                    <th className="py-3 text-left font-medium">Customer</th>
                    <th className="py-3 text-left font-medium">Car</th>
                    <th className="py-3 text-left font-medium">City</th>
                    <th className="py-3 text-left font-medium">Slot</th>
                    <th className="py-3 text-left font-medium">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {recentBookings.map((b) => (
                    <tr key={b.id} className="border-b border-slate-800 text-slate-300 hover:bg-slate-800/50 transition">
                      <td className="py-3 font-medium text-blue-400">{b.id}</td>
                      <td className="py-3">{b.customer}</td>
                      <td className="py-3">{b.car}</td>
                      <td className="py-3">{b.city}</td>
                      <td className="py-3">{b.slot}</td>
                      <td className="py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            b.status === "Completed"
                              ? "bg-green-600/25 text-green-300"
                              : b.status === "In Progress"
                              ? "bg-yellow-600/25 text-yellow-300"
                              : "bg-slate-600/25 text-slate-300"
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
