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
  FiSearch,
  FiMapPin,
  FiCalendar,
} from "react-icons/fi";
import { FaCar, FaUser } from "react-icons/fa";

export default function Cars() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [cars, setCars] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCars, setFilteredCars] = useState([]);

  /* LOAD CARS DATA */
  useEffect(() => {
    const loadData = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) return;

      setUser(auth.user);

      // Get all bookings for this employee
      const { data: bookings } = await supabase
        .from("bookings")
        .select("*")
        .eq("assigned_to", auth.user.id)
        .order("created_at", { ascending: false });

      if (!bookings || bookings.length === 0) {
        setCars([]);
        setFilteredCars([]);
        return;
      }

      // Get all unique car IDs from bookings
      const carIds = [...new Set(bookings.map(b => b.car_id).filter(Boolean))];

      if (carIds.length === 0) {
        setCars([]);
        setFilteredCars([]);
        return;
      }

      // Fetch car details from cars table
      const { data: carsData } = await supabase
        .from("cars")
        .select("*")
        .in("id", carIds);

      // Enrich car data with booking information
      const enrichedCars = (carsData || []).map(car => {
        const carBookings = bookings.filter(b => b.car_id === car.id);
        return {
          id: car.id,
          car_name: `${car.brand} ${car.model}`.trim() || "Unknown Car",
          brand: car.brand,
          model: car.model,
          number_plate: car.number_plate,
          image_url: car.image_url,
          customer_id: car.customer_id,
          total_services: carBookings.length,
          completed_services: carBookings.filter(b => b.status === "Completed").length,
          last_service: carBookings[0]?.date,
          services: [...new Set(carBookings.flatMap(b => Array.isArray(b.services) ? b.services : []))],
          total_amount: carBookings.reduce((sum, b) => sum + (b.amount || 0), 0),
          locations: [...new Set(carBookings.map(b => b.location).filter(Boolean))],
          bookings: carBookings,
        };
      });

      setCars(enrichedCars);
      setFilteredCars(enrichedCars);
    };

    loadData();
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
        car.locations?.some(loc => loc.toLowerCase().includes(term))
    );

    setFilteredCars(filtered);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const employeeMenu = [
    { name: "Dashboard", icon: <FiHome />, link: "/employee/dashboard" },
    { name: "My Jobs", icon: <FiClipboard />, link: "/employee/jobs" },
    { name: "Earnings", icon: <FiDollarSign />, link: "/employee/earnings" },
    { name: "Cars", icon: <FaCar />, link: "/employee/cars" },
  ];

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
          <h1 className="text-2xl font-bold">Cars Serviced</h1>

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
          {/* SUMMARY CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-linear-to-br from-blue-600/20 to-blue-900/20 border border-blue-500/30 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <p className="text-slate-400 text-sm font-medium">Total Cars</p>
                <FaCar className="text-blue-400 text-2xl" />
              </div>
              <p className="text-4xl font-bold text-blue-400">{cars.length}</p>
              <p className="text-slate-500 text-xs mt-2">unique vehicles serviced</p>
            </div>

            <div className="bg-linear-to-br from-green-600/20 to-green-900/20 border border-green-500/30 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <p className="text-slate-400 text-sm font-medium">Total Services</p>
                <span className="text-green-400 text-2xl">✓</span>
              </div>
              <p className="text-4xl font-bold text-green-400">
                {cars.reduce((sum, car) => sum + car.total_services, 0)}
              </p>
              <p className="text-slate-500 text-xs mt-2">across all cars</p>
            </div>

            <div className="bg-linear-to-br from-purple-600/20 to-purple-900/20 border border-purple-500/30 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <p className="text-slate-400 text-sm font-medium">Revenue</p>
                <span className="text-purple-400 text-2xl">💰</span>
              </div>
              <p className="text-4xl font-bold text-purple-400">
                ₹{cars.reduce((sum, car) => sum + car.total_amount, 0).toLocaleString()}
              </p>
              <p className="text-slate-500 text-xs mt-2">total from cars</p>
            </div>
          </div>

          {/* SEARCH BAR */}
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 text-lg" />
            <input
              type="text"
              placeholder="Search by car name, brand, model, plate, or location..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
            />
          </div>

          {/* CARS LIST */}
          {filteredCars.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/80 border border-slate-800 rounded-xl">
              <FaCar className="text-5xl text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">
                {searchTerm ? "No cars found matching your search." : "No cars serviced yet."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
              {filteredCars.map((car) => (
                <div
                  key={car.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-lg hover:border-blue-500/50 transition"
                >
                  {/* HEADER WITH IMAGE */}
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
                        <p className="text-xs text-slate-400">{car.brand} {car.model}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-400">
                        {car.completed_services}/{car.total_services}
                      </p>
                      <p className="text-xs text-slate-500">completed</p>
                    </div>
                  </div>

                  {/* DETAILS GRID */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 p-3 bg-slate-800/50 rounded-lg">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Services</p>
                      <p className="font-bold text-blue-400">{car.total_services}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Completed</p>
                      <p className="font-bold text-green-400">{car.completed_services}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Total Amount</p>
                      <p className="font-bold text-purple-400">₹{car.total_amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Last Service</p>
                      <p className="font-bold text-slate-300 text-sm">
                        {car.last_service ? new Date(car.last_service).toLocaleDateString() : "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* LOCATIONS */}
                  {car.locations && car.locations.length > 0 && (
                    <div className="flex items-start gap-2 mb-3 text-sm text-slate-400">
                      <FiMapPin className="text-blue-400 mt-0.5" />
                      <div className="flex flex-wrap gap-2">
                        {car.locations.slice(0, 2).map((loc, i) => (
                          <span key={i} className="px-2 py-1 bg-slate-700/50 rounded text-xs">
                            {loc}
                          </span>
                        ))}
                        {car.locations.length > 2 && (
                          <span className="px-2 py-1 bg-slate-700/50 rounded text-xs">
                            +{car.locations.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* SERVICES TAGS */}
                  {car.services && car.services.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {car.services.slice(0, 3).map((service, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-blue-600/20 border border-blue-500/50 text-blue-300 rounded-full text-xs"
                        >
                          {service}
                        </span>
                      ))}
                      {car.services.length > 3 && (
                        <span className="px-3 py-1 bg-slate-700 border border-slate-600 text-slate-300 rounded-full text-xs">
                          +{car.services.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
