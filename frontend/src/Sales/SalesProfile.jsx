import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { useRoleBasedRedirect } from "../utils/roleBasedRedirect";
import AddressManager from "../components/AddressManager";
import {
  FiMenu,
  FiChevronLeft,
  FiLogOut,
  FiHome,
  FiMapPin,
  FiUser,
  FiMail,
  FiPhone,
} from "react-icons/fi";

const SalesProfile = () => {
  useRoleBasedRedirect("sales");
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) {
        navigate("/login");
        return;
      }

      setUser(authUser);

      // Load profile
      const profileRes = await fetch(
        `http://localhost:5000/profile/profile/${authUser.id}`
      );
      const profileData = await profileRes.json();
      if (profileData.success) {
        setProfile(profileData.profile);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const salesMenu = [
    { name: "Dashboard", icon: <FiHome />, link: "/sales-dashboard" },
    { name: "Documents", icon: <span>📄</span>, link: "/sales/documents" },
    { name: "Profile", icon: <FiUser />, link: "/sales/profile" },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-blue-950 text-white flex">
      {/* ▓▓▓ SIDEBAR ▓▓▓ */}
      <div
        className={`fixed lg:relative top-0 left-0 h-screen bg-slate-900 border-r border-slate-800 transition-all duration-300 z-50 ${
          collapsed ? "w-20" : "w-64"
        } ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          {!collapsed && (
            <h2 className="text-xl font-bold text-blue-400">CarWash+</h2>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="lg:flex hidden p-2 hover:bg-slate-800 rounded-lg transition"
          >
            <FiChevronLeft
              className={`transition-transform ${collapsed ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        {/* Menu */}
        <nav className="p-4 space-y-2">
          {salesMenu.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                navigate(item.link);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                window.location.pathname === item.link
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {!collapsed && <span>{item.name}</span>}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={() => {
              localStorage.removeItem("userDetails");
              localStorage.removeItem("userId");
              localStorage.removeItem("userRole");
              supabase.auth.signOut();
              navigate("/login");
            }}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition"
          >
            <FiLogOut className="text-xl" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* ▓▓▓ MOBILE TOP BAR ▓▓▓ */}
      <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 py-4 shadow-lg flex items-center justify-between fixed top-0 left-0 right-0 z-40">
        <h1 className="text-xl font-bold bg-linear-to-r from-blue-400 to-blue-600 text-transparent bg-clip-text">
          Profile
        </h1>
        <FiMenu
          className="text-2xl text-white cursor-pointer hover:text-blue-400"
          onClick={() => setSidebarOpen(true)}
        />
      </div>

      {/* ▓▓▓ BACKDROP ▓▓▓ */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ▓▓▓ MAIN CONTENT ▓▓▓ */}
      <div className="flex-1 flex flex-col overflow-auto lg:mt-0 mt-16">
        <div className="p-6 md:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">👤 My Profile</h1>
            <p className="text-slate-400">
              Manage your personal information and address
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Info */}
              <div className="lg:col-span-1">
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                  <h2 className="text-xl font-bold mb-4">Profile Information</h2>

                  <div className="space-y-4">
                    <div>
                      <p className="text-slate-400 text-sm mb-1">First Name</p>
                      <p className="text-white font-semibold">
                        {profile?.first_name || "N/A"}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-400 text-sm mb-1">Last Name</p>
                      <p className="text-white font-semibold">
                        {profile?.last_name || "N/A"}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-400 text-sm mb-1 flex items-center gap-2">
                        <FiMail /> Email
                      </p>
                      <p className="text-white font-semibold break-all">
                        {profile?.email || "N/A"}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-400 text-sm mb-1 flex items-center gap-2">
                        <FiPhone /> Phone
                      </p>
                      <p className="text-white font-semibold">
                        {profile?.phone || "N/A"}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-400 text-sm mb-1">Role</p>
                      <p className="text-white font-semibold capitalize">
                        {profile?.role || "N/A"}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-400 text-sm mb-1">Account Created</p>
                      <p className="text-white font-semibold">
                        {profile?.created_at
                          ? new Date(profile.created_at).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Address Section */}
              <div className="lg:col-span-2">
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <FiMapPin /> Address Information
                  </h2>

                  {user && <AddressManager userId={user.id} />}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesProfile;
