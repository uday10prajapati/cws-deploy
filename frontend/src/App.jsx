import { Routes, Route } from "react-router-dom";
import Signup from "./page/SignUp.jsx";
import Login from "./page/Login.jsx";
import AdminDashboard from "./Admin/AdminDashboard.jsx";
import CustomerDashboard from "./Customer/CustomerDashboard.jsx";
import EmployeeSadhboard from "./Employee/EmployeeDashboard.jsx";
import Bookings from "./Customer/Bookings.jsx";
import Monthlypass from "./Customer/MonthlyPass.jsx";
import MyCars from "./Customer/MyCars.jsx";
import Transactions from "./Customer/Transactions.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Signup />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route path="/customer-dashboard" element={<CustomerDashboard />} />
      <Route path="/employee-dashboard" element={<EmployeeSadhboard />} />
      <Route path="/bookings" element={<Bookings />} />
      <Route path="/monthly-pass" element={<Monthlypass />} />
      <Route path="/my-cars" element={<MyCars />} />
      <Route path="/transactions" element={<Transactions />} />
    </Routes>
  );
}
