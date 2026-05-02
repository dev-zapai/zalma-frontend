import "@/App.css";
import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/features/auth/AuthContext";
import { Toaster } from "sonner";
import api from "@/shared/lib/api";

import ScrollToTop from "@/shared/components/ScrollToTop";
import PetGroomingLandingPage from "@/features/marketing/pages/PetGroomingLandingPage";
import AboutPage from "@/features/marketing/pages/AboutPage";
import FAQPage from "@/features/marketing/pages/FAQPage";
import PrivacyPage from "@/features/legal/pages/PrivacyPage";
import ContactPage from "@/features/marketing/pages/ContactPage";
import LoginPage from "@/features/auth/pages/LoginPage";
import RegisterPage from "@/features/auth/pages/RegisterPage";
import TermsPage from "@/features/legal/pages/TermsPage";
import AddPaymentPage from "@/features/billing/pages/AddPaymentPage";
// ForgotPasswordPage is now integrated into LoginPage as step 3/4
import DashboardLayout from "@/features/dashboard/pages/DashboardLayout";
import OverviewPage from "@/features/dashboard/pages/OverviewPage";
import AvailabilityPage from "@/features/dashboard/pages/AvailabilityPage";
import AbsencePage from "@/features/dashboard/pages/AbsencePage";
import BillingPage from "@/features/dashboard/pages/BillingPage";
import StaffPage from "@/features/dashboard/pages/StaffPage";
import ServicesPage from "@/features/dashboard/pages/ServicesPage";
import AnalyticsPage from "@/features/dashboard/pages/AnalyticsPage";
import NotificationsPage from "@/features/dashboard/pages/NotificationsPage";
import AppointmentsPage from "@/features/dashboard/pages/AppointmentsPage";
import SettingsPage from "@/features/dashboard/pages/SettingsPage";
import AcceptInvitationPage from "@/features/auth/pages/AcceptInvitationPage";
import ChangePasswordPage from "@/features/auth/pages/ChangePasswordPage";
import MemberDetailPage from "@/features/dashboard/pages/MemberDetailPage";
import ProfilePage from "@/features/dashboard/pages/ProfilePage";
import ClientsPage from "@/features/dashboard/pages/ClientsPage";
import ClientDetailPage from "@/features/dashboard/pages/ClientDetailPage";
import PetsPage from "@/features/dashboard/pages/PetsPage";
import PetDetailPage from "@/features/dashboard/pages/PetDetailPage";
import GroomingAppointmentDetailPage from "@/features/dashboard/pages/GroomingAppointmentDetailPage";
import ReceiptViewPage from "@/features/dashboard/pages/ReceiptViewPage";
import NewGroomingAppointmentPage from "@/features/dashboard/pages/NewGroomingAppointmentPage";
import WebsiteSetupPage from "@/features/dashboard/pages/WebsiteSetupPage";
import ExploreMapPage from "@/features/dashboard/pages/ExploreMapPage";
import PartnersPage from "@/features/dashboard/pages/PartnersPage";
import PartnerChatPage from "@/features/dashboard/pages/PartnerChatPage";
import WaitlistPage from "@/features/dashboard/pages/WaitlistPage";
import TransfersPage from "@/features/dashboard/pages/TransfersPage";
import AutomationsPage from "@/features/dashboard/pages/AutomationsPage";
import SalonWebsiteLayout from "@/features/salon-website/pages/SalonWebsiteLayout";
import SalonHomePage from "@/features/salon-website/pages/SalonHomePage";
import SalonServicesPage from "@/features/salon-website/pages/SalonServicesPage";
import SalonGalleryPage from "@/features/salon-website/pages/SalonGalleryPage";
import SalonAboutPage from "@/features/salon-website/pages/SalonAboutPage";
import SalonContactPage from "@/features/salon-website/pages/SalonContactPage";
import SalonBookPage from "@/features/salon-website/pages/SalonBookPage";

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
  const { profile, loading } = useAuth();
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

  // No profile = no session (cookie missing/invalid) — bounce to /login.
  if (!profile) return <Navigate to="/login" replace />;
  if (profile?.must_change_password) {
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
