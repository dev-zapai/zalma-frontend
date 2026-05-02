import "@/App.css";
import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Toaster } from "sonner";
import api from "@/lib/api";

import ScrollToTop from "@/components/ScrollToTop";
import PetGroomingLandingPage from "@/pages/PetGroomingLandingPage";
import AboutPage from "@/pages/AboutPage";
import FAQPage from "@/pages/FAQPage";
import PrivacyPage from "@/pages/PrivacyPage";
import ContactPage from "@/pages/ContactPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import TermsPage from "@/pages/TermsPage";
import AddPaymentPage from "@/pages/AddPaymentPage";
// ForgotPasswordPage is now integrated into LoginPage as step 3/4
import DashboardLayout from "@/pages/dashboard/DashboardLayout";
import OverviewPage from "@/pages/dashboard/OverviewPage";
import AvailabilityPage from "@/pages/dashboard/AvailabilityPage";
import AbsencePage from "@/pages/dashboard/AbsencePage";
import BillingPage from "@/pages/dashboard/BillingPage";
import StaffPage from "@/pages/dashboard/StaffPage";
import ServicesPage from "@/pages/dashboard/ServicesPage";
import AnalyticsPage from "@/pages/dashboard/AnalyticsPage";
import NotificationsPage from "@/pages/dashboard/NotificationsPage";
import AppointmentsPage from "@/pages/dashboard/AppointmentsPage";
import SettingsPage from "@/pages/dashboard/SettingsPage";
import AcceptInvitationPage from "@/pages/AcceptInvitationPage";
import ChangePasswordPage from "@/pages/ChangePasswordPage";
import MemberDetailPage from "@/pages/dashboard/MemberDetailPage";
import ProfilePage from "@/pages/dashboard/ProfilePage";
import ClientsPage from "@/pages/dashboard/ClientsPage";
import ClientDetailPage from "@/pages/dashboard/ClientDetailPage";
import PetsPage from "@/pages/dashboard/PetsPage";
import PetDetailPage from "@/pages/dashboard/PetDetailPage";
import GroomingAppointmentDetailPage from "@/pages/dashboard/GroomingAppointmentDetailPage";
import ReceiptViewPage from "@/pages/dashboard/ReceiptViewPage";
import NewGroomingAppointmentPage from "@/pages/dashboard/NewGroomingAppointmentPage";
import WebsiteSetupPage from "@/pages/dashboard/WebsiteSetupPage";
import ExploreMapPage from "@/pages/dashboard/ExploreMapPage";
import PartnersPage from "@/pages/dashboard/PartnersPage";
import PartnerChatPage from "@/pages/dashboard/PartnerChatPage";
import WaitlistPage from "@/pages/dashboard/WaitlistPage";
import TransfersPage from "@/pages/dashboard/TransfersPage";
import AutomationsPage from "@/pages/dashboard/AutomationsPage";
import SalonWebsiteLayout from "@/pages/public/salon/SalonWebsiteLayout";
import SalonHomePage from "@/pages/public/salon/SalonHomePage";
import SalonServicesPage from "@/pages/public/salon/SalonServicesPage";
import SalonGalleryPage from "@/pages/public/salon/SalonGalleryPage";
import SalonAboutPage from "@/pages/public/salon/SalonAboutPage";
import SalonContactPage from "@/pages/public/salon/SalonContactPage";
import SalonBookPage from "@/pages/public/salon/SalonBookPage";

// When the user clicks "Profile" we want them to land on the rich staff
// detail page (with working hours, capabilities, leaves, etc.) instead of
// the bare account-settings ProfilePage. If the user has no linked staff
// record we fall back to the legacy ProfilePage.
function ProfileRedirect() {
  const { profile } = useAuth();
  if (profile?.staff_id) {
    return <Navigate to={`/dashboard/staff/member/${profile.staff_id}`} replace />;
  }
  return <ProfilePage />;
}

function ProtectedRoute({ children }) {
  const { user, profile, loading } = useAuth();
  const [hasCard, setHasCard] = useState(null);
  const isAdmin = profile?.is_admin || profile?.role === 'admin';

  useEffect(() => {
    if (profile && isAdmin) {
      api.get('/billing/has-payment-method')
        .then(r => setHasCard(r.data.has_card))
        .catch(() => setHasCard(false));
    } else if (profile) {
      // Staff don't need a card on file, only admin/owner does.
      setHasCard(true);
    }
  }, [profile, isAdmin]);

  // Auth checks come BEFORE the card check. If the visitor has no session
  // (e.g. deep-linked into a protected URL without logging in first) we
  // want them bounced to /login immediately, not parked on the loading
  // spinner waiting for a hasCard fetch that can never fire.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500 mt-3">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!profile) return <Navigate to="/register" state={{ step: 2 }} replace />;
  if (user?.user_metadata?.must_change_password) {
    return <Navigate to="/change-password" replace />;
  }

  // We have a profile. Now wait for the card check to resolve before
  // deciding whether to enforce the /add-payment gate.
  if (hasCard === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500 mt-3">Loading...</p>
        </div>
      </div>
    );
  }

  // Admin must have a credit card on file to access the platform.
  if (isAdmin && !hasCard) return <Navigate to="/add-payment" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { profile, loading } = useAuth();
  if (loading) return null;
  if (profile) return <Navigate to="/dashboard" replace />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <Routes>
          {/* Grooming product landing (zalma.com.au) */}
          <Route path="/" element={<PetGroomingLandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/terms" element={<TermsPage />} />
          {/* Forgot password is now built into LoginPage steps 3/4 */}
          <Route path="/add-payment" element={<AddPaymentPage />} />
          <Route path="/invite/:token" element={<AcceptInvitationPage />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />

          {/* Public salon website — multi-page (no auth required)
              Lives under /s/:slug — customers book here */}
          <Route path="/s/:slug" element={<SalonWebsiteLayout />}>
            <Route index element={<SalonHomePage />} />
            <Route path="services" element={<SalonServicesPage />} />
            <Route path="gallery" element={<SalonGalleryPage />} />
            <Route path="about" element={<SalonAboutPage />} />
            <Route path="contact" element={<SalonContactPage />} />
            <Route path="book" element={<SalonBookPage />} />
          </Route>

          {/* Salon owner dashboard (zalma.com.au/dashboard) */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<OverviewPage />} />
            <Route path="availability" element={<AvailabilityPage />} />
            {/* Legacy /calendar URL → redirect to /availability */}
            <Route path="calendar" element={<AvailabilityPage />} />
            <Route path="appointments" element={<AppointmentsPage />} />
            <Route path="appointments/new" element={<NewGroomingAppointmentPage />} />
            <Route path="appointments/:appointmentId/detail" element={<GroomingAppointmentDetailPage />} />
            <Route path="appointments/:appointmentId/receipt" element={<ReceiptViewPage />} />
            <Route path="pets" element={<PetsPage />} />
            <Route path="pets/:petId" element={<PetDetailPage />} />
            <Route path="staff" element={<StaffPage />} />
            <Route path="staff/member/:memberId" element={<MemberDetailPage />} />
            <Route path="absence" element={<AbsencePage />} />
            <Route path="clients" element={<ClientsPage />} />
            <Route path="clients/:clientId" element={<ClientDetailPage />} />
            <Route path="services" element={<ServicesPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="profile" element={<ProfileRedirect />} />
            <Route path="explore" element={<ExploreMapPage />} />
            <Route path="partners" element={<PartnersPage />} />
            <Route path="partners/:partnershipId/chat" element={<PartnerChatPage />} />
            <Route path="waitlist" element={<WaitlistPage />} />
            <Route path="transfers" element={<TransfersPage />} />
            <Route path="automations" element={<AutomationsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="billing" element={<BillingPage />} />
            <Route path="website-setup" element={<WebsiteSetupPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
