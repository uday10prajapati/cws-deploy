import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Link, useLocation } from "react-router-dom";
import {
  FiMenu,
  FiLogOut,
  FiChevronLeft,
  FiPlus,
  FiTrash,
  FiHome,
  FiClipboard,
  FiUser,
  FiCreditCard,
  FiAward,
  FiMapPin,
} from "react-icons/fi";
import { FaCar } from "react-icons/fa";

export default function MyCars() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const [user, setUser] = useState(null);
  const [cars, setCars] = useState([]);
  const [monthlyPass, setMonthlyPass] = useState(null);

  /** Add Car Modal */
  const [modalOpen, setModalOpen] = useState(false);
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [numberPlate, setNumberPlate] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [loading, setLoading] = useState(false);

  /** Sidebar menu */
  const customerMenu = [
    { name: "Home", icon: <FiHome />, link: "/" },
        { name: "My Bookings", icon: <FiClipboard />, link: "/bookings" },
        { name: "My Cars", icon: <FaCar />, link: "/my-cars" },
        { name: "Monthly Pass", icon: <FiAward />, link: "/monthly-pass" },
        { name: "Profile", icon: <FiUser />, link: "/profile" },
        { name: "Location", icon: <FiMapPin />, link: "/location" },
        { name: "Transactions", icon: <FiCreditCard />, link: "/transactions" },
    
  ];

  /** Load user + cars */
  useEffect(() => {
    const load = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) return;

      setUser(auth.user);

      try {
        const response = await fetch(`http://localhost:5000/cars/${auth.user.id}`);
        const result = await response.json();
        if (result.success) {
          setCars(result.data || []);
        }

        // Load monthly pass
        const passResponse = await fetch(`http://localhost:5000/pass/current/${auth.user.id}`);
        const passResult = await passResponse.json();
        if (passResult.success && passResult.data) {
          setMonthlyPass(passResult.data);
        }
      } catch (err) {
        console.error("Error loading cars or pass:", err);
      }
    };
    load();
  }, []);

  /** Upload image - Convert to Base64 and store in DB */
  const uploadCarImage = async (file) => {
    if (!file) return null;

    console.log("📸 Processing image:", file.name);

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result;
        console.log("✅ Image converted to Base64");
        resolve(base64);
      };
      reader.readAsDataURL(file);
    });
  };

  /** Add Car */
  const handleAddCar = async () => {
    if (!brand || !model || !numberPlate) return;
    setLoading(true);

    console.log("🚗 Adding car:", { brand, model, numberPlate, hasImage: !!imageFile });

    let imageUrl = null;
    if (imageFile) {
      imageUrl = await uploadCarImage(imageFile);
      console.log("📷 Image URL received:", imageUrl);
    }

    try {
      const carData = {
        customer_id: user.id,
        brand,
        model,
        number_plate: numberPlate,
        image_url: imageUrl,
      };

      console.log("📤 Sending to backend:", carData);

      const response = await fetch("http://localhost:5000/cars/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(carData),
      });

      const result = await response.json();
      console.log("✅ Backend response:", result);

      if (result.success) {
        console.log("🎉 Car added successfully!");
        setModalOpen(false);
        setBrand("");
        setModel("");
        setNumberPlate("");
        setImageFile(null);
        setImagePreview(null);

        // Reload cars list
        const carResponse = await fetch(`http://localhost:5000/cars/${user.id}`);
        const carResult = await carResponse.json();
        if (carResult.success) {
          setCars(carResult.data || []);
          console.log("📋 Cars reloaded:", carResult.data);
        }
      } else {
        alert("Failed to add car: " + result.error?.message || "Unknown error");
      }
    } catch (err) {
      console.error("❌ Error adding car:", err);
      alert("Failed to add car. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /** Delete Car */
  const deleteCar = async (id) => {
    if (!window.confirm("Are you sure you want to delete this car?")) return;

    try {
      const response = await fetch(`http://localhost:5000/cars/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();
      if (result.success) {
        setCars((prev) => prev.filter((c) => c.id !== id));
        console.log("✅ Car deleted successfully");
      } else {
        alert("Failed to delete car");
      }
    } catch (err) {
      console.error("Error deleting car:", err);
      alert("Error deleting car. Please try again.");
    }
  };

  /** Logout */
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-blue-950 text-white flex">
      {/* MOBILE NAVBAR */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-slate-900 px-4 py-4 flex items-center justify-between border-b border-slate-800 z-40">
        <h1 className="text-xl font-bold">CarWash+</h1>
        <FiMenu className="text-2xl" onClick={() => setSidebarOpen(true)} />
      </div>

      {/* BACKDROP */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-slate-900 border-r border-slate-800 shadow-xl
          transition-all duration-300 z-50
          ${collapsed ? "w-16" : "w-56"}
          ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        <div
          className="hidden lg:flex items-center justify-between p-4 border-b border-slate-800 cursor-pointer hover:bg-slate-800"
          onClick={() => setCollapsed(!collapsed)}
        >
          <span className="font-extrabold text-lg">
            {collapsed ? "CW" : "CarWash+"}
          </span>
          {!collapsed && <FiChevronLeft className="text-slate-400" />}
        </div>

        <nav className="px-3 mt-4">
          {customerMenu.map((item) => (
            <Link
              key={item.name}
              to={item.link}
              className={`
                flex items-center gap-4 px-3 py-2 rounded-lg mb-2
                ${
                  location.pathname === item.link
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-blue-400"
                }
                ${collapsed ? "justify-center" : ""}
              `}
            >
              <span className="text-xl">{item.icon}</span>
              {!collapsed && <span>{item.name}</span>}
            </Link>
          ))}
        </nav>

        <div
          onClick={handleLogout}
          className={`
            absolute bottom-6 left-3 right-3 bg-red-600 hover:bg-red-700 
            text-white px-4 py-2 rounded-lg cursor-pointer flex items-center gap-3
            ${collapsed ? "justify-center" : ""}
          `}
        >
          <FiLogOut />
          {!collapsed && "Logout"}
        </div>
      </aside>

      {/* MAIN */}
      <div
        className={`flex-1 transition-all duration-300 mt-14 lg:mt-0 ${
          collapsed ? "lg:ml-16" : "lg:ml-56"
        }`}
      >
        {/* NAVBAR */}
        <header className="hidden lg:flex h-16 bg-slate-900/90 border-b border-slate-700 items-center justify-between px-8 sticky top-0 z-20">
          <h1 className="text-xl font-bold">My Cars</h1>
          <img
            src={`https://ui-avatars.com/api/?name=${user?.email}&background=3b82f6&color=fff`}
            className="w-10 h-10 rounded-full border-2 border-blue-500"
          />
        </header>

        {/* CONTENT */}
        <main className="p-4 md:p-8 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <FaCar className="text-blue-400" /> Your Cars
            </h2>
            <button
              onClick={() => setModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 text-sm font-semibold"
            >
              <FiPlus /> Add Car
            </button>
          </div>

          {/* CAR LIST */}
          {cars.length === 0 ? (
            <p className="text-slate-400">You haven't added any cars yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {cars.map((car) => (
                <div
                  key={car.id}
                  className="rounded-2xl overflow-hidden bg-slate-900 shadow-2xl border border-slate-800 hover:border-blue-500 hover:shadow-blue-500/20 transition-all duration-300 transform hover:scale-[1.02]"
                >
                  {/* Car Image */}
                  <div className="relative bg-slate-800">
                    {car.image_url ? (
                      <img
                        src={car.image_url}
                        alt={`${car.brand} ${car.model}`}
                        className="w-full h-44 object-cover"
                        onError={(e) => {
                          e.target.src = "https://dummyimage.com/600x400/1e293b/ffffff&text=Car";
                        }}
                      />
                    ) : (
                      <div className="w-full h-44 flex items-center justify-center bg-linear-to-br from-slate-700 to-slate-800">
                        <FaCar className="text-6xl text-slate-500 opacity-50" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent"></div>
                  </div>

                  {/* CONTENT */}
                  <div className="p-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-lg font-bold text-white">
                          {car.brand} {car.model}
                        </h2>
                        <p className="text-sm text-slate-400 mt-1">
                          {car.number_plate}
                        </p>
                      </div>

                      <span className="px-3 py-1 text-xs rounded-full bg-blue-600 text-white shadow-lg">
                        My Car
                      </span>
                    </div>

                    <div className="border-t border-slate-700 my-4"></div>

                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-slate-800/60 p-2 rounded-lg">
                        <p className="text-[10px] text-slate-400">Brand</p>
                        <p className="text-sm font-semibold text-white">
                          {car.brand}
                        </p>
                      </div>

                      <div className="bg-slate-800/60 p-2 rounded-lg">
                        <p className="text-[10px] text-slate-400">Model</p>
                        <p className="text-sm font-semibold text-white">
                          {car.model}
                        </p>
                      </div>

                      <div className="bg-slate-800/60 p-2 rounded-lg">
                        <p className="text-[10px] text-slate-400">Plate</p>
                        <p className="text-sm font-semibold text-white">
                          {car.number_plate}
                        </p>
                      </div>
                    </div>

                    {/* Active Pass Section */}
                    <div className="mt-4 p-3 bg-linear-to-r from-blue-900/30 to-purple-900/30 border border-blue-700/50 rounded-lg">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">Active Pass</p>
                      {monthlyPass && monthlyPass.active ? (
                        <div>
                          <p className="text-sm font-semibold text-green-400 mt-1">
                            ✓ Monthly Pass • {monthlyPass.remaining_washes}/{monthlyPass.total_washes} washes
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            Valid till: {new Date(monthlyPass.valid_till).toLocaleDateString()}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm font-semibold text-yellow-400 mt-1">No Active Pass</p>
                      )}
                    </div>

                    <button
                      onClick={() => deleteCar(car.id)}
                      className="w-full mt-5 py-2 bg-red-600 hover:bg-red-700 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold shadow-lg shadow-red-900/40 transition-all"
                    >
                      <FiTrash /> Delete Car
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* ADD CAR MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-xl font-semibold mb-4">Add a New Car</h3>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Brand"
                className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />

              <input
                type="text"
                placeholder="Model"
                className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              />

              <input
                type="text"
                placeholder="Number Plate (e.g., MH12AB1234)"
                className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg"
                value={numberPlate}
                onChange={(e) => setNumberPlate(e.target.value)}
              />

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium mb-2">Car Image (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    setImageFile(file);
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setImagePreview(reader.result);
                        console.log("📸 Image preview ready");
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg"
                />
                {imagePreview && (
                  <div className="mt-3 relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-lg border border-slate-600"
                    />
                    <p className="text-xs text-slate-400 mt-1">✅ Image selected</p>
                  </div>
                )}
              </div>

              <button
                onClick={handleAddCar}
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Saving…" : "Add Car"}
              </button>

              <button
                onClick={() => {
                  setModalOpen(false);
                  setBrand("");
                  setModel("");
                  setNumberPlate("");
                  setImageFile(null);
                  setImagePreview(null);
                }}
                className="w-full py-2 bg-slate-700 hover:bg-slate-600 rounded-lg mt-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
