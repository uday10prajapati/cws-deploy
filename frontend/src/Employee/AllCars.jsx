import React, { useState, useEffect } from "react";
import { FiSearch, FiImage, FiMapPin, FiAlertCircle  } from "react-icons/fi";
import { FaCar } from "react-icons/fa";
import { supabase } from "../supabaseClient";
import { useRoleBasedRedirect } from "../utils/roleBasedRedirect";
import NavbarNew from "../components/NavbarNew";


export default function AllCars() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCars, setFilteredCars] = useState([]);
  const [userRole, setUserRole] = useState("");
  const [statistics, setStatistics] = useState({
    total_cars: 0,
    total_bookings: 0,
    completed_bookings: 0,
    user_role: "",
  });
  useRoleBasedRedirect("employee");
  
  useEffect(() => {
    fetchAllCars();
  }, []);

  /**
   * Generate signed URL for car image
   */
  const getSignedImageUrl = async (photoUrl) => {
    if (!photoUrl) return null;
    
    try {
      // If it's already a public URL, try to use it as-is
      if (photoUrl.includes('/storage/v1/object/public/')) {
        return photoUrl;
      }
      
      // Extract bucket and path from URL
      const match = photoUrl.match(/storage\/v1\/object\/(.+?)\/(.+)/);
      if (!match) return photoUrl;
      
      const bucket = match[1];
      const filePath = match[2];
      
      // Generate signed URL valid for 1 hour
      const { data: signedUrl } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, 3600);
      
      return signedUrl?.signedUrl || photoUrl;
    } catch (error) {
      console.error("Error generating signed URL:", error);
      return photoUrl;
    }
  };

  /**
   * SECURE: Fetch all cars with role-based & geographic filtering
   * 
   * Backend enforces:
   * - General: All cars across all cities/talukas
   * - Sub-General: Only cars where customer_city is in assigned cities
   * - HR-General: Only cars where customer_taluko is in assigned talukas
   */
  const fetchAllCars = async () => {
    try {
      setLoading(true);
      setError("");

      // Get JWT token from Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Authentication required");
        setLoading(false);
        return;
      }

      const token = session.access_token;

      // Fetch all cars with role-based filtering from secure endpoint
      const response = await fetch("http://localhost:5000/cars/all-cars/secure", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.error || `HTTP ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        const carsData = result.data || [];
        
        // Calculate statistics
        let totalBookings = 0;
        let completedBookings = 0;
        
        carsData.forEach(car => {
          totalBookings += car.booking_stats?.total_bookings || 0;
          completedBookings += car.booking_stats?.completed || 0;
        });

        // Transform car data with display names
        const enrichedCars = carsData.map(car => ({
          ...car,
          car_name: ` ${car.car_model || ""}`.trim() || "Unknown Car",
          car_display: {
            image: car.car_photo_url || "Unknown",
            model: car.car_model || "Unknown",
            plate: car.car_number_plate || "N/A",
            color: car.car_color || "N/A",
          },
          location: {
            city: car.customer_city || "N/A",
            taluka: car.customer_taluko || "N/A",
          },
          added_by: car.added_by_sales_person?.name || "Unknown",
          added_by_details: car.added_by_sales_person,
        }));

        setCars(enrichedCars);
        setFilteredCars(enrichedCars);
        setUserRole(result.metadata?.user_role || "");
        
        setStatistics({
          total_cars: enrichedCars.length,
          total_bookings: totalBookings,
          completed_bookings: completedBookings,
          user_role: result.metadata?.user_role || "",
        });
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
        car.car_brand?.toLowerCase().includes(term) ||
        car.car_model?.toLowerCase().includes(term) ||
        car.car_number_plate?.toLowerCase().includes(term) ||
        car.customer_name?.toLowerCase().includes(term) ||
        car.customer_phone?.toLowerCase().includes(term) ||
        car.location?.city?.toLowerCase().includes(term) ||
        car.location?.taluka?.toLowerCase().includes(term) ||
        car.added_by?.toLowerCase().includes(term)
    );

    setFilteredCars(filtered);
  };

  /**
   * Get role badge color and label
   */
  const getRoleBadge = (role) => {
    const roles = {
      "general": { color: "bg-red-100 text-red-800", label: "🔓 General" },
      "sub-general": { color: "bg-blue-100 text-blue-800", label: "🔒 Sub-General" },
      "hr-general": { color: "bg-purple-100 text-purple-800", label: "🔐 HR-General" },
    };
    return roles[role] || { color: "bg-gray-100 text-gray-800", label: "Unknown" };
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-slate-100">
      <NavbarNew />
      <div className="pt-20 px-4 md:px-8 py-12">
        <div className="max-w-7xl mx-auto">
          {/* HEADER */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-3 leading-tight">All Customer Cars</h1>
            <p className="text-slate-600 text-base">Browse all registered customer vehicles with role-based filtering</p>
          </div>

          {/* ERROR MESSAGE */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center gap-2">
              <FiAlertCircle size={20} />
              {error}
            </div>
          )}

          {/* STATISTICS CARDS
          {!loading && cars.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
                <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Total Cars</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{statistics.total_cars}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
                <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Total Bookings</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{statistics.total_bookings}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
                <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Completed</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{statistics.completed_bookings}</p>
              </div>
              <div className={`bg-white rounded-lg shadow p-4 border-l-4 ${getRoleBadge(userRole).color.split(' ')[0]} text-${getRoleBadge(userRole).color.split(' ')[1]}`}>
                <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Your Role</p>
                <p className="text-lg font-bold mt-2">{getRoleBadge(userRole).label}</p>
              </div>
            </div>
          )} */}

          {/* SEARCH BAR */}
          <div className="relative mb-6">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
            <input
              type="text"
              placeholder="Search by car name, plate, brand, model, customer name, city, taluka, or sales person..."
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
                      {car.car_photo_url ? (
                        <img
                          src={car.car_photo_url}
                          alt={`${car.car_model}`}
                          className="w-full h-full object-cover"
                          crossOrigin="anonymous"
                          onError={(e) => {
                            console.error("Image failed to load:", car.car_photo_url);
                            e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23e5e7eb' width='100' height='100'/%3E%3Ctext x='50' y='50' text-anchor='middle' dy='.3em' fill='%239ca3af' font-size='12'%3ENo image%3C/text%3E%3C/svg%3E";
                          }}
                          onLoad={() => console.log("✅ Image loaded successfully:", car.car_photo_url)}
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
                        {car.car_display?.brand} {car.car_display?.model}
                      </h3>
                      <p className="text-sm text-gray-600 mb-1">
                        Plate: <span className="font-mono font-bold text-blue-600">{car.car_display?.plate}</span>
                      </p>
                      <p className="text-sm text-gray-600 mb-3">
                        Owner: <span className="font-semibold text-slate-700">{car.customer_name}</span>
                      </p>

                      {/* STATS GRID
                      <div className="grid grid-cols-2 gap-2 mb-3 p-3 bg-gray-50 rounded">
                        <div>
                          <p className="text-xs text-gray-500">Total Bookings</p>
                          <p className="font-bold text-blue-600">{car.booking_stats?.total_bookings || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Completed</p>
                          <p className="font-bold text-green-600">{car.booking_stats?.completed || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">In Progress</p>
                          <p className="font-bold text-yellow-600">{car.booking_stats?.in_progress || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Pending</p>
                          <p className="font-bold text-orange-600">{car.booking_stats?.pending || 0}</p>
                        </div>
                      </div> */}

                      {/* LOCATION */}
                      <div className="mb-3 flex items-start gap-2 text-sm">
                        <FiMapPin className="text-blue-600 mt-0.5 shrink-0" size={16} />
                        <div>
                          <p className="font-semibold text-gray-700">{car.location?.city}</p>
                          <p className="text-xs text-gray-600">{car.location?.taluka}</p>
                        </div>
                      </div>

                      {/* ADDED BY */}
                      <div className="mb-3 p-2 bg-blue-50 rounded-lg border border-blue-100">
                        <p className="text-[10px] text-gray-600 uppercase tracking-wide font-semibold">Added By</p>
                        <p className="text-sm font-semibold text-blue-700 mt-1">{car.added_by}</p>
                        {car.added_by_details?.email && (
                          <p className="text-xs text-gray-600">{car.added_by_details.email}</p>
                        )}
                      </div>

                      {/* DATE ADDED */}
                      <div className="text-xs text-gray-500 border-t pt-2">
                        Added: <span className="font-semibold text-gray-700">
                          {car.created_at 
                            ? new Date(car.created_at).toLocaleDateString() 
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* INFO TEXT */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Showing:</span> {filteredCars.length} of {cars.length} cars
                  {userRole === "general" && " (All cities & talukas)"}
                  {userRole === "sub-general" && " (Assigned cities only)"}
                  {userRole === "hr-general" && " (Assigned talukas only)"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
