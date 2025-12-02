import React, { useState, useEffect } from "react";
import { FiSearch, FiImage, FiMapPin } from "react-icons/fi";
import { FaCar } from "react-icons/fa";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import supabase from "../supabaseClient";

export default function AllCars() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCars, setFilteredCars] = useState([]);

  useEffect(() => {
    fetchAllCars();
  }, []);

  const fetchAllCars = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch all customer cars from backend
      const response = await fetch("http://localhost:5000/cars");
      const result = await response.json();

      if (result.success) {
        const carsData = result.cars || [];
        
        // Fetch booking stats for each car
        const carIds = carsData.map(c => c.id);
        const { data: bookingsData } = await supabase
          .from("bookings")
          .select("id, car_id, status, amount, date, location")
          .in("car_id", carIds);

        // Fetch monthly pass for each car's customer
        const passMap = {};
        for (const car of carsData) {
          try {
            const passResponse = await fetch(`http://localhost:5000/pass/current/${car.customer_id}`);
            const passResult = await passResponse.json();
            if (passResult.success && passResult.data) {
              passMap[car.id] = passResult.data;
            }
          } catch (err) {
            console.error(`Error fetching pass for car ${car.id}:`, err);
          }
        }

        // Enrich car data with booking info
        const enrichedCars = carsData.map(car => {
          const carBookings = (bookingsData || []).filter(b => b.car_id === car.id);
          return {
            ...car,
            car_name: `${car.brand} ${car.model}`.trim() || "Unknown Car",
            total_bookings: carBookings.length,
            completed_bookings: carBookings.filter(b => b.status === "Completed").length,
            pending_bookings: carBookings.filter(b => b.status === "Pending").length,
            in_progress: carBookings.filter(b => b.status === "In Progress").length,
            total_revenue: carBookings.reduce((sum, b) => sum + (b.amount || 0), 0),
            last_service: carBookings.length > 0 ? carBookings[0].date : null,
            locations: [...new Set(carBookings.map(b => b.location).filter(Boolean))],
            monthlyPass: passMap[car.id] || null,
          };
        });

        setCars(enrichedCars);
        setFilteredCars(enrichedCars);
      } else {
        setError(result.error || "Failed to fetch cars");
      }
    } catch (err) {
      console.error("Error fetching cars:", err);
      setError("Error fetching cars: " + err.message);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex-1">
        <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="p-8 mt-20">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">All Customer Cars</h1>
            <p className="text-gray-600 mt-1">Browse and view all registered customer vehicles</p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* SEARCH BAR */}
          <div className="relative mb-6">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
            <input
              type="text"
              placeholder="Search by car name, plate, brand, model, or location..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full bg-white border border-gray-300 rounded-lg pl-12 pr-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
            />
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredCars.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <FaCar className="text-5xl text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm ? "No cars found matching your search." : "No cars registered yet."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* GRID VIEW */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCars.map((car) => (
                  <div
                    key={car.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {/* CAR IMAGE */}
                    <div className="h-48 bg-gray-200 flex items-center justify-center overflow-hidden">
                      {car.image_url ? (
                        <img
                          src={car.image_url}
                          alt={`${car.brand} ${car.model}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-gray-400">
                          <FiImage size={40} />
                          <span className="text-sm">No image</span>
                        </div>
                      )}
                    </div>

                    {/* CAR DETAILS */}
                    <div className="p-4">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {car.car_name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Number Plate: <span className="font-mono font-bold text-blue-600">{car.number_plate}</span>
                      </p>

                      {/* STATS GRID */}
                      <div className="grid grid-cols-2 gap-2 mb-3 p-3 bg-gray-50 rounded">
                        <div>
                          <p className="text-xs text-gray-500">Total Bookings</p>
                          <p className="font-bold text-blue-600">{car.total_bookings}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Completed</p>
                          <p className="font-bold text-green-600">{car.completed_bookings}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">In Progress</p>
                          <p className="font-bold text-yellow-600">{car.in_progress}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Pending</p>
                          <p className="font-bold text-orange-600">{car.pending_bookings}</p>
                        </div>
                      </div>

                      {/* REVENUE */}
                      <div className="mb-3 p-2 bg-blue-50 rounded text-center">
                        <p className="text-xs text-gray-600">Total Revenue</p>
                        <p className="font-bold text-blue-600 text-lg">₹{car.total_revenue.toLocaleString()}</p>
                      </div>

                      {/* ACTIVE PASS */}
                      <div className="mb-3 p-3 bg-linear-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                        <p className="text-[10px] text-gray-600 uppercase tracking-wide font-semibold">Active Pass</p>
                        {car.monthlyPass && car.monthlyPass.active ? (
                          <div>
                            <p className="text-sm font-semibold text-green-600 mt-1">
                              ✓ Monthly Pass • {car.monthlyPass.remaining_washes}/{car.monthlyPass.total_washes} washes
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              Valid till: {new Date(car.monthlyPass.valid_till).toLocaleDateString()}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm font-semibold text-yellow-600 mt-1">No Active Pass</p>
                        )}
                      </div>

                      {/* LOCATIONS */}
                      {car.locations && car.locations.length > 0 && (
                        <div className="mb-3 flex items-start gap-2 text-sm">
                          <FiMapPin className="text-blue-600 mt-0.5 shrink-0" size={16} />
                          <div className="flex flex-wrap gap-1">
                            {car.locations.slice(0, 2).map((loc, i) => (
                              <span key={i} className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700">
                                {loc}
                              </span>
                            ))}
                            {car.locations.length > 2 && (
                              <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700">
                                +{car.locations.length - 2}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* LAST SERVICE */}
                      <div className="text-xs text-gray-500 border-t pt-2">
                        Last Service: <span className="font-semibold text-gray-700">
                          {car.last_service 
                            ? new Date(car.last_service).toLocaleDateString() 
                            : "No services yet"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* INFO TEXT */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Total Cars:</span> {filteredCars.length} | 
                  <span className="font-semibold ml-4">Total Revenue:</span> ₹{filteredCars.reduce((sum, car) => sum + car.total_revenue, 0).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
