import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { NotificationProvider } from "./context/NotificationContext";
import { initializeStorageBucket } from "./utils/storageHelpers";
import Signup from "./page/SignUp.jsx";
import Login from "./page/Login.jsx";
import ResetPassword from "./page/ResetPassword.jsx";
import CarWash from "./Washer/CarWash.jsx";
import WWashHistory from "./Washer/WashHistory.jsx";
import WasherWorkflow from "./Washer/WasherWorkflow.jsx";
import WasherDocumentUpload from "./Washer/WasherDocumentUpload.jsx";
import DemoVideos from "./Washer/DemoVideos.jsx";
import WasherEmergencyWash from "./Washer/WasherEmergencyWash.jsx";
import WasherEmergencyWashTracking from "./Washer/WasherEmergencyWashTracking.jsx";
import SalesDocumentUpload from "./Sales/SalesDocumentUpload.jsx";
import SalesDashboard from "./Sales/SalesDashboard.jsx";
import SalesWork from "./Sales/SalesWork.jsx";
import SalesHistory from "./Sales/SalesHistory.jsx";
import AdminDashboard from "./Admin/AdminDashboard.jsx";
import AdminEmployeeTracking from "./Admin/AdminEmployeeTracking.jsx";
import AdminWashers from "./Admin/AdminWashers.jsx";
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
import WashHistory from "./Customer/WashHistory.jsx";
import CustomerLoyaltyDashboard from "./Customer/CustomerLoyaltyDashboard.jsx";
import CustomerAccountSettings from "./Customer/CustomerAccountSettings.jsx";
import MyJobs from "./Employee/MyJobs.jsx";
import Visit from "./Visit.jsx";
import Earnings from "./Employee/Earnings.jsx";
import Ratings from "./Employee/Ratings.jsx";
import AllECars from "./Employee/AllCars.jsx";
import CarLocation from "./Employee/CarLocation.jsx";
import AllBookings from "./Admin/AllBookings.jsx";
import AllRevenue from "./Admin/AllRevenue.jsx";
import AllUser from "./Admin/AllUser.jsx";
import Analytics from "./Admin/Analytics.jsx";
import Settings from "./Admin/Settings.jsx";
import AllCars from "./Admin/AllCars.jsx";
import AdminEarnings from "./Admin/Earnings.jsx";
import AdminDocumentVerification from "./Admin/AdminDocumentVerification.jsx";
import ScanCustomerQR from "./Employee/ScanCustomerQR.jsx";
import AllCustomers from "./Employee/AllCustomers.jsx";
import AllSalesCustomers from "./Employee/AllSalesCustomers.jsx";
import CustomerDetails from "./Employee/CustomerDetails.jsx";
import AssignArea from "./Employee/AssignArea.jsx";
import AllSalespeople from "./Employee/AllSalespeople.jsx";
import SalespersonDetails from "./Employee/SalespersonDetails.jsx";
import RoleBasedAccessControl from "./Employee/RoleBasedAccessControl.jsx";
import SubGeneralTalukaAssignment from "./Employee/SubGeneralTalukaAssignment.jsx";
import HRGeneralSalesmanAssignment from "./Employee/HRGeneralSalesmanAssignment.jsx";
import AboutUs from "./AboutUs.jsx";
import EmergencyWashRequest from "./Customer/EmergencyWashRequest.jsx";
import CustomerEmergencyWashLiveTracking from "./Customer/CustomerEmergencyWashLiveTracking.jsx";
import AdminEmergencyWashManagement from "./Admin/AdminEmergencyWashManagement.jsx";
import EmployeeEmergencyWash from "./Employee/EmployeeEmergencyWash.jsx";
import ApprovalPanel from "./Admin/ApprovalPanel.jsx";
import AdminLoyaltyDashboard from "./Admin/AdminLoyaltyDashboard.jsx";
import BookingReports from "./Admin/BookingReports.jsx";
import RevenueReports from "./Admin/RevenueReports.jsx";
import TalukaDetails from "./Admin/TalukaDetails.jsx";
import CityDetails from "./Admin/CityDetails.jsx";
import Notifications from "./page/Notifications.jsx";
import AllDocuments from "./Employee/AllDocuments.jsx";

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
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/carwash" element={<CarWash />} />
        <Route path="/washer/wash-history" element={<WWashHistory />} />
        <Route path="/washer/workflow" element={<WasherWorkflow />} />
        <Route path="/washer/documents" element={<WasherDocumentUpload />} />
        <Route path="/washer/demo-videos" element={<DemoVideos />} />
        <Route path="/washer/emergency-wash" element={<WasherEmergencyWash />} />
        <Route path="/washer/emergency-wash/track" element={<WasherEmergencyWashTracking />} />
        <Route path="/sales/documents" element={<SalesDocumentUpload />} />
        <Route path="/sales-dashboard" element={<SalesDashboard />} />
        <Route path="/sales-work" element={<SalesWork />} />
        <Route path="/sales-history" element={<SalesHistory />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/employee-tracking" element={<AdminEmployeeTracking />} />
        <Route path="/admin/washers" element={<AdminWashers />} />
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
        <Route path="/wash-history" element={<WashHistory />} />
        <Route path="/customer/loyalty" element={<CustomerLoyaltyDashboard />} />
        <Route path="/account-settings" element={<CustomerAccountSettings />} />
        <Route path="/employee/jobs" element={<MyJobs />} />
        <Route path="/employee/earnings" element={<Earnings />} />
        <Route path="/employee/ratings" element={<Ratings />} />
        <Route path="/employee/location" element={<CarLocation />} />
        <Route path="/my-cars" element={<MyCars />} />
        <Route path="/employee/cars" element={<AllECars />} />
        <Route path="/employee/customers" element={<AllCustomers />} />
        <Route path="/employee/sales-customers" element={<AllSalesCustomers />} />
        <Route path="/employee/customer/:id" element={<CustomerDetails />} />
        <Route path="/employee/assign-areas" element={<AssignArea />} />
        <Route path="/employee/salespeople" element={<AllSalespeople />} />
        <Route path="/employee/salesperson/:id" element={<SalespersonDetails />} />
        <Route path="/employee/rbac" element={<RoleBasedAccessControl />} />
        <Route path="/employee/sub-general-talukas" element={<SubGeneralTalukaAssignment />} />
        <Route path="/employee/hr-general-salesmen" element={<HRGeneralSalesmanAssignment />} />
        <Route path="/admin/bookings" element={<AllBookings />} />
        <Route path="/admin/AllRevenue" element={<AllRevenue />} />
        <Route path="/admin/earnings" element={<AdminEarnings />} />
        <Route path="/admin/users" element={<AllUser />} />
        <Route path="/admin/analytics" element={<Analytics />} />
        <Route path="/admin/settings" element={<Settings />} />
        <Route path="/admin/cars" element={<AllCars />} />
        <Route path="/admin/customer-accounts" element={<CustomerAccountManagement />} />
        <Route path="/scan-customer-qr" element={<ScanCustomerQR />} />
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/emergency-wash" element={<EmergencyWashRequest />} />
        <Route path="/emergency-wash/track" element={<CustomerEmergencyWashLiveTracking />} />
        <Route path="/admin/emergency-wash" element={<AdminEmergencyWashManagement />} />
        <Route path="/employee/emergency-wash" element={<EmployeeEmergencyWash />} />
        <Route path="/admin/approvals" element={<ApprovalPanel />} />
        <Route path="/admin/washer-documents" element={<AdminDocumentVerification />} />
        <Route path="/admin/loyalty-dashboard" element={<AdminLoyaltyDashboard />} />
        <Route path="/admin/booking-reports" element={<BookingReports />} />
        <Route path="/admin/revenue-reports" element={<RevenueReports />} />
        <Route path="/admin/taluka-details" element={<TalukaDetails />} />
        <Route path="/admin/city-details" element={<CityDetails />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/employee/documents" element={<AllDocuments />} />
      </Routes>
    </NotificationProvider>
  );
}