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
  FiClock,
  FiMapPin,
  FiCheckCircle,
  FiXCircle,
  FiStar,
} from "react-icons/fi";
import { FaCar } from "react-icons/fa";

export default function MyJobs() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [activeTab, setActiveTab] = useState("current"); // "current" or "history"
  const [todayJobs, setTodayJobs] = useState(0);
  const [monthCompleted, setMonthCompleted] = useState(0);
  const [loading, setLoading] = useState(false);

  /* LOAD LOGGED-IN EMPLOYEE + JOBS */
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const { data: auth } = await supabase.auth.getUser();
        if (!auth?.user) return;

        setUser(auth.user);

        // Fetch from backend API using new endpoint
        const response = await fetch(`http://localhost:5000/employee/bookings/${auth.user.id}`);
        
        let data = [];
        if (response.ok) {
          const result = await response.json();
          data = result.bookings || [];
          console.log("Fetched bookings from API:", data.length);
        } else {
          console.error("Failed to fetch bookings from backend");
        }

        console.log("Fetched bookings:", data);
        setJobs(data);

        // Calculate today's jobs
        const today = new Date().toISOString().split('T')[0];
        const todayCount = data.filter(job => job.date === today && job.status !== "Completed").length;
        setTodayJobs(todayCount);

        // Calculate completed jobs this month
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        const monthCount = data.filter(job => job.date >= monthStart && job.date <= monthEnd && job.status === "Completed").length;
        setMonthCompleted(monthCount);
      } catch (err) {
        console.error("Error loading jobs:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  /* UPDATE JOB STATUS */
  const updateJobStatus = async (jobId, status) => {
    try {
      // Try backend API first
      const response = await fetch(`http://localhost:5000/bookings/${jobId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes: "" })
      });

      if (response.ok) {
        const result = await response.json();
        setJobs((prev) =>
          prev.map((job) => (job.id === jobId ? { ...job, status, updated_at: new Date().toISOString() } : job))
        );
        // Refresh stats
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        const monthCount = jobs.filter(job => job.date >= monthStart && job.date <= monthEnd && status === "Completed").length;
        setMonthCompleted(monthCount + 1);
      }
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  /* EMPLOYEE MENU */
  const employeeMenu = [
    { name: "Dashboard", icon: <FiHome />, link: "/employee/dashboard" },
    { name: "My Jobs", icon: <FiClipboard />, link: "/employee/jobs" },
    { name: "Earnings", icon: <FiDollarSign />, link: "/employee/earnings" },
    { name: "Ratings", icon: <FiStar />, link: "/employee/ratings" },
    { name: "Cars", icon: <FaCar />, link: "/employee/cars" },
    { name: "Locations", icon: <FiMapPin />, link: "/employee/location" },
  ];

  // Status workflow
  const getNextStatus = (currentStatus) => {
    const workflow = {
      "Pending": "Confirmed",
      "Confirmed": "In Progress",
      "In Progress": "Completed",
    };
    return workflow[currentStatus];
  };

  const statusSteps = ["Pending", "Confirmed", "In Progress", "Completed"];
  const getStatusIndex = (status) => statusSteps.indexOf(status);

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
          <h1 className="text-2xl font-bold">My Jobs</h1>

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

          {/* STATISTICS CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/80 border border-blue-500/30 rounded-xl p-6 shadow-lg">
              <p className="text-slate-400 text-sm font-medium mb-2">Today's Jobs</p>
              <p className="text-4xl font-bold text-blue-400">{todayJobs}</p>
              <p className="text-slate-500 text-xs mt-2">Active assignments for today</p>
            </div>
            <div className="bg-slate-900/80 border border-green-500/30 rounded-xl p-6 shadow-lg">
              <p className="text-slate-400 text-sm font-medium mb-2">Completed This Month</p>
              <p className="text-4xl font-bold text-green-400">{monthCompleted}</p>
              <p className="text-slate-500 text-xs mt-2">Successfully finished jobs</p>
            </div>
          </div>

          {/* TABS */}
          <div className="flex gap-4 border-b border-slate-800 mb-6">
            <button
              onClick={() => setActiveTab("current")}
              className={`px-6 py-3 font-semibold transition-all ${
                activeTab === "current"
                  ? "text-blue-400 border-b-2 border-blue-400"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              Current Jobs ({jobs.filter(j => j.status !== "Completed").length})
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-6 py-3 font-semibold transition-all ${
                activeTab === "history"
                  ? "text-blue-400 border-b-2 border-blue-400"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              Job History ({jobs.filter(j => j.status === "Completed").length})
            </button>
          </div>

          {/* JOBS LIST - CURRENT JOBS TAB */}
          {activeTab === "current" && (
            <>
              {jobs.filter(j => j.status !== "Completed").length === 0 ? (
                <div className="text-center py-20 bg-slate-900/50 rounded-xl border border-slate-700">
                  <FaCar className="text-5xl text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No active jobs assigned.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {jobs
                    .filter(j => j.status !== "Completed")
                    .map((job) => (
                      <div
                        key={job.id}
                        className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-xl hover:bg-slate-800/60 transition"
                      >
                        <div className="flex justify-between items-center mb-3">
                          <h2 className="text-lg font-semibold">{job.customer_name}</h2>
                          <span
                            className={`
                              px-3 py-1 text-xs rounded-full font-medium
                              ${
                                job.status === "Completed"
                                  ? "bg-green-600/25 text-green-300"
                                  : job.status === "In Progress"
                                  ? "bg-yellow-600/25 text-yellow-300"
                                  : job.status === "Rejected"
                                  ? "bg-red-600/25 text-red-300"
                                  : "bg-blue-600/25 text-blue-300"
                              }
                            `}
                          >
                            {job.status}
                          </span>
                        </div>

                        {/* STATUS TIMELINE */}
                        <div className="mb-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                          <div className="flex justify-between items-center">
                            {statusSteps.map((step, idx) => {
                              const currentIdx = getStatusIndex(job.status);
                              const isCompleted = idx < currentIdx;
                              const isCurrent = idx === currentIdx;
                              
                              return (
                                <div key={step} className="flex flex-col items-center flex-1">
                                  <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mb-1 transition ${
                                      isCompleted
                                        ? "bg-green-600 text-white"
                                        : isCurrent
                                        ? "bg-blue-600 text-white ring-2 ring-blue-400"
                                        : "bg-slate-700 text-slate-400"
                                    }`}
                                  >
                                    {idx + 1}
                                  </div>
                                  <p className={`text-xs text-center font-medium ${
                                    isCompleted || isCurrent ? "text-white" : "text-slate-500"
                                  }`}>
                                    {step}
                                  </p>
                                  {idx < statusSteps.length - 1 && (
                                    <div
                                      className={`h-1 w-8 mt-1 ${
                                        isCompleted ? "bg-green-600" : "bg-slate-600"
                                      }`}
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* JOB DETAILS */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300 mb-4">
                          <div className="flex items-center gap-2">
                            <FaCar className="text-blue-400" />
                            {job.car_name}
                          </div>

                          <div className="flex items-center gap-2">
                            <FiClock className="text-slate-400" />
                            {job.slot_time || job.time}
                          </div>

                          <div className="flex items-center gap-2 col-span-2">
                            <FiMapPin className="text-slate-400" />
                            {job.location}
                          </div>

                          <div className="flex items-center gap-2">
                            <FiClipboard className="text-slate-400" />
                            📅 {job.date}
                          </div>
                        </div>

                        {/* SERVICES & ADD-ONS */}
                        {(job.services || job.addons) && (
                          <div className="mb-4 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
                            {job.services && (
                              <p className="text-sm text-slate-300 mb-2">
                                <span className="font-semibold">Services:</span> {Array.isArray(job.services) ? job.services.join(", ") : job.services}
                              </p>
                            )}
                            {job.addons && Object.keys(job.addons).length > 0 && (
                              <p className="text-sm text-slate-300">
                                <span className="font-semibold">Add-ons:</span> {Object.keys(job.addons).join(", ")}
                              </p>
                            )}
                          </div>
                        )}

                        {/* ACTION BUTTONS */}
                        <div className="flex gap-3 flex-wrap">
                          {job.status !== "Completed" && (
                            <button
                              onClick={() => updateJobStatus(job.id, getNextStatus(job.status))}
                              className="flex-1 px-4 py-2 bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 rounded-lg text-sm font-semibold transition shadow-lg"
                            >
                              ✓ {getNextStatus(job.status)}
                            </button>
                          )}

                          {job.status !== "Completed" && job.status !== "Pending" && (
                            <button
                              onClick={() => updateJobStatus(job.id, "Pending")}
                              className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 rounded-lg text-sm font-semibold text-red-300 border border-red-600/30 transition"
                            >
                              Revert
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </>
          )}

          {/* JOBS LIST - HISTORY TAB */}
          {activeTab === "history" && (
            <>
              {jobs.filter(j => j.status === "Completed").length === 0 ? (
                <div className="text-center py-20 bg-slate-900/50 rounded-xl border border-slate-700">
                  <FiCheckCircle className="text-5xl text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No completed jobs yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {jobs
                    .filter(j => j.status === "Completed")
                    .map((job) => (
                      <div
                        key={job.id}
                        className="bg-slate-900/80 border border-green-500/20 rounded-lg p-4 shadow-lg"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-white">{job.customer_name}</h3>
                            <p className="text-sm text-slate-400 flex items-center gap-2 mt-1">
                              <FaCar className="text-blue-400" />
                              {job.car_name}
                            </p>
                          </div>
                          <span className="px-3 py-1 text-xs rounded-full font-medium bg-green-600/25 text-green-300 flex items-center gap-1">
                            <FiCheckCircle /> {job.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-400 mt-3 pt-3 border-t border-slate-700">
                          <div>
                            <p className="text-slate-500">Date</p>
                            <p className="text-slate-200 font-medium">{job.date}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Time</p>
                            <p className="text-slate-200 font-medium">{job.slot_time || job.time}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Location</p>
                            <p className="text-slate-200 font-medium">{job.location}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Amount</p>
                            <p className="text-green-400 font-semibold">₹{job.amount || 0}</p>
                          </div>
                        </div>

                        {(job.services || job.addons) && (
                          <div className="mt-3 p-2 bg-slate-800/30 rounded text-xs text-slate-300 space-y-1">
                            {job.services && (
                              <p><span className="text-slate-400">Services:</span> {Array.isArray(job.services) ? job.services.join(", ") : job.services}</p>
                            )}
                            {job.addons && Object.keys(job.addons).length > 0 && (
                              <p><span className="text-slate-400">Add-ons:</span> {Object.keys(job.addons).join(", ")}</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
