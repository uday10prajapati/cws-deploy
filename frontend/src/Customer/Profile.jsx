import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import NavbarNew from "../components/NavbarNew";
import AddressManager from "../components/AddressManager";
import CarQRCode from "../components/CarQRCode";
import { FiUser, FiMail, FiPhone, FiClock, FiAlertCircle , FiCreditCard, FiSettings, FiTrash2, FiLogOut, FiLock, FiBell } from "react-icons/fi";
import { FaCar } from "react-icons/fa";
import { FiAward } from "react-icons/fi";

export default function ProfilePage() {
  
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
      // Load Cars from backend API
      const carResponse = await fetch(
        `http://localhost:5000/cars/${uid}`
      );
      const carResult = await carResponse.json();
      const carList = carResult.success ? carResult.data || [] : [];
      setCars(carList);

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

      // Load Address from profiles table
      const { data: profileData } = await supabase
        .from("profiles")
        .select("address, city, state, postal_code, country, village")
        .eq("id", uid)
        .maybeSingle();
      
      if (profileData) {
        setUserAddress(profileData);
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 text-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 text-slate-900 flex items-center justify-center">
        <p>Please log in to view your profile</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <NavbarNew />
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-8">
          {/* PROFILE HEADER */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 mb-8 shadow-md">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                <FiUser className="text-3xl text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{user.user_metadata?.name || user.email?.split("@")[0] || "User"}</h1>
                <p className="text-blue-100">{user.email}</p>
              </div>
            </div>

            {/* PERSONAL INFO SUMMARY */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-white">
              <div className="flex items-center gap-2">
                <FiMail className="text-blue-100" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <FiPhone className="text-blue-100" />
                <span>{user.phone || "Not added"}</span>
              </div>
              <div className="flex items-center gap-2">
                <FiClock className="text-blue-100" />
                <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* ADDRESS MANAGER */}
          <AddressManager userId={user.id} />

          {/* MAIN CONTENT GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* SAVED CARS */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-md">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-900">
                <FaCar className="text-blue-600" /> Saved Cars ({cars.length})
              </h2>

              {cars.length === 0 ? (
                <p className="text-slate-600 text-sm">No cars added yet</p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {cars.map((car) => (
                    <div key={car.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold text-blue-700">{car.brand} {car.model || ""}</p>
                          <p className="text-sm text-slate-600">Plate: {car.number_plate}</p>
                          <p className="text-xs text-slate-500 mt-1">{car.color || "Color not specified"}</p>
                        </div>
                        <button
                          onClick={() => handleOpenQRCode(car)}
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition shadow-sm"
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
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-md">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-900">
                <FiAward className="text-amber-600" /> Monthly Pass
              </h2>

              {monthlyPass ? (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg space-y-3">
                  <div>
                    <p className="text-sm text-slate-600">Plan</p>
                    <p className="text-lg font-semibold text-amber-700">
                      {monthlyPass.total_washes === 4 ? "Basic" :
                       monthlyPass.total_washes === 8 ? "Standard" :
                       monthlyPass.total_washes === 16 ? "Premium" : "Custom"} Plan
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-slate-600">Total Washes</p>
                      <p className="font-semibold text-slate-900">{monthlyPass.total_washes}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Remaining</p>
                      <p className="font-semibold text-emerald-600">{monthlyPass.remaining_washes}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Valid Till</p>
                    <p className="font-semibold text-slate-900">{monthlyPass.valid_till}</p>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-amber-600 h-2 rounded-full"
                      style={{ width: `${(monthlyPass.remaining_washes / monthlyPass.total_washes) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ) : (
                <div className="text-slate-600 text-sm">
                  <p>No active monthly pass</p>
                  <a href="/monthly-pass" className="text-blue-600 hover:text-blue-700 mt-2 inline-block font-medium">
                    Buy a pass →
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* BOOKING HISTORY */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-md">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-900">
              <FiClock className="text-blue-600" /> Booking History ({bookings.length})
            </h2>

            {bookings.length === 0 ? (
              <p className="text-slate-600 text-sm">No bookings yet</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {bookings.map((booking) => (
                  <div key={booking.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-slate-900">{booking.car_name}</p>
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                        booking.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                        booking.status === 'in_wash' ? 'bg-blue-100 text-blue-700' :
                        booking.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-200 text-slate-700'
                      }`}>
                        {booking.status || 'Pending'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">
                      📅 {booking.date} at {booking.time} • 📍 {booking.location}
                    </p>
                    <p className="text-sm">
                      Amount: <span className="font-semibold text-blue-700">₹{booking.amount}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PAYMENT HISTORY */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-md">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-900">
              <FiCreditCard className="text-emerald-600" /> Payment History ({transactions.length})
            </h2>

            {transactions.length === 0 ? (
              <p className="text-slate-600 text-sm">No transactions yet</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {transactions.map((tx) => (
                  <div key={tx.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-emerald-700">₹{tx.amount}</p>
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                        tx.status === 'success' ? 'bg-emerald-100 text-emerald-700' :
                        tx.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {tx.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">
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
          <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-md">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-900">
              <FiSettings className="text-blue-600" /> Settings
            </h2>

            <div className="space-y-3">
              <button
                onClick={() => setShowPasswordModal(true)}
                className="w-full bg-slate-100 hover:bg-slate-200 p-3 rounded-lg flex items-center gap-3 transition border border-slate-300 text-slate-900 font-medium"
              >
                <FiLock className="text-blue-600" />
                <span>Change Password</span>
              </button>

              <button
                onClick={() => window.location.href = "/profile"}
                className="w-full bg-slate-100 hover:bg-slate-200 p-3 rounded-lg flex items-center gap-3 transition border border-slate-300 text-slate-900 font-medium"
              >
                <FiBell className="text-amber-600" />
                <span>Notification Preferences</span>
              </button>

              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-full bg-red-50 hover:bg-red-100 p-3 rounded-lg flex items-center gap-3 transition border border-red-200 text-red-700 font-medium"
              >
                <FiTrash2 className="text-red-600" />
                <span>Delete Account</span>
              </button>
            </div>
          </div>

          {/* LOGOUT BUTTON */}
          <button
            onClick={handleLogout}
            className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg flex items-center justify-center gap-2 font-semibold text-lg transition shadow-md"
          >
            <FiLogOut /> Logout
          </button>
        </main>

      {/* PASSWORD CHANGE MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-md w-full shadow-2xl space-y-6">
            <h3 className="text-2xl font-bold text-slate-900">Change Password</h3>
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-900">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 characters)"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none text-slate-900 placeholder-slate-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="flex-1 px-4 py-3 bg-slate-200 hover:bg-slate-300 rounded-lg font-semibold transition text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition text-white shadow-sm"
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE ACCOUNT MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white border border-red-300 rounded-xl p-8 max-w-md w-full shadow-2xl space-y-6">
            <h3 className="text-2xl font-bold text-red-600">Delete Account?</h3>
            <p className="text-slate-700">
              This action cannot be undone. All your data will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-3 bg-slate-200 hover:bg-slate-300 rounded-lg font-semibold transition text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition text-white shadow-sm"
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
