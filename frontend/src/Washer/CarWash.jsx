import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Plus,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Gift,
  Activity,
  Star,
  Target,
  ArrowRight,
  Camera,
  X,
} from "lucide-react";
import { FiHome, FiUsers } from "react-icons/fi";
import { supabase } from "../supabaseClient";
import { useRoleBasedRedirect } from "../utils/roleBasedRedirect";
import NavbarNew from "../components/NavbarNew";

const CarWash = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  /* 🔥 USE ROLE-BASED REDIRECT HOOK */
  useRoleBasedRedirect("employee");

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const [stats, setStats] = useState({
    today: { total: 0, completed: 0, pending: 0, cancelled: 0 },
    month: { total: 0, completed: 0, pending: 0, cancelled: 0 },
  });

  const [washes, setWashes] = useState([]);
  const [filteredWashes, setFilteredWashes] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState("today");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(false);
  const [videoStream, setVideoStream] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState(null);
  const videoRef = React.useRef(null);
  const canvasRef = React.useRef(null);

  const [formData, setFormData] = useState({
    carOwnerName: "",
    carModel: "",
    carNumber: "",
    carColor: "",
    notes: "",
  });

  const employeeId = localStorage.getItem("userId");

  // Load initial data
  useEffect(() => {
    if (employeeId) {
      fetchStats();
      fetchTodayWashes();
      loadUserDetails();
    }
  }, [employeeId]);

  const loadUserDetails = async () => {
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (auth?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", auth.user.id)
          .single();
        setUserDetails(profile);
      }
    } catch (err) {
      console.error("Error loading user details:", err);
    }
  };

  // Apply filters
  useEffect(() => {
    if (filterStatus === "all") {
      setFilteredWashes(washes);
    } else {
      setFilteredWashes(washes.filter((w) => w.status === filterStatus));
    }
  }, [washes, filterStatus]);

  // Fetch on view mode change
  useEffect(() => {
    if (viewMode === "today") {
      fetchTodayWashes();
    } else {
      fetchMonthlyWashes();
    }
  }, [viewMode, selectedMonth, selectedYear]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`http://localhost:5000/car-wash/stats/${employeeId}`);
      const data = await res.json();
      if (data.success) {
        setStats({ today: data.today, month: data.month });
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const fetchTodayWashes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/car-wash/today/${employeeId}`);
      const data = await res.json();
      if (data.success) {
        setWashes(data.washes);
      }
    } catch (err) {
      console.error("Error fetching today's washes:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyWashes = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:5000/car-wash/monthly/${employeeId}?month=${selectedMonth}&year=${selectedYear}`
      );
      const data = await res.json();
      if (data.success) {
        setWashes(data.washes);
      }
    } catch (err) {
      console.error("Error fetching monthly washes:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.carOwnerName || !formData.carNumber) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/car-wash/add-wash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          carOwnerName: formData.carOwnerName,
          carModel: formData.carModel,
          carNumber: formData.carNumber.toUpperCase(),
          carColor: formData.carColor,
          notes: formData.notes,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setFormData({ carOwnerName: "", carModel: "", carNumber: "", carColor: "", notes: "" });
        setShowAddForm(false);
        fetchTodayWashes();
        fetchStats();
        alert("Car wash record added successfully!");
      } else {
        alert(data.error || "Error adding record");
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Failed to add car wash record");
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await fetch(`http://localhost:5000/car-wash/update-status/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (data.success) {
        if (viewMode === "today") {
          fetchTodayWashes();
        } else {
          fetchMonthlyWashes();
        }
        fetchStats();
      } else {
        alert(data.error || "Error updating status");
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;

    try {
      const res = await fetch(`http://localhost:5000/car-wash/delete/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        if (viewMode === "today") {
          fetchTodayWashes();
        } else {
          fetchMonthlyWashes();
        }
        fetchStats();
      } else {
        alert(data.error || "Error deleting record");
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Failed to delete record");
    }
  };

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    washed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  const handleLogout = async () => {
    localStorage.removeItem("userDetails");
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
    await supabase.auth.signOut();
    navigate("/login");
  };

  const employeeMenu = [
    { name: "Dashboard", icon: <FiHome />, link: "/carwash" },
    { name: "My Jobs", icon: <span>💼</span>, link: "/washer/jobs" },
    { name: "Documents", icon: <span>📄</span>, link: "/washer/documents" },
    { name: "Demo Videos", icon: <span>🎬</span>, link: "/washer/demo-videos" },
    { name: "Profile", icon: <FiUsers />, link: "/profile" },
  ];

  // Open Camera
  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setVideoStream(stream);
      setIsScanning(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Unable to access camera. Please check permissions.");
    }
  };

  // Close Camera
  const closeCamera = () => {
    if (videoStream) {
      videoStream.getTracks().forEach((track) => track.stop());
      setVideoStream(null);
    }
    setIsScanning(false);
    setScannedCode(null);
    setShowQRScanner(false);
  };

  // Scan QR Code (Auto-scan)
  useEffect(() => {
    if (!videoStream || !isScanning || !videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const video = videoRef.current;

    const scan = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        try {
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          let darkPixels = 0;
          
          // Count dark pixels (QR code indicators)
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            if (r < 100 && g < 100 && b < 100) {
              darkPixels++;
            }
          }

          // If enough dark pixels detected, treat as QR code
          if (darkPixels > (canvas.width * canvas.height * 0.2)) {
            const mockQRCode = "CUST_" + Math.random().toString(36).substr(2, 5).toUpperCase() + "_CAR_ABC1234";
            setScannedCode(mockQRCode);
            setIsScanning(false);
            
            // Stop camera and show success
            if (videoStream) {
              videoStream.getTracks().forEach((track) => track.stop());
              setVideoStream(null);
            }
          } else if (isScanning) {
            requestAnimationFrame(scan);
          }
        } catch (err) {
          if (isScanning) {
            requestAnimationFrame(scan);
          }
        }
      } else if (isScanning) {
        requestAnimationFrame(scan);
      }
    };

    scan();
  }, [videoStream, isScanning]);

  // Open QR Scanner
  const handleOpenQRScanner = () => {
    setShowQRScanner(true);
    setTimeout(() => {
      openCamera();
    }, 100);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <NavbarNew />

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8 bg-linear-to-r from-blue-600 to-blue-500 rounded-lg p-8 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Welcome back, {userDetails?.name || "Washer"}! 👋</h1>
              <p className="text-blue-100">Let's make it a productive day! Start scanning customer QR codes to complete car washes.</p>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <Activity size={48} className="text-blue-200" />
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Car Wash (Today) */}
          <div className="bg-linear-to-br from-blue-50 to-white border-2 border-blue-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-all hover:border-blue-400">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-600 text-sm font-medium">Total Car Wash</p>
              <CheckCircle size={20} className="text-blue-600" />
            </div>
            <p className="text-4xl font-bold text-slate-900 mb-1">{stats.today.completed}</p>
            <p className="text-sm text-blue-600 font-semibold">{stats.today.completed} cars washed today</p>
          </div>

          {/* Amount Earned (Today) */}
          <div className="bg-linear-to-br from-green-50 to-white border-2 border-green-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-all hover:border-green-400">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-600 text-sm font-medium">Amount Earned</p>
              <TrendingUp size={20} className="text-green-600" />
            </div>
            <p className="text-4xl font-bold text-green-600 mb-1">₹{stats.today.completed * 25}</p>
            <p className="text-sm text-green-600 font-semibold">₹25 per wash</p>
          </div>

          {/* This Month */}
          <div className="bg-linear-to-br from-purple-50 to-white border-2 border-purple-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-all hover:border-purple-400">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-600 text-sm font-medium">This Month</p>
              <Target size={20} className="text-purple-600" />
            </div>
            <p className="text-4xl font-bold text-slate-900 mb-1">{stats.month.total}</p>
            <p className="text-sm text-purple-600 font-semibold">{stats.month.completed} completed</p>
          </div>

          {/* Pending Tasks */}
          <div className="bg-linear-to-br from-yellow-50 to-white border-2 border-yellow-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-all hover:border-yellow-400">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-600 text-sm font-medium">Pending</p>
              <Clock size={20} className="text-yellow-600" />
            </div>
            <p className="text-4xl font-bold text-slate-900 mb-1">{stats.today.pending}</p>
            <p className="text-sm text-yellow-600 font-semibold">Awaiting completion</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Start Washing */}
          <button
            onClick={() => navigate("/washer/workflow")}
            className="bg-linear-to-br from-green-50 to-white border-2 border-green-200 hover:border-green-400 rounded-lg p-6 shadow-sm hover:shadow-md transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">Start New Wash</h3>
              <div className="bg-green-100 group-hover:bg-green-200 p-3 rounded-lg transition-colors">
                <Plus size={24} className="text-green-600" />
              </div>
            </div>
            <p className="text-slate-600 text-sm">Scan a QR code and complete a wash with image uploads</p>
            <div className="mt-4 inline-flex items-center gap-2 text-green-600 font-semibold">
              Start Now <ArrowRight size={16} />
            </div>
          </button>

          {/* View All Jobs */}
          {/* <button
            onClick={() => navigate("/washer/jobs")}
            className="bg-linear-to-br from-blue-50 to-white border-2 border-blue-200 hover:border-blue-400 rounded-lg p-6 shadow-sm hover:shadow-md transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">My Jobs</h3>
              <div className="bg-blue-100 group-hover:bg-blue-200 p-3 rounded-lg transition-colors">
                <CheckCircle size={24} className="text-blue-600" />
              </div>
            </div>
            <p className="text-slate-600 text-sm">View all assigned jobs and bookings</p>
            <div className="mt-4 inline-flex items-center gap-2 text-blue-600 font-semibold">
              View Jobs <ArrowRight size={16} />
            </div>
          </button> */}

          {/* Wash History */}
          <button
            onClick={() => navigate("/washer/wash-history")}
            className="bg-linear-to-br from-purple-50 to-white border-2 border-purple-200 hover:border-purple-400 rounded-lg p-6 shadow-sm hover:shadow-md transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">Wash History</h3>
              <div className="bg-purple-100 group-hover:bg-purple-200 p-3 rounded-lg transition-colors">
                <Activity size={24} className="text-purple-600" />
              </div>
            </div>
            <p className="text-slate-600 text-sm">View all completed washes and earnings</p>
            <div className="mt-4 inline-flex items-center gap-2 text-purple-600 font-semibold">
              View History <ArrowRight size={16} />
            </div>
          </button>
        </div>

        {/* Performance Summary */}
        <div className="bg-linear-to-br from-blue-50 to-white border-2 border-blue-200 rounded-lg p-6 shadow-sm mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Today's Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Completion Rate */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Star size={20} className="text-yellow-600" />
                <p className="font-semibold text-slate-700">Completion Rate</p>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 mb-2">
                <div
                  className="bg-green-600 h-3 rounded-full transition-all"
                  style={{
                    width: stats.today.total > 0
                      ? `${(stats.today.completed / stats.today.total) * 100}%`
                      : "0%",
                  }}
                ></div>
              </div>
              <p className="text-sm text-slate-600">
                {stats.today.total > 0
                  ? `${Math.round((stats.today.completed / stats.today.total) * 100)}%`
                  : "0%"} complete
              </p>
            </div>

            {/* Average Rating */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Star size={20} className="text-orange-600" />
                <p className="font-semibold text-slate-700">Average Rating</p>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    size={20}
                    className={i <= 4 ? "text-orange-400 fill-orange-400" : "text-slate-300"}
                  />
                ))}
              </div>
              <p className="text-sm text-slate-600 mt-2">4.0 out of 5.0</p>
            </div>

            {/* Earnings Today */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Gift size={20} className="text-purple-600" />
                <p className="font-semibold text-slate-700">Loyalty Earned</p>
              </div>
              <p className="text-3xl font-bold text-purple-600 mb-1">
                +{stats.today.completed * 10}
              </p>
              <p className="text-sm text-slate-600">{stats.today.completed * 10} points today</p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        {/* <div className="bg-linear-to-br from-blue-50 to-white border-2 border-blue-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Recent Washes</h2>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-slate-500">Loading recent washes...</p>
            </div>
          ) : filteredWashes.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle size={32} className="mx-auto text-slate-400 mb-3" />
              <p className="text-slate-500">No washes completed yet today</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredWashes.slice(0, 5).map((wash) => (
                <div key={wash.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200 hover:border-blue-300 transition-colors">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{wash.car_owner_name}</p>
                    <p className="text-sm text-slate-600">
                      Car: <span className="font-mono font-bold text-blue-600">{wash.car_number}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-600">
                      {new Date(wash.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <span
                      className={`inline-block px-3 py-1 rounded-lg text-xs font-semibold ${
                        wash.status === "washed"
                          ? "bg-green-100 text-green-800"
                          : wash.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {wash.status === "washed" ? "Completed" : wash.status === "pending" ? "Pending" : "Cancelled"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div> */}
      </main>

      {/* QR SCANNER MODAL */}
      {showQRScanner && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-blue-200">
              <h2 className="text-2xl font-bold text-slate-900">
                {scannedCode ? "QR Scanned" : "Scan QR Code"}
              </h2>
              <button
                onClick={closeCamera}
                className="p-2 hover:bg-red-100 rounded-lg transition-colors"
              >
                <X size={24} className="text-red-600" />
              </button>
            </div>

            {/* Camera or Scanned Result */}
            <div className="p-6">
              {scannedCode ? (
                // Show scanned QR result
                <div className="space-y-4 text-center py-8">
                  <div className="bg-green-100 p-4 rounded-lg mb-4">
                    <CheckCircle size={48} className="mx-auto text-green-600 mb-3" />
                    <p className="text-lg font-bold text-green-800">QR Code Detected!</p>
                  </div>
                  <div className="bg-slate-100 p-4 rounded-lg mb-4">
                    <p className="text-sm text-slate-600 mb-2">Scanned Code:</p>
                    <p className="font-mono font-bold text-slate-900 break-all">{scannedCode}</p>
                  </div>
                  <button
                    onClick={() => navigate("/washer/workflow")}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    Go to Workflow <ArrowRight size={20} />
                  </button>
                  <button
                    onClick={closeCamera}
                    className="w-full bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold py-3 rounded-lg transition-colors"
                  >
                    Scan Another
                  </button>
                </div>
              ) : videoStream ? (
                // Show camera feed
                <div className="space-y-4">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full rounded-lg border-2 border-blue-300"
                    style={{ aspectRatio: "4/5" }}
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="flex items-center justify-center gap-2 py-4">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <p className="text-center text-sm text-slate-600 font-semibold">
                      Scanning... Point camera at QR code
                    </p>
                  </div>
                </div>
              ) : (
                // Loading state
                <div className="space-y-4 text-center">
                  <div className="py-8">
                    <Camera size={48} className="mx-auto text-blue-600 mb-4" />
                    <p className="text-slate-600">Opening camera...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarWash;
