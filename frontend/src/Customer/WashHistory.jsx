import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { useRoleBasedRedirect } from "../utils/roleBasedRedirect";
import {
  FiMenu,
  FiChevronLeft,
  FiCalendar,
  FiTruck,
  FiImage,
  FiHome,
  FiLogOut,
  FiUser,
  FiTag,
  FiGift,
  FiCreditCard,
  FiSettings,
  FiAward,
  FiClipboard,
} from "react-icons/fi";

export default function WashHistory() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [washHistory, setWashHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCar, setSelectedCar] = useState(null);
  const [cars, setCars] = useState([]);
  const [imageErrors, setImageErrors] = useState({});

  /* 🔥 USE ROLE-BASED REDIRECT HOOK */
  useRoleBasedRedirect("customer");

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        if (!auth?.user) {
          navigate("/login");
          return;
        }

        setUser(auth.user);

        // Fetch customer's cars
        const { data: carsList, error: carsError } = await supabase
          .from("cars")
          .select("id, brand, model, number_plate")
          .eq("customer_id", auth.user.id);

        if (carsError) {
          console.warn("⚠️ Could not fetch cars:", carsError);
        } else {
          setCars(carsList || []);
          if (carsList && carsList.length > 0) {
            setSelectedCar(carsList[0].number_plate);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error("❌ Error loading data:", err);
        setLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  // Fetch wash history based on selected car
  useEffect(() => {
    const fetchWashHistory = async () => {
      if (!selectedCar) return;

      try {
        setLoading(true);
        const { data: washRecords, error: washError } = await supabase
          .from("car_wash_tracking")
          .select("*")
          .eq("car_number", selectedCar)
          .eq("status", "washed")
          .order("wash_date", { ascending: false });

        if (washError) {
          console.warn("⚠️ Could not fetch wash history:", washError);
          setWashHistory([]);
        } else {
          setWashHistory(washRecords || []);
          console.log("✅ Wash history loaded:", washRecords);
        }
      } catch (err) {
        console.warn("⚠️ Error fetching wash history:", err);
        setWashHistory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWashHistory();
  }, [selectedCar]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const handleImageError = (imageKey) => {
    setImageErrors(prev => ({
      ...prev,
      [imageKey]: true
    }));
    console.warn(`⚠️ Failed to load image: ${imageKey}`);
  };

  /**
   * Convert Supabase URL to a working Cloudinary URL (if available)
   * Or return the original URL
   */
/**
   * Fixes "Zombie URLs" by replacing old project domains with the current environment's URL.
   */
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null;

    // Get your CURRENT active Supabase URL from environment variables
    const currentBaseUrl = import.meta.env.VITE_SUPABASE_URL; 

    // check if the URL is from Supabase storage (any project)
    if (imageUrl.includes("/storage/v1/object/public/")) {
      // Split the URL to get the path after 'public/'
      const pathParts = imageUrl.split("/storage/v1/object/public/");
      
      // If we successfully split it, rebuild it with the CURRENT base URL
      if (pathParts.length > 1) {
        const relativePath = pathParts[1];
        return `${currentBaseUrl}/storage/v1/object/public/${relativePath}`;
      }
    }
    
    return imageUrl;
  };
  const sidebarItems = [
    { label: "Dashboard", icon: <FiHome />, path: "/customer-dashboard" },
    { label: "Bookings", icon: <FiClipboard />, path: "/bookings" },
    { label: "My Cars", icon: <FiTruck />, path: "/my-cars" },
    { label: "Monthly Pass", icon: <FiTag />, path: "/monthly-pass" },
    { label: "Wash History", icon: <FiImage />, path: "/wash-history", active: true },
    { label: "Loyalty Points", icon: <FiGift />, path: "/customer/loyalty" },
    { label: "Transactions", icon: <FiCreditCard />, path: "/transactions" },
    { label: "Profile", icon: <FiUser />, path: "/profile" },
    { label: "Settings", icon: <FiSettings />, path: "/account-settings" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-gray-900 to-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <div
        className={`${
          collapsed ? "w-20" : "w-64"
        } bg-linear-to-b from-indigo-900 to-indigo-800 text-white transition-all duration-300 overflow-y-auto fixed h-screen z-40`}
      >
        <div className="flex items-center justify-between p-4 border-b border-indigo-700">
          {!collapsed && <h2 className="text-xl font-bold">Car Wash</h2>}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 hover:bg-indigo-700 rounded transition"
          >
            <FiChevronLeft className={`transform transition-transform ${collapsed ? "rotate-180" : ""}`} />
          </button>
        </div>

        <nav className="mt-4">
          {sidebarItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-4 px-4 py-3 transition ${
                item.active
                  ? "bg-indigo-700 border-r-4 border-cyan-400"
                  : "hover:bg-indigo-700"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {!collapsed && <span className="text-sm">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition"
          >
            <FiLogOut />
            {!collapsed && <span className="text-sm">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 ${collapsed ? "ml-20" : "ml-64"} transition-all duration-300 flex flex-col`}>
        {/* Navbar */}
        <div className="bg-linear-to-r from-indigo-900 to-indigo-800 shadow-lg p-6 flex items-center justify-between border-b border-indigo-700">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-indigo-700 rounded lg:hidden text-white"
            >
              <FiMenu size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">Wash History</h1>
              <p className="text-indigo-300 text-sm mt-1">View detailed wash records with before & after photos</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/profile")}
            className="p-3 bg-indigo-700 rounded-full hover:bg-indigo-600 transition text-white"
          >
            <FiUser size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Car Selection Card */}
          <div className="mb-6 bg-linear-to-br from-indigo-800 to-indigo-900 rounded-lg p-6 shadow-lg border border-indigo-700">
            <label className="block text-sm font-semibold text-indigo-200 mb-3">
              Select Car to View History
            </label>
            <select
              value={selectedCar || ""}
              onChange={(e) => setSelectedCar(e.target.value)}
              className="w-full md:w-80 px-4 py-3 bg-gray-800 border border-indigo-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
            >
              <option value="">-- Select a car --</option>
              {cars.map((car) => (
                <option key={car.id} value={car.number_plate}>
                  {car.brand} {car.model} ({car.number_plate})
                </option>
              ))}
            </select>
          </div>

          {/* Wash History List */}
          {washHistory.length === 0 ? (
            <div className="text-center py-16 bg-linear-to-br from-gray-800 to-gray-900 rounded-lg border border-gray-700">
              <FiImage className="mx-auto text-6xl text-gray-600 mb-4" />
              <p className="text-gray-400 text-lg font-semibold">No wash history found</p>
              <p className="text-gray-500 text-sm mt-2">Select a car or check back when washes are completed</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {washHistory.map((wash) => (
                <div
                  key={wash.id}
                  className="bg-linear-to-br from-gray-800 to-gray-900 rounded-lg shadow-xl overflow-hidden hover:shadow-2xl transition border border-gray-700"
                >
                  {/* Header */}
                  <div className="bg-linear-to-r from-cyan-600 to-blue-600 text-white p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-bold flex items-center gap-2">
                          <FiCalendar />
                          {new Date(wash.wash_date).toLocaleDateString("en-IN", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </h3>
                        <p className="text-blue-100 mt-2">
                          {wash.car_model} • {wash.car_number}
                        </p>
                      </div>
                      <span className="px-4 py-2 bg-green-500 rounded-full font-semibold text-sm shadow-lg">
                        ✓ Completed
                      </span>
                    </div>
                  </div>

                  {/* Images Grid */}
                  <div className="p-8">
                    {/* Before Wash */}
                    <div className="mb-10">
                      <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-3">
                        <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                          BEFORE WASH
                        </span>
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                          { key: "before_img_1", label: "Photo 1" },
                          { key: "before_img_2", label: "Photo 2" },
                          { key: "before_img_3", label: "Photo 3" },
                          { key: "before_img_4", label: "Photo 4" },
                        ].map((img) => (
                          <div
                            key={img.key}
                            className="bg-gray-700 rounded-lg overflow-hidden aspect-square border border-gray-600 hover:border-cyan-500 transition group"
                          >
                            {wash[img.key] && !imageErrors[`${wash.id}_${img.key}`] && getImageUrl(wash[img.key]) ? (
                              <img
                                src={getImageUrl(wash[img.key])}
                                alt={img.label}
                                className="w-full h-full object-cover group-hover:scale-110 transition cursor-pointer"
                                onClick={() => window.open(getImageUrl(wash[img.key]), "_blank")}
                                onError={() => handleImageError(`${wash.id}_${img.key}`)}
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800">
                                <FiImage size={40} className="text-gray-500" />
                                <p className="text-xs mt-3 text-gray-400 text-center px-2">Image unavailable</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* After Wash */}
                    <div>
                      <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-3">
                        <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                          AFTER WASH
                        </span>
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                          { key: "after_img_1", label: "Photo 1" },
                          { key: "after_img_2", label: "Photo 2" },
                          { key: "after_img_3", label: "Photo 3" },
                          { key: "after_img_4", label: "Photo 4" },
                        ].map((img) => (
                          <div
                            key={img.key}
                            className="bg-gray-700 rounded-lg overflow-hidden aspect-square border border-gray-600 hover:border-cyan-500 transition group"
                          >
                            {wash[img.key] && !imageErrors[`${wash.id}_${img.key}`] && getImageUrl(wash[img.key]) ? (
                              <img
                                src={getImageUrl(wash[img.key])}
                                alt={img.label}
                                className="w-full h-full object-cover group-hover:scale-110 transition cursor-pointer"
                                onClick={() => window.open(getImageUrl(wash[img.key]), "_blank")}
                                onError={() => handleImageError(`${wash.id}_${img.key}`)}
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800">
                                <FiImage size={40} className="text-gray-500" />
                                <p className="text-xs mt-3 text-gray-400 text-center px-2">Image unavailable</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="bg-gray-900 px-8 py-4 border-t border-gray-700">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Owner</p>
                        <p className="text-sm font-semibold text-white mt-1">{wash.car_owner_name || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Car Model</p>
                        <p className="text-sm font-semibold text-white mt-1">{wash.car_model || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Car Number</p>
                        <p className="text-sm font-semibold text-cyan-400 mt-1">{wash.car_number}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Completed At</p>
                        <p className="text-xs text-gray-400 mt-1">{new Date(wash.created_at).toLocaleString("en-IN")}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
