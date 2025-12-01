import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Auth pages
import LoginPage from './auth/LoginPage';
import RegisterPage from './auth/RegisterPage';
import ForgotPassword from './auth/ForgotPassword'; // Import the new component

// User pages
import UserDashboard from './user/UserDashboard';
import MakeReservation from './user/MakeReservation';
import MyReservations from './user/MyReservations';
import PaymentHistory from './user/PaymentHistory';
import MenuPage from './user/MenuPage';
import PlaceOrderPage from './user/PlaceOrderPage';
import PendingPayments from './user/PendingPayments';
import BuyMembership from './user/BuyMembership';
import Gallery from'./user/Gallery';

// Admin pages
import AdminDashboard from './admin/AdminDashboard';
import AdminHomePage from './admin/AdminHomePage';
import ManageMenu from './admin/ManageMenu';
import ManageStaff from './admin/ManageStaff';
import ManageTables from './admin/ManageTables';
import ManageReservations from './admin/ManageReservations';
import Reports from './admin/Reports';

// Common
import ProtectedRoute from './components/ProtectedRoute';
import ManageMembers from './admin/ManageMembers';
import AboutPage from './user/AboutPage';
import ChefsPage from './user/ChefsPage';
import Profile from './user/Profile';
import FeedbackPage from './user/FeedbackPage';
import ViewFeedbacks from './admin/ViewFeedbacks';

const AppRouter = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/reset-password" element={<ForgotPassword />} /> {/* New route */}
      
      {/* User routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/user" element={<UserDashboard />} />
        <Route path="/user/about" element={<AboutPage />} />
        <Route path="/user/make-reservation" element={<MakeReservation />} />
        <Route path="/user/my-reservations" element={<MyReservations />} />
        <Route path="/user/Chefs" element={<ChefsPage />} />
        <Route path="/user/payment-history" element={<PaymentHistory />} />
        <Route path="/user/menu" element={<MenuPage />} />
        <Route path="/user/place-order" element={<PlaceOrderPage />} />
        <Route path="/user/pending-payments" element={<PendingPayments />} />
        <Route path="/user/your-profile" element={<Profile/>} />
        <Route path="/user/buy-membership" element={<BuyMembership />} />
        <Route path="/user/Gallery" element={<Gallery />} />
        <Route path="/user/feedback" element={<FeedbackPage />} />
      </Route>

      {/* Admin routes */}
      <Route element={<ProtectedRoute adminOnly />}>
        <Route path="/admin/home" element={<AdminHomePage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/manage-menu" element={<ManageMenu />} />
        <Route path="/admin/manage-staff" element={<ManageStaff />} />
        <Route path="/admin/manage-tables" element={<ManageTables />} />
        <Route path="/admin/manage-reservations" element={<ManageReservations />} />
        <Route path="/admin/reports" element={<Reports />} />
        <Route path="/admin/manage-members" element={<ManageMembers />} />
        <Route path="/admin/viewfeedbacks" element={<ViewFeedbacks />} />
      </Route>
    </Routes>
  );
};

export default AppRouter;