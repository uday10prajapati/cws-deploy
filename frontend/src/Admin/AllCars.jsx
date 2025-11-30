import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Link, useLocation } from "react-router-dom";
import {
  FiMenu,
  FiBell,
  FiSearch,
  FiMapPin,
  FiHome,
  FiClipboard,
  FiUsers,
  FiDollarSign,
  FiTrendingUp,
  FiLogOut,
  FiChevronLeft,
  FiSettings,
  FiCreditCard,
  FiX,
} from "react-icons/fi";
import { FaCar, FaUser } from "react-icons/fa";

export default function AllCars() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [cars, setCars] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCars, setFilteredCars] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const loadUser = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (auth?.user) {
        setUser(auth.user);
      }
    };
    loadUser();
  }, []);

  /* LOAD ALL CARS WITH USER DETAILS */
  useEffect(() => {
    const loadCars = async () => {
      try {
        // Fetch all cars from backend API (all customer cars)
        const response = await fetch("http://localhost:5000/cars");
        const result = await response.json();

        if (!result.success || !result.cars) {
          setCars([]);
          setFilteredCars([]);
          return;
        }

        const carsData = result.cars;
        const carIds = carsData.map(c => c.id);

        if (carIds.length === 0) {
          setCars([]);
          setFilteredCars([]);
          return;
        }

        // Fetch booking stats for all cars
        const { data: bookingsData } = await supabase
          .from("bookings")
          .select("id, car_id, status, amount, date, location, services")
          .in("car_id", carIds);

        // Fetch customer info
        const customerIds = [...new Set(carsData.map(c => c.customer_id))];
        const { data: customersData } = await supabase
          .from("profiles")
          .select("id, email, name")
          .in("id", customerIds);

        const customerMap = {};
        (customersData || []).forEach(cust => {
          customerMap[cust.id] = cust;
        });

        // Enrich car data with stats
        const enrichedCars = carsData.map(car => {
          const carBookings = (bookingsData || []).filter(b => b.car_id === car.id);
          const customer = customerMap[car.customer_id] || {};
          return {
            ...car,
            car_name: `${car.brand} ${car.model}`.trim() || "Unknown Car",
            owner_name: customer.name || customer.email || "Unknown",
            owner_email: customer.email || "N/A",
            total_bookings: carBookings.length,
            completed_bookings: carBookings.filter(b => b.status === "Completed").length,
            total_revenue: carBookings.reduce((sum, b) => sum + (b.amount || 0), 0),
            last_service: carBookings.length > 0 ? carBookings[0].date : null,
            locations: [...new Set(carBookings.map(b => b.location).filter(Boolean))],
            status_breakdown: {
              pending: carBookings.filter(b => b.status === "Pending").length,
              confirmed: carBookings.filter(b => b.status === "Confirmed").length,
              inProgress: carBookings.filter(b => b.status === "In Progress").length,
              completed: carBookings.filter(b => b.status === "Completed").length,
            },
          };
        });

        setCars(enrichedCars);
        setFilteredCars(enrichedCars);
      } catch (error) {
        console.error("Error loading cars:", error);
      }
    };

    loadCars();
  }, []);

  /* SEARCH FILTER */
  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);

    const filtered = cars.filter(
      (car) =>
        car.car_name.toLowerCase().includes(term) ||
        car.brand?.toLowerCase().includes(term) ||
        car.model?.toLowerCase().includes(term) ||
        car.number_plate?.toLowerCase().includes(term) ||
        car.owner_name?.toLowerCase().includes(term) ||
        car.owner_email?.toLowerCase().includes(term) ||
        car.locations?.some(loc => loc.toLowerCase().includes(term))
    );

    setFilteredCars(filtered);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const adminMenu = [
    { name: "Dashboard", icon: <FiHome />, link: "/admin/dashboard" },
    { name: "Bookings", icon: <FiClipboard />, link: "/admin/bookings" },
    { name: "Users", icon: <FiUsers />, link: "/admin/users" },
    { name: "Cars", icon: <FaCar />, link: "/admin/cars" },
    { name: "Revenue", icon: <FiDollarSign />, link: "/admin/revenue" },
    { name: "Analytics", icon: <FiTrendingUp />, link: "/admin/analytics" },
    { name: "Bank Account", icon: <FiCreditCard />, link: "/admin/bank-account" },
    { name: "Settings", icon: <FiSettings />, link: "/admin/settings" },
  ];

  const stats = [
    {
      title: "Total Cars",
      value: cars.length,
      icon: <FaCar />,
      color: "from-blue-600/20 to-blue-900/20",
    },
    {
      title: "Total Bookings",
      value: cars.reduce((sum, car) => sum + car.total_bookings, 0),
      icon: <FiClipboard />,
      color: "from-purple-600/20 to-purple-900/20",
    },
    {
      title: "Completed Services",
      value: cars.reduce((sum, car) => sum + car.completed_bookings, 0),
      icon: <span>✓</span>,
      color: "from-green-600/20 to-green-900/20",
    },
    {
      title: "Total Revenue",
      value: `₹${cars.reduce((sum, car) => sum + car.total_revenue, 0).toLocaleString()}`,
      icon: <FiDollarSign />,
      color: "from-yellow-600/20 to-yellow-900/20",
    },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-blue-950 text-white flex">
      {/* ▓▓▓ MOBILE TOP BAR ▓▓▓ */}
      <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 py-4 shadow-lg flex items-center justify-between fixed top-0 left-0 right-0 z-40">
        <h1 className="text-xl font-bold bg-linear-to-r from-blue-400 to-blue-600 text-transparent bg-clip-text">
          CarWash+
        </h1>
        <FiMenu className="text-2xl cursor-pointer" onClick={() => setSidebarOpen(true)} />
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
        <div
          className="hidden lg:flex items-center justify-between p-4 border-b border-slate-800 cursor-pointer hover:bg-slate-800"
          onClick={() => setCollapsed(!collapsed)}
        >
          <span className="font-extrabold text-lg">{collapsed ? "CW" : "CarWash+"}</span>
          {!collapsed && <FiChevronLeft className="text-slate-400" />}
        </div>

        <nav className="mt-4 px-3 pb-24">
          {adminMenu.map((item) => (
            <Link
              key={item.name}
              to={item.link}
              onClick={() => setSidebarOpen(false)}
              className={`
                flex items-center gap-4 px-3 py-2 rounded-lg mb-2 font-medium transition-all 
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
            px-4 py-2 rounded-lg cursor-pointer flex items-center gap-3 shadow-lg transition-all
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
        <header className="hidden lg:flex h-16 bg-slate-900/90 border-b border-blue-500/20 items-center justify-between px-8 sticky top-0 z-20 shadow-lg">
          <h1 className="text-2xl font-bold">All Cars</h1>

          <div className="flex items-center gap-8 relative">
            {/* NOTIFICATIONS BELL */}
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="text-xl text-slate-300 hover:text-blue-400 transition relative group"
            >
              <FiBell />
              {notifications.length > 0 && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>

            {/* NOTIFICATIONS DROPDOWN */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-96 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto top-12">
                <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center">
                  <h3 className="font-semibold text-white text-sm">Notifications</h3>
                  <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-white transition">
                    <FiX />
                  </button>
                </div>
                {notifications.length > 0 ? (
                  notifications.map((notif, idx) => (
                    <div key={idx} className="p-4 border-b border-slate-800 hover:bg-slate-800/50 transition last:border-b-0">
                      <div className="flex items-start gap-3">
                        <span className="text-xl">{notif.icon}</span>
                        <div className="flex-1">
                          <p className="font-medium text-white text-sm">{notif.title}</p>
                          <p className="text-xs text-slate-400 mt-1">{notif.message}</p>
                          <p className="text-xs text-slate-500 mt-1">{notif.time}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-slate-400 text-sm">No notifications yet</p>
                  </div>
                )}
              </div>
            )}

            <img
              src={`https://ui-avatars.com/api/?name=${user?.email}&background=3b82f6&color=fff`}
              className="w-10 h-10 rounded-full border-2 border-blue-500 cursor-pointer hover:border-blue-400 transition"
              alt="Profile"
            />
          </div>
        </header>

        {/* ▓▓▓ PAGE CONTENT ▓▓▓ */}
        <main className="p-4 md:p-8 space-y-6">
          {/* WELCOME */}
          <div>
            <h2 className="text-3xl font-bold">All Registered Cars</h2>
            <p className="text-slate-400 text-sm mt-1">View and manage all user-registered vehicles</p>
          </div>

          {/* STAT CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {stats.map((stat, index) => (
              <div
                key={stat.title}
                className={`rounded-xl p-6 shadow-lg border border-slate-800 bg-linear-to-br ${stat.color} hover:scale-105 transition-transform duration-300 cursor-pointer`}
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-slate-400 text-sm font-medium">{stat.title}</p>
                  <span className="text-2xl text-blue-400 opacity-60">{stat.icon}</span>
                </div>
                <p className="text-4xl font-bold text-white">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* SEARCH BAR */}
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 text-lg" />
            <input
              type="text"
              placeholder="Search by car name, plate, owner name, email, or location..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
            />
          </div>

          {/* CARS TABLE */}
          {filteredCars.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/80 border border-slate-800 rounded-xl">
              <FaCar className="text-5xl text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">
                {searchTerm ? "No cars found matching your search." : "No cars registered yet."}
              </p>
            </div>
          ) : (
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 bg-slate-800/50">
                      <th className="px-6 py-4 text-left font-semibold text-slate-300">Car Details</th>
                      <th className="px-6 py-4 text-left font-semibold text-slate-300">Owner</th>
                      <th className="px-6 py-4 text-left font-semibold text-slate-300">Plate</th>
                      <th className="px-6 py-4 text-center font-semibold text-slate-300">Bookings</th>
                      <th className="px-6 py-4 text-center font-semibold text-slate-300">Completed</th>
                      <th className="px-6 py-4 text-right font-semibold text-slate-300">Revenue</th>
                      <th className="px-6 py-4 text-left font-semibold text-slate-300">Last Service</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCars.map((car, idx) => (
                      <tr key={car.id || idx} className="border-b border-slate-800 hover:bg-slate-800/50 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {car.image_url ? (
                              <img
                                src={car.image_url}
                                alt={car.car_name}
                                className="w-10 h-10 rounded object-cover border border-blue-500/50"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-blue-600/20 border border-blue-500 rounded flex items-center justify-center">
                                <FaCar className="text-blue-400 text-sm" />
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-white">{car.car_name}</p>
                              <p className="text-xs text-slate-400">{car.brand} {car.model}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                              {car.owner_name?.charAt(0) || "U"}
                            </div>
                            <div>
                              <p className="font-medium text-white text-sm">{car.owner_name}</p>
                              <p className="text-xs text-slate-400">{car.owner_email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-blue-600/20 border border-blue-500/50 text-blue-300 rounded text-xs font-semibold">
                            {car.number_plate || "N/A"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <p className="font-bold text-white">{car.total_bookings}</p>
                          <p className="text-xs text-slate-400">Total</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <p className="font-bold text-green-400">{car.completed_bookings}</p>
                          <p className="text-xs text-slate-400">Completed</p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <p className="font-bold text-yellow-400">₹{car.total_revenue.toLocaleString()}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-slate-300">
                            {car.last_service 
                              ? new Date(car.last_service).toLocaleDateString() 
                              : "N/A"}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* DETAILED CARDS VIEW */}
          {filteredCars.length > 0 && (
            <div>
              <h3 className="text-xl font-bold mb-4 mt-8">Detailed Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
                {filteredCars.map((car) => (
                  <div
                    key={car.id}
                    className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-lg hover:border-blue-500/50 transition"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4 flex-1">
                        {car.image_url ? (
                          <img
                            src={car.image_url}
                            alt={car.car_name}
                            className="w-16 h-16 rounded-lg object-cover border border-blue-500/50"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-blue-600/20 border border-blue-500 rounded-lg flex items-center justify-center">
                            <FaCar className="text-blue-400 text-2xl" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-white">{car.car_name}</h3>
                          <p className="text-sm text-blue-400 font-semibold">{car.number_plate}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            Owner: {car.owner_name} • {car.owner_email}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* STATS GRID */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 p-3 bg-slate-800/50 rounded-lg">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Total Bookings</p>
                        <p className="font-bold text-blue-400">{car.total_bookings}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Completed</p>
                        <p className="font-bold text-green-400">{car.completed_bookings}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Revenue</p>
                        <p className="font-bold text-yellow-400">₹{car.total_revenue.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Pending</p>
                        <p className="font-bold text-orange-400">{car.status_breakdown.pending}</p>
                      </div>
                    </div>

                    {/* STATUS BREAKDOWN */}
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-2 text-center">
                        <p className="text-xs text-blue-300 font-semibold">Confirmed</p>
                        <p className="font-bold text-blue-400">{car.status_breakdown.confirmed}</p>
                      </div>
                      <div className="bg-yellow-600/20 border border-yellow-500/30 rounded-lg p-2 text-center">
                        <p className="text-xs text-yellow-300 font-semibold">In Progress</p>
                        <p className="font-bold text-yellow-400">{car.status_breakdown.inProgress}</p>
                      </div>
                      <div className="bg-green-600/20 border border-green-500/30 rounded-lg p-2 text-center">
                        <p className="text-xs text-green-300 font-semibold">Completed</p>
                        <p className="font-bold text-green-400">{car.status_breakdown.completed}</p>
                      </div>
                      <div className="bg-gray-600/20 border border-gray-500/30 rounded-lg p-2 text-center">
                        <p className="text-xs text-gray-300 font-semibold">Pending</p>
                        <p className="font-bold text-gray-400">{car.status_breakdown.pending}</p>
                      </div>
                    </div>

                    {/* LOCATIONS */}
                    {car.locations && car.locations.length > 0 && (
                      <div className="flex items-start gap-2 mb-3 text-sm text-slate-400">
                        <FiMapPin className="text-blue-400 mt-0.5 shrink-0" />
                        <div className="flex flex-wrap gap-2">
                          {car.locations.slice(0, 3).map((loc, i) => (
                            <span key={i} className="px-2 py-1 bg-slate-700/50 rounded text-xs">
                              {loc}
                            </span>
                          ))}
                          {car.locations.length > 3 && (
                            <span className="px-2 py-1 bg-slate-700/50 rounded text-xs">
                              +{car.locations.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
