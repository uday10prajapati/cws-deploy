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
  FiAlertCircle,
  FiGift  
} from "react-icons/fi";
import { FaCar, FaUser } from "react-icons/fa";
import { FaStar } from "react-icons/fa"
import { useRoleBasedRedirect } from "../utils/roleBasedRedirect";


export default function Cars() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [cars, setCars] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCars, setFilteredCars] = useState([]);
  const [viewMode, setViewMode] = useState("all"); // "all" or "my-services"
  useRoleBasedRedirect("employee");
  /* LOAD CARS DATA */
  useEffect(() => {
    const loadData = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) return;

      setUser(auth.user);

      try {
        // Fetch ALL cars from backend API
        const response = await fetch("http://localhost:5000/cars");
        const result = await response.json();

        if (!result.success || !result.cars) {
          setCars([]);
          setFilteredCars([]);
          return;
        }

        const allCarsData = result.cars;

        if (allCarsData.length === 0) {
          setCars([]);
          setFilteredCars([]);
          return;
        }

        // Get all car IDs for booking stats
        const carIds = allCarsData.map(c => c.id);

        // Fetch all bookings (not filtered by employee)
        const { data: allBookings } = await supabase
          .from("bookings")
          .select("*");

        // Fetch monthly pass for each car
        const passMap = {};
        for (const car of allCarsData) {
          try {
            const passResponse = await fetch(`http://localhost:5000/pass/car/${car.id}`);
            const passResult = await passResponse.json();
            if (passResult.success && passResult.data) {
              passMap[car.id] = passResult.data;
            }
          } catch (err) {
            console.error(`Error fetching pass for car ${car.id}:`, err);
          }
        }

        // Enrich car data with booking information
        const enrichedCars = allCarsData.map(car => {
          // Get all bookings for this car
          const carBookings = (allBookings || []).filter(b => b.car_id === car.id);
          
          // Get only this employee's services for this car (if assigned_to exists)
          const myServices = carBookings.filter(b => b.assigned_to === auth.user.id);

          return {
            id: car.id,
            car_name: `${car.brand} ${car.model}`.trim() || "Unknown Car",
            brand: car.brand,
            model: car.model,
            number_plate: car.number_plate,
            image_url: car.image_url,
            customer_id: car.customer_id,
            customer_name: car.customer_name,
            customer_phone: car.customer_phone,
            customer_email: car.customer_email,
            // Total stats (all bookings for this car)
            total_services: carBookings.length,
            completed_services: carBookings.filter(b => b.status === "Completed").length,
            last_service: carBookings.length > 0 ? carBookings[0]?.date : null,
            services: [...new Set(carBookings.flatMap(b => Array.isArray(b.services) ? b.services : []))],
            total_amount: carBookings.reduce((sum, b) => sum + (b.amount || 0), 0),
            locations: [...new Set(carBookings.map(b => b.location).filter(Boolean))],
            bookings: carBookings,
            // My services only
            my_services_count: myServices.length,
            my_completed: myServices.filter(b => b.status === "Completed").length,
            my_total_amount: myServices.reduce((sum, b) => sum + (b.amount || 0), 0),
            // Monthly pass
            monthlyPass: passMap[car.id] || null,
          };
        });

        setCars(enrichedCars);
        setFilteredCars(enrichedCars);
      } catch (error) {
        console.error("Error loading cars:", error);
      }
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
    { name: "Dashboard", icon: <FiHome />, link: "/employee-dashboard" },
        { name: "My Jobs", icon: <FiClipboard />, link: "/employee/jobs" },
        { name: "Transaction Status", icon: <FiDollarSign />, link: "/employee/earnings" },
        { name: "Ratings", icon: <FaStar />, link: "/employee/ratings" },
        { name: "Cars", icon: <FaCar />, link: "/employee/cars" },
        { name: "Locations", icon: <FiMapPin />, link: "/employee/location" },
        { name: "Emergency Wash", icon: <FiAlertCircle />, link: "/emergency-wash" },
            { name: "About Us", icon: <FiGift />, link: "/about-us" },
      ];

  return (
    <div>
      <h1>Cars Component</h1>
    </div>
  );
}
