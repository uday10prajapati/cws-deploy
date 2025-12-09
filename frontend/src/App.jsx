import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { NotificationProvider } from "./context/NotificationContext";
import { initializeStorageBucket } from "./utils/storageHelpers";
import Signup from "./page/SignUp.jsx";
import Login from "./page/Login.jsx";
import CarWash from "./Washer/CarWash.jsx";
import WMyjob from "./Washer/WMyjob.jsx";
import WasherLoyaltyPoints from "./Washer/WasherLoyaltyPoints.jsx";
import WasherDocumentUpload from "./Washer/WasherDocumentUpload.jsx";
import DemoVideos from "./Washer/DemoVideos.jsx";
import AdminDashboard from "./Admin/AdminDashboard.jsx";
import AdminEmployeeTracking from "./Admin/AdminEmployeeTracking.jsx";
import AdminRiders from "./Admin/AdminRiders.jsx";
import CustomerAccountManagement from "./Admin/CustomerAccountManagement.jsx";
import BankAccountSettings from "./Admin/BankAccountSettings.jsx";
import CustomerDashboard from "./Customer/CustomerDashboard.jsx";
import EmployeeSadhboard from "./Employee/EmployeeDashboard.jsx";
import Bookings from "./Customer/Bookings.jsx";
import Monthlypass from "./Customer/MonthlyPass.jsx";
import MyCars from "./Customer/MyCars.jsx";
import Transactions from "./Customer/Transactions.jsx";
import Location from "./Customer/Location.jsx";
import Profile from "./Customer/Profile.jsx";
import CustomerLoyaltyDashboard from "./Customer/CustomerLoyaltyDashboard.jsx";
import CustomerAccountSettings from "./Customer/CustomerAccountSettings.jsx";
import MyJobs from "./Employee/MyJobs.jsx";
import Visit from "./Visit.jsx";
import Earnings from "./Employee/Earnings.jsx";
import Ratings from "./Employee/Ratings.jsx";
import Cars from "./Employee/Cars.jsx";
import CarLocation from "./Employee/CarLocation.jsx";
import AllBookings from "./Admin/AllBookings.jsx";
import AllRevenue from "./Admin/AllRevenue.jsx";
import AllUser from "./Admin/AllUser.jsx";
import Analytics from "./Admin/Analytics.jsx";
import Settings from "./Admin/Settings.jsx";
import AllCars from "./Admin/AllCars.jsx";
import AdminEarnings from "./Admin/Earnings.jsx";
import ScanCustomerQR from "./Employee/ScanCustomerQR.jsx";

export default function App() {
  // Initialize storage bucket on app load
  useEffect(() => {
    initializeStorageBucket();
  }, []);

  return (
    <NotificationProvider>
      <Routes>
        <Route path="/" element={<Visit />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/carwash" element={<CarWash />} />
        <Route path="/washer/jobs" element={<WMyjob />} />
        <Route path="/washer/loyalty-points" element={<WasherLoyaltyPoints />} />
        <Route path="/washer/documents" element={<WasherDocumentUpload />} />
        <Route path="/washer/demo-videos" element={<DemoVideos />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/employee-tracking" element={<AdminEmployeeTracking />} />
        <Route path="/admin/riders" element={<AdminRiders />} />
        <Route path="/admin/customer-accounts" element={<CustomerAccountManagement />} />
        <Route path="/admin/bank-account" element={<BankAccountSettings />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/customer-dashboard" element={<CustomerDashboard />} />
        <Route path="/employee-dashboard" element={<EmployeeSadhboard />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/monthly-pass" element={<Monthlypass />} />
        <Route path="/my-cars" element={<MyCars />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/location" element={<Location />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/customer/loyalty" element={<CustomerLoyaltyDashboard />} />
        <Route path="/account-settings" element={<CustomerAccountSettings />} />
        <Route path="/employee/jobs" element={<MyJobs />} />
        <Route path="/employee/earnings" element={<Earnings />} />
        <Route path="/employee/ratings" element={<Ratings />} />
        <Route path="/employee/location" element={<CarLocation />} />
        <Route path="/my-cars" element={<Cars />} />
        <Route path="/employee/cars" element={<Cars />} />
        <Route path="/admin/bookings" element={<AllBookings />} />
        <Route path="/admin/revenue" element={<AllRevenue />} />
        <Route path="/admin/earnings" element={<AdminEarnings />} />
        <Route path="/admin/users" element={<AllUser />} />
        <Route path="/admin/analytics" element={<Analytics />} />
        <Route path="/admin/settings" element={<Settings />} />
        <Route path="/admin/cars" element={<AllCars />} />
        <Route path="/admin/customer-accounts" element={<CustomerAccountManagement />} />
        <Route path="/scan-customer-qr" element={<ScanCustomerQR />} />
      </Routes>
    </NotificationProvider>
  );
}