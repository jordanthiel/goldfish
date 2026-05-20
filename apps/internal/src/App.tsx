import { Toaster } from '@goldfish/shared/components/ui/toaster';
import { Toaster as Sonner } from '@goldfish/shared/components/ui/sonner';
import { TooltipProvider } from '@goldfish/shared/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@goldfish/shared/context/AuthContext';
import InternalLayout from '@/components/internal/InternalLayout';
import InternalDashboard from '@/pages/InternalDashboard';
import ConversationDetail from '@/pages/ConversationDetail';
import AggregateAnalysis from '@/pages/AggregateAnalysis';
import ChatPlayground from '@/pages/ChatPlayground';
import FunnelAnalytics from '@/pages/FunnelAnalytics';
import InternalDeveloperSettings from '@/pages/InternalDeveloperSettings';
import ShareLinks from '@/pages/ShareLinks';
import Waitlist from '@/pages/Waitlist';
import Login from '@/pages/Login';

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
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<InternalLayout />}>
              <Route index element={<InternalDashboard />} />
              <Route path="conversation/:id" element={<ConversationDetail />} />
              <Route path="aggregate" element={<AggregateAnalysis />} />
              <Route path="playground" element={<ChatPlayground />} />
              <Route path="funnel" element={<FunnelAnalytics />} />
              <Route path="waitlist" element={<Waitlist />} />
              <Route path="developer" element={<InternalDeveloperSettings />} />
              <Route path="share-links" element={<ShareLinks />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
