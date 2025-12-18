import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Link, useLocation } from "react-router-dom";
import { useRoleBasedRedirect } from "../utils/roleBasedRedirect";
import NavbarNew from "../components/NavbarNew";
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
  FiSettings,
  FiAlertCircle ,
  FiGift,
  
} from "react-icons/fi";
import { FaCar } from "react-icons/fa";

export default function MyCars() {
  const location = useLocation();

    useRoleBasedRedirect("customer");

  const [user, setUser] = useState(null);
  const [cars, setCars] = useState([]);
  const [carPasses, setCarPasses] = useState({}); // Map of car_id -> active pass

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
    { name: "Dashboard", icon: <FiHome />, link: "/customer-dashboard" },
        { name: "My Bookings", icon: <FiClipboard />, link: "/bookings" },
        { name: "My Cars", icon: <FaCar />, link: "/my-cars" },
        { name: "Monthly Pass", icon: <FiAward />, link: "/monthly-pass" },
        { name: "Profile", icon: <FiUser />, link: "/profile" },
        { name: "Location", icon: <FiMapPin />, link: "/location" },
        { name: "Transactions", icon: <FiCreditCard />, link: "/transactions" },
        { name: "Account Settings", icon: <FiSettings />, link: "/account-settings" },
        { name: "Emergency Wash", icon: <FiAlertCircle />, link: "/emergency-wash" },
        { name: "About Us", icon: <FiGift />, link: "/about-us" },
  ];

  /** Load user + cars + passes for each car */
  useEffect(() => {
    const load = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) return;

      setUser(auth.user);

      try {
        const response = await fetch(`http://localhost:5000/cars/${auth.user.id}`);
        const result = await response.json();
        if (result.success) {
          const carList = result.data || [];
          setCars(carList);

          // Load active pass for each car
          const passesMap = {};
          for (const car of carList) {
            try {
              const passResponse = await fetch(
                `http://localhost:5000/pass/car/${auth.user.id}/${car.id}`
              );
              const passResult = await passResponse.json();
              if (passResult.success && passResult.data) {
                passesMap[car.id] = passResult.data;
              }
            } catch (err) {
              console.error(`Error loading pass for car ${car.id}:`, err);
            }
          }
          setCarPasses(passesMap);
        }
      } catch (err) {
        console.error("Error loading cars:", err);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* NAVBAR (same as dashboard) */}
      <NavbarNew />

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-10 space-y-8">
        {/* Heading + CTA */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/40">
                <FaCar />
              </span>
              <span>My Cars</span>
            </h1>
            <p className="text-slate-600 text-sm md:text-base mt-2 max-w-xl">
              Manage all your saved vehicles. Add, view and link passes to your cars for faster bookings.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setModalOpen(true)}
              className="px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center gap-2 text-sm"
            >
              <FiPlus /> Add Car
            </button>
            <Link
              to="/bookings"
              className="px-5 py-3 bg-white border border-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-50 hover:shadow-md transition-all duration-300 flex items-center gap-2 text-sm"
            >
              <FiClipboard /> View Bookings
            </Link>
          </div>
        </div>

        {/* Empty state or car grid */}
        {cars.length === 0 ? (
          <div className="bg-white/80 border border-dashed border-slate-300 rounded-2xl p-10 text-center shadow-sm">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 text-blue-500 mb-4">
              <FaCar className="text-2xl" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">No cars added yet</h2>
            <p className="text-slate-600 text-sm mb-4">
              Add your first car to make bookings even faster and track passes per vehicle.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-lg hover:shadow-md hover:scale-105 transition-all duration-300 inline-flex items-center gap-2"
            >
              <FiPlus /> Add Car
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {cars.map((car) => (
              <div
                key={car.id}
                className="rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-md hover:shadow-xl hover:border-blue-300 transition-all duration-300"
              >
                {/* Car Image */}
                <div className="relative bg-slate-100">
                  {car.image_url ? (
                    <img
                      src={car.image_url}
                      alt={`${car.brand} ${car.model}`}
                      className="w-full h-44 object-cover"
                      onError={(e) => {
                        e.target.src =
                          "https://dummyimage.com/600x400/e5e7eb/020617&text=Car";
                      }}
                    />
                  ) : (
                    <div className="w-full h-44 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                      <FaCar className="text-5xl text-slate-400 opacity-70" />
                    </div>
                  )}

                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/90 text-[11px] font-semibold text-slate-700 border border-slate-200">
                    #{car.id?.slice?.(0, 6) || "CAR"}
                  </div>
                </div>

                {/* CONTENT */}
                <div className="p-5 space-y-4">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        {car.brand} {car.model}
                      </h2>
                      <p className="text-sm text-slate-500 mt-1">
                        {car.number_plate}
                      </p>
                    </div>

                    <span className="px-3 py-1 text-xs rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                      My Car
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wide">
                        Brand
                      </p>
                      <p className="text-sm font-semibold text-slate-900">
                        {car.brand}
                      </p>
                    </div>

                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wide">
                        Model
                      </p>
                      <p className="text-sm font-semibold text-slate-900">
                        {car.model}
                      </p>
                    </div>

                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wide">
                        Plate
                      </p>
                      <p className="text-sm font-semibold text-slate-900">
                        {car.number_plate}
                      </p>
                    </div>
                  </div>

                  {/* Active Pass Section */}
                  <div className="mt-2 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                    <p className="text-[10px] text-slate-600 uppercase tracking-wide">
                      Active Pass
                    </p>
                    {carPasses[car.id] && carPasses[car.id].active ? (
                      <div className="mt-1 space-y-1">
                        <p className="text-sm font-semibold text-emerald-600">
                          ✓ Monthly Pass • {carPasses[car.id].remaining_washes}/
                          {carPasses[car.id].total_washes} washes
                        </p>
                        <p className="text-xs text-slate-600">
                          Valid till:{" "}
                          {new Date(
                            carPasses[car.id].valid_till
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm font-semibold text-amber-600 mt-1">
                        No Active Pass
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => deleteCar(car.id)}
                    className="w-full mt-3 py-2.5 bg-red-500 hover:bg-red-600 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold text-white shadow-sm hover:shadow-md transition-all"
                  >
                    <FiTrash /> Delete Car
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ADD CAR MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-semibold mb-4 text-slate-900">
              Add a New Car
            </h3>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Brand"
                className="w-full p-3 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />

              <input
                type="text"
                placeholder="Model"
                className="w-full p-3 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              />

              <input
                type="text"
                placeholder="Number Plate (e.g., MH12AB1234)"
                className="w-full p-3 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={numberPlate}
                onChange={(e) => setNumberPlate(e.target.value)}
              />

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-800">
                  Car Image (optional)
                </label>
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
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                />
                {imagePreview && (
                  <div className="mt-3 relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-lg border border-slate-300"
                    />
                    <p className="text-xs text-slate-500 mt-1">✅ Image selected</p>
                  </div>
                )}
              </div>

              <button
                onClick={handleAddCar}
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg font-semibold flex items-center justify-center gap-2 text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg mt-2 text-sm font-medium"
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
