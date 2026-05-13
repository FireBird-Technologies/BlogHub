import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { setToken } from "../lib/auth";
import { useAuth } from "../context/AuthContext";
import Spinner from "../components/ui/Spinner";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace("#", "?"));
    const token = params.get("token");

    if (token) {
      setToken(token);
      void refreshUser().then(() => navigate("/dashboard", { replace: true }));
    } else {
      navigate("/", { replace: true });
    }
  }, [navigate, refreshUser]);

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center flex-col gap-4">
      <Spinner size={36} />
      <p className="text-white/30 text-sm">Signing you in…</p>
    </div>
  );
}
