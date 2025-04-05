
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

// Therapist pages
import TherapistProfile from "./pages/therapist/TherapistProfile";
import TherapistSettings from "./pages/therapist/TherapistSettings";
import TherapistBilling from "./pages/therapist/TherapistBilling";
import ClientDetails from "./pages/therapist/ClientDetails";
import InsuranceClaims from "./components/claims/InsuranceClaims";

// Patient pages
import PatientDashboard from "./pages/patient/PatientDashboard";
import PatientProfile from "./pages/patient/PatientProfile";
import PatientAppointments from "./pages/patient/PatientAppointments";
import PatientMessages from "./pages/patient/PatientMessages";
import PatientResources from "./pages/patient/PatientResources";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          
          {/* Therapist Routes */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/therapist/profile" element={<TherapistProfile />} />
          <Route path="/therapist/settings" element={<TherapistSettings />} />
          <Route path="/therapist/billing" element={<TherapistBilling />} />
          <Route path="/therapist/claims" element={<InsuranceClaims />} />
          <Route path="/therapist/client/:id" element={<ClientDetails />} />
          
          {/* Patient Routes */}
          <Route path="/patient/dashboard" element={<PatientDashboard />} />
          <Route path="/patient/profile" element={<PatientProfile />} />
          <Route path="/patient/appointments" element={<PatientAppointments />} />
          <Route path="/patient/messages" element={<PatientMessages />} />
          <Route path="/patient/resources" element={<PatientResources />} />
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
