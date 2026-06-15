import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import LoginPromptModal from "./components/auth/LoginPromptModal";
import SigningInOverlay from "./components/auth/SigningInOverlay";
import { OnboardingModal } from "./components/auth/ProfileModal";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import RankingPage from "./pages/RankingPage";
import Profile from "./pages/Profile";
import PublicationDetail from "./pages/PublicationDetail";
import Blog from "./pages/Blog";
import BlogPostPage from "./pages/BlogPostPage";
import AdminApproveClaim from "./pages/AdminApproveClaim";
import NotFound from "./pages/NotFound";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/category/:category" element={<RankingPage />} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route path="/publications/:id" element={<PublicationDetail />} />
              <Route path="/blogs" element={<Blog />} />
              <Route path="/blogs/:slug" element={<BlogPostPage />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/admin/approve-claim" element={<AdminApproveClaim />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <LoginPromptModal />
            <OnboardingModal />
            <SigningInOverlay />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}
