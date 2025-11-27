import { Routes, Route } from "react-router-dom";
import { NotificationProvider } from "./context/NotificationContext";
import Signup from "./page/SignUp.jsx";
import Login from "./page/Login.jsx";
import AdminDashboard from "./Admin/AdminDashboard.jsx";
import BankAccountSettings from "./Admin/BankAccountSettings.jsx";
import CustomerDashboard from "./Customer/CustomerDashboard.jsx";
import EmployeeSadhboard from "./Employee/EmployeeDashboard.jsx";
import Bookings from "./Customer/Bookings.jsx";
import Monthlypass from "./Customer/MonthlyPass.jsx";
import MyCars from "./Customer/MyCars.jsx";
import Transactions from "./Customer/Transactions.jsx";
import Location from "./Customer/Location.jsx";
import Profile from "./Customer/Profile.jsx";
import MyJobs from "./Employee/MyJobs.jsx";
import Visit from "./Visit.jsx";

export default function App() {
  return (
    <NotificationProvider>
      <Routes>
        <Route path="/" element={<Visit />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
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
        <Route path="/employee/jobs" element={<MyJobs />} />
      </Routes>
    </NotificationProvider>
  );
}