import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import PublicationDetail from "./pages/PublicationDetail";

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
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route path="/publications/:id" element={<PublicationDetail />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}
