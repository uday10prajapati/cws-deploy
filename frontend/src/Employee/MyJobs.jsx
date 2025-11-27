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
} from "react-icons/fi";
import { FaCar } from "react-icons/fa";

export default function MyJobs() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);

  /* LOAD LOGGED-IN EMPLOYEE + JOBS */
  useEffect(() => {
    const loadData = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) return;

      setUser(auth.user);

      const { data } = await supabase
        .from("bookings")
        .select("*")
        .eq("assigned_to", auth.user.id)
        .order("created_at", { ascending: false });

      setJobs(data || []);
    };

    loadData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  /* UPDATE JOB STATUS */
  const updateJobStatus = async (jobId, status) => {
    await supabase.from("bookings").update({ status }).eq("id", jobId);
    setJobs((prev) =>
      prev.map((job) => (job.id === jobId ? { ...job, status } : job))
    );
  };

  /* EMPLOYEE MENU */
  const employeeMenu = [
    { name: "Dashboard", icon: <FiHome />, link: "/employee/dashboard" },
    { name: "My Jobs", icon: <FiClipboard />, link: "/employee/jobs" },
    { name: "Earnings", icon: <FiDollarSign />, link: "/employee/earnings" },
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

          {/* JOBS LIST */}
          {jobs.length === 0 ? (
            <div className="text-center py-20 bg-slate-900/50 rounded-xl border border-slate-700">
              <FaCar className="text-5xl text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No jobs assigned yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {jobs.map((job) => (
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

                  {/* JOB DETAILS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300 mb-4">
                    <div className="flex items-center gap-2">
                      <FaCar className="text-blue-400" />
                      {job.car_name}
                    </div>

                    <div className="flex items-center gap-2">
                      <FiClock className="text-slate-400" />
                      {job.slot_time}
                    </div>

                    <div className="flex items-center gap-2 col-span-2">
                      <FiMapPin className="text-slate-400" />
                      {job.location}
                    </div>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="flex gap-3 flex-wrap">
                    {job.status === "Pending" && (
                      <>
                        <button
                          onClick={() => updateJobStatus(job.id, "Accepted")}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm"
                        >
                          Accept
                        </button>

                        <button
                          onClick={() => updateJobStatus(job.id, "Rejected")}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {job.status === "Accepted" && (
                      <button
                        onClick={() => updateJobStatus(job.id, "In Progress")}
                        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-sm"
                      >
                        Start Job
                      </button>
                    )}

                    {job.status === "In Progress" && (
                      <button
                        onClick={() => updateJobStatus(job.id, "Completed")}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm flex items-center gap-2"
                      >
                        <FiCheckCircle /> Complete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
