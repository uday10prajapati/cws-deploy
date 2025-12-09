import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import NotificationBell from "../components/NotificationBell";
import AddressManager from "../components/AddressManager";
import CarQRCode from "../components/CarQRCode";
import { useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import { FiUser, FiMail, FiPhone, FiClock, FiCreditCard, FiSettings, FiTrash2, FiLogOut, FiLock, FiMenu, FiChevronLeft, FiHome, FiClipboard, FiBell, FiMapPin } from "react-icons/fi";
import { FaCar } from "react-icons/fa";
import { FiAward } from "react-icons/fi";

const customerMenu = [
  { name: "Dashboard", icon: <FiHome />, link: "/customer-dashboard" },
  { name: "My Bookings", icon: <FiClipboard />, link: "/bookings" },
  { name: "My Cars", icon: <FaCar />, link: "/my-cars" },
  { name: "Monthly Pass", icon: <FiAward />, link: "/monthly-pass" },
  { name: "Profile", icon: <FiUser />, link: "/profile" },
  { name: "Location", icon: <FiMapPin />, link: "/location" },
  { name: "Transactions", icon: <FiCreditCard />, link: "/transactions" },
  { name: "Account Settings", icon: <FiSettings />, link: "/account-settings" },
];

export default function ProfilePage() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  
  const [user, setUser] = useState(null);
  const [cars, setCars] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [monthlyPass, setMonthlyPass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedCarForQR, setSelectedCarForQR] = useState(null);
  const [selectedCarPass, setSelectedCarPass] = useState(null);
  const [userAddress, setUserAddress] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setLoading(true);

    let { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) {
      window.location.href = "/login";
      return;
    }
    setUser(auth.user);
    const uid = auth.user.id;

    try {
      // Load Cars from Supabase
      const { data: carList } = await supabase
        .from("cars")
        .select("*")
        .eq("customer_id", uid);
      setCars(carList || []);

      // Load Bookings from Supabase
      const { data: bookingList } = await supabase
        .from("bookings")
        .select("*")
        .eq("customer_id", uid)
        .order("created_at", { ascending: false });
      setBookings(bookingList || []);

      // Load Transactions from Supabase
      const { data: transactionList } = await supabase
        .from("transactions")
        .select("*")
        .eq("customer_id", uid)
        .order("created_at", { ascending: false });
      setTransactions(transactionList || []);

      // Load Monthly Pass
      const passRes = await fetch(`http://localhost:5000/pass/current/${uid}`);
      const passResult = await passRes.json();
      if (passResult.success && passResult.data) {
        setMonthlyPass(passResult.data);
      }

      // Load Primary Address
      const { data: addressData } = await supabase
        .from("user_addresses")
        .select("*")
        .eq("user_id", uid)
        .eq("is_primary", true)
        .maybeSingle();
      
      if (addressData) {
        setUserAddress(addressData);
      }
    } catch (err) {
      console.error("Error loading user data:", err);
    }

    setLoading(false);
  };

  const handleOpenQRCode = async (car) => {
    setSelectedCarForQR(car);
    
    // Fetch pass for this specific car if available
    try {
      const passRes = await fetch(`http://localhost:5000/pass/car/${user.id}/${car.id}`);
      const passResult = await passRes.json();
      if (passResult.success && passResult.data) {
        setSelectedCarPass(passResult.data);
      } else {
        setSelectedCarPass(null);
      }
    } catch (err) {
      console.error("Error loading car pass:", err);
      setSelectedCarPass(null);
    }
    
    setShowQRModal(true);
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      alert("Failed to change password: " + error.message);
    } else {
      alert("Password changed successfully!");
      setShowPasswordModal(false);
      setNewPassword("");
    }
  };

  const handleDeleteAccount = async () => {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      alert("Failed to logout");
      return;
    }

    // Note: Full account deletion requires admin privileges
    alert("Account logout successful. Contact support to fully delete your account.");
    window.location.href = "/login";
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p>Please log in to view your profile</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-blue-950 text-white flex">
      {/* ▓▓▓ MOBILE TOP BAR ▓▓▓ */}
      <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 py-4 shadow-lg flex items-center justify-between fixed top-0 left-0 right-0 z-40">
        <h1 className="text-xl font-bold bg-linear-to-r from-blue-400 to-blue-600 text-transparent bg-clip-text">
          CarWash+
        </h1>
        <FiMenu
          className="text-2xl text-white cursor-pointer hover:text-blue-400 transition-colors"
          onClick={() => setSidebarOpen(true)}
        />
      </div>

      {/* ▓▓▓ BACKDROP FOR MOBILE ▓▓▓ */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ▓▓▓ SIDEBAR ▓▓▓ */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-slate-900 border-r border-slate-800 shadow-2xl 
          z-50 transition-all duration-300
          ${collapsed ? "w-16" : "w-56"}
          ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        {/* Logo Row */}
        <div
          className="hidden lg:flex items-center justify-between p-4 border-b border-slate-800 cursor-pointer hover:bg-slate-800"
          onClick={() => setCollapsed(!collapsed)}
        >
          <span className="font-extrabold text-lg">
            {collapsed ? "CW" : "CarWash+"}
          </span>

          {!collapsed && <FiChevronLeft className="text-slate-400" />}
        </div>

        {/* MENU */}
        <nav className="mt-4 px-3 pb-24">
          {customerMenu.map((item) => (
            <Link
              key={item.name}
              to={item.link}
              onClick={() => setSidebarOpen(false)}
              className={`
                flex items-center gap-4 px-3 py-2 rounded-lg 
                mb-2 font-medium transition-all
                ${
                  location.pathname === item.link
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-300 hover:bg-slate-800 hover:text-blue-400"
                }
                ${collapsed ? "justify-center" : ""}
              `}
              title={collapsed ? item.name : ""}
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
            text-white px-4 py-2 font-semibold rounded-lg cursor-pointer 
            flex items-center gap-3 shadow-lg transition-all
            ${collapsed ? "justify-center" : ""}
          `}
          title={collapsed ? "Logout" : ""}
        >
          <FiLogOut className="text-lg" />
          {!collapsed && "Logout"}
        </div>
      </aside>

      {/* ▓▓▓ MAIN CONTENT ▓▓▓ */}
      <div
        className={`flex-1 transition-all duration-300 mt-14 lg:mt-0 ${
          collapsed ? "lg:ml-16" : "lg:ml-56"
        }`}
      >
        {/* ▓▓▓ NAVBAR ▓▓▓ */}
        <header
          className="hidden lg:flex h-16 bg-slate-900/90 border-b border-blue-500/20 
        items-center justify-between px-8 sticky top-0 z-20 shadow-lg"
        >
          <h1 className="text-2xl font-bold">My Profile</h1>

          <div className="flex items-center gap-8">
            <NotificationBell />

            <img
              src={`https://ui-avatars.com/api/?name=${user?.email}&background=3b82f6&color=fff`}
              className="w-10 h-10 rounded-full border-2 border-blue-500 cursor-pointer hover:border-blue-400 transition"
              alt="Profile"
            />
          </div>
        </header>

        {/* ▓▓▓ PAGE CONTENT ▓▓▓ */}
        <main className="p-4 md:p-8 space-y-8">
          {/* PROFILE HEADER */}
          <div className="bg-linear-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/40 rounded-xl p-8 mb-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center">
                <FiUser className="text-3xl" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{user.user_metadata?.name || user.email?.split("@")[0] || "User"}</h1>
                <p className="text-slate-400">{user.email}</p>
              </div>
            </div>

            {/* PERSONAL INFO SUMMARY */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <FiMail className="text-blue-400" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <FiPhone className="text-green-400" />
                <span>{user.user_metadata?.phone || "Not added"}</span>
              </div>
              <div className="flex items-center gap-2">
                <FiClock className="text-yellow-400" />
                <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* ADDRESS MANAGER */}
          <AddressManager userId={user.id} />

          {/* MAIN CONTENT GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* SAVED CARS */}
            <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FaCar className="text-blue-400" /> Saved Cars ({cars.length})
              </h2>

              {cars.length === 0 ? (
                <p className="text-slate-400 text-sm">No cars added yet</p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {cars.map((car) => (
                    <div key={car.id} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold text-blue-300">{car.brand} {car.model || ""}</p>
                          <p className="text-sm text-slate-400">Plate: {car.number_plate}</p>
                          <p className="text-xs text-slate-500 mt-1">{car.color || "Color not specified"}</p>
                        </div>
                        <button
                          onClick={() => handleOpenQRCode(car)}
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-semibold transition"
                          title="Generate QR Code for this car"
                        >
                          🎫 QR Code
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* MONTHLY PASS */}
            <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FiAward className="text-amber-400" /> Monthly Pass
              </h2>

              {monthlyPass ? (
                <div className="bg-linear-to-br from-amber-600/20 to-amber-900/20 border border-amber-500/40 p-4 rounded-lg space-y-3">
                  <div>
                    <p className="text-sm text-slate-400">Plan</p>
                    <p className="text-lg font-semibold text-amber-300">
                      {monthlyPass.total_washes === 4 ? "Basic" :
                       monthlyPass.total_washes === 8 ? "Standard" :
                       monthlyPass.total_washes === 16 ? "Premium" : "Custom"} Plan
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-slate-400">Total Washes</p>
                      <p className="font-semibold">{monthlyPass.total_washes}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Remaining</p>
                      <p className="font-semibold text-green-400">{monthlyPass.remaining_washes}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Valid Till</p>
                    <p className="font-semibold">{monthlyPass.valid_till}</p>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 mt-2">
                    <div
                      className="bg-amber-500 h-2 rounded-full"
                      style={{ width: `${(monthlyPass.remaining_washes / monthlyPass.total_washes) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ) : (
                <div className="text-slate-400 text-sm">
                  <p>No active monthly pass</p>
                  <a href="/monthly-pass" className="text-blue-400 hover:text-blue-300 mt-2 inline-block">
                    Buy a pass →
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* BOOKING HISTORY */}
          <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FiClock className="text-purple-400" /> Booking History ({bookings.length})
            </h2>

            {bookings.length === 0 ? (
              <p className="text-slate-400 text-sm">No bookings yet</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {bookings.map((booking) => (
                  <div key={booking.id} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-purple-300">{booking.car_name}</p>
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                        booking.status === 'completed' ? 'bg-green-600/30 text-green-300' :
                        booking.status === 'in_wash' ? 'bg-blue-600/30 text-blue-300' :
                        booking.status === 'pending' ? 'bg-yellow-600/30 text-yellow-300' :
                        'bg-slate-600/30 text-slate-300'
                      }`}>
                        {booking.status || 'Pending'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 mb-2">
                      📅 {booking.date} at {booking.time} • 📍 {booking.location}
                    </p>
                    <p className="text-sm">
                      Amount: <span className="font-semibold text-blue-300">₹{booking.amount}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PAYMENT HISTORY */}
          <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FiCreditCard className="text-green-400" /> Payment History ({transactions.length})
            </h2>

            {transactions.length === 0 ? (
              <p className="text-slate-400 text-sm">No transactions yet</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {transactions.map((tx) => (
                  <div key={tx.id} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-green-300">₹{tx.amount}</p>
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                        tx.status === 'success' ? 'bg-green-600/30 text-green-300' :
                        tx.status === 'pending' ? 'bg-yellow-600/30 text-yellow-300' :
                        'bg-red-600/30 text-red-300'
                      }`}>
                        {tx.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400">
                      {tx.type} • {tx.payment_method || 'Unknown'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(tx.created_at).toLocaleDateString()} {new Date(tx.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SETTINGS */}
          <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FiSettings className="text-cyan-400" /> Settings
            </h2>

            <div className="space-y-3">
              <button
                onClick={() => setShowPasswordModal(true)}
                className="w-full bg-slate-800 hover:bg-slate-700 p-3 rounded-lg flex items-center gap-3 transition border border-slate-700"
              >
                <FiLock className="text-cyan-400" />
                <span>Change Password</span>
              </button>

              <button
                onClick={() => window.location.href = "/profile"}
                className="w-full bg-slate-800 hover:bg-slate-700 p-3 rounded-lg flex items-center gap-3 transition border border-slate-700"
              >
                <FiBell className="text-amber-400" />
                <span>Notification Preferences</span>
              </button>

              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-full bg-red-900/30 hover:bg-red-900/50 p-3 rounded-lg flex items-center gap-3 transition border border-red-700/50"
              >
                <FiTrash2 className="text-red-400" />
                <span className="text-red-400">Delete Account</span>
              </button>
            </div>
          </div>

          {/* LOGOUT BUTTON */}
          <button
            onClick={handleLogout}
            className="w-full py-4 bg-linear-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-lg flex items-center justify-center gap-2 font-semibold text-lg transition"
          >
            <FiLogOut /> Logout
          </button>
        </main>
      </div>

      {/* PASSWORD CHANGE MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-8 max-w-md w-full shadow-2xl space-y-6">
            <h3 className="text-2xl font-bold">Change Password</h3>
            <div>
              <label className="block text-sm font-medium mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 characters)"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-blue-500 focus:outline-none text-white"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition"
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE ACCOUNT MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-red-700/50 rounded-xl p-8 max-w-md w-full shadow-2xl space-y-6">
            <h3 className="text-2xl font-bold text-red-400">Delete Account?</h3>
            <p className="text-slate-300">
              This action cannot be undone. All your data will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CAR QR CODE MODAL */}
      {showQRModal && selectedCarForQR && (
        <CarQRCode
          carData={selectedCarForQR}
          userData={{
            name: user?.user_metadata?.name || user?.email?.split("@")[0],
            email: user?.email,
            phone: user?.user_metadata?.phone,
          }}
          passData={selectedCarPass}
          userAddress={userAddress}
          isOpen={showQRModal}
          onClose={() => {
            setShowQRModal(false);
            setSelectedCarForQR(null);
            setSelectedCarPass(null);
          }}
        />
      )}
    </div>
  );
}
