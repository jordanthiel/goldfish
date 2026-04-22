
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Chat from "./pages/Chat";
import YoungLandingPage from "./pages/YoungLandingPage";
import SleepLandingPage from "./pages/SleepLandingPage";
import CouplesLandingPage from "./pages/CouplesLandingPage";
import WorkStressLandingPage from "./pages/WorkStressLandingPage";
import ConversationReport from "./pages/ConversationReport";
import TherapistReferralReport from "./pages/TherapistReferralReport";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import TherapistDiscovery from "./pages/TherapistDiscovery";

// Therapist pages
import TherapistProfile from "./pages/therapist/TherapistProfile";
import TherapistSettings from "./pages/therapist/TherapistSettings";
import TherapistBilling from "./pages/therapist/TherapistBilling";
import ClientDetails from "./pages/therapist/ClientDetails";
import SessionDetails from "./pages/therapist/SessionDetails";
import SessionNoteEdit from "./pages/therapist/SessionNoteEdit";

// Patient pages
import PatientDashboard from "./pages/patient/PatientDashboard";
import PatientProfile from "./pages/patient/PatientProfile";
import PatientAppointments from "./pages/patient/PatientAppointments";
import PatientMessages from "./pages/patient/PatientMessages";
import PatientResources from "./pages/patient/PatientResources";
import ClaimAccount from "./pages/patient/ClaimAccount"; // New component for claiming account

// Internal CMS pages
import InternalDashboard from "./pages/internal/InternalDashboard";
import ConversationDetail from "./pages/internal/ConversationDetail";
import AggregateAnalysis from "./pages/internal/AggregateAnalysis";
import ChatPlayground from "./pages/internal/ChatPlayground";
import FunnelAnalytics from "./pages/internal/FunnelAnalytics";

// Create a QueryClient with better defaults for our app
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/chat/:id" element={<Chat />} />
            <Route path="/chat/:id/report" element={<ConversationReport />} />
            <Route path="/referral/:id" element={<TherapistReferralReport />} />
            <Route path="/young" element={<YoungLandingPage />} />
            <Route path="/sleep" element={<SleepLandingPage />} />
            <Route path="/couples" element={<CouplesLandingPage />} />
            <Route path="/work-stress" element={<WorkStressLandingPage />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/login" element={<Login />} />
            <Route path="/claim/:inviteCode" element={<ClaimAccount />} /> {/* New route for claiming account */}
            <Route path="/find-therapist" element={<TherapistDiscovery />} /> {/* New route for therapist discovery */}
            
            {/* Internal CMS Routes - protected by component-level checks for isInternal */}
            <Route path="/internal" element={<InternalDashboard />} />
            <Route path="/internal/conversation/:id" element={<ConversationDetail />} />
            <Route path="/internal/aggregate" element={<AggregateAnalysis />} />
            <Route path="/internal/playground" element={<ChatPlayground />} />
            <Route path="/internal/funnel" element={<FunnelAnalytics />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              {/* Therapist Dashboard Routes - only accessible to therapists */}
              <Route element={<ProtectedRoute requiredRole="therapist" />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/dashboard/clients" element={<Dashboard />} />
                <Route path="/dashboard/calendar" element={<Dashboard />} />
                <Route path="/dashboard/notes" element={<Dashboard />} />
                <Route path="/dashboard/video" element={<Dashboard />} />
                <Route path="/dashboard/claims" element={<Dashboard />} />
                <Route path="/dashboard/messages" element={<Dashboard />} />
                <Route path="/dashboard/settings" element={<Dashboard />} />
                
                {/* Other Therapist Routes */}
                <Route path="/therapist/profile" element={<TherapistProfile />} />
                <Route path="/therapist/settings" element={<TherapistSettings />} />
                <Route path="/therapist/billing" element={<TherapistBilling />} />
                <Route path="/therapist/client/:id" element={<ClientDetails />} />
                <Route path="/therapist/session/:id" element={<SessionDetails />} />
                <Route path="/therapist/notes/:noteId" element={<SessionNoteEdit />} />
              </Route>
              
              {/* Patient Routes - only accessible to clients */}
              <Route element={<ProtectedRoute requiredRole="client" />}>
                <Route path="/patient/dashboard" element={<PatientDashboard />} />
                <Route path="/patient/profile" element={<PatientProfile />} />
                <Route path="/patient/appointments" element={<PatientAppointments />} />
                <Route path="/patient/messages" element={<PatientMessages />} />
                <Route path="/patient/resources" element={<PatientResources />} />
              </Route>
            </Route>
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
