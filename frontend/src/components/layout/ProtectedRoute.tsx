import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Spinner from "../ui/Spinner";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Spinner size={36} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
