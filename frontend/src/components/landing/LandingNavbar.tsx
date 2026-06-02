import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ArrowRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Button from "../ui/Button";
import Avatar from "../ui/Avatar";

export default function LandingNavbar() {
  const navigate = useNavigate();
  const { user, loading, openLoginModal, logout } = useAuth();
  const [search, setSearch] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleSearchChange = (value: string) => {
    setSearch(value);
  };

  const handleSearchSubmit = (e: React.FormEvent | React.KeyboardEvent) => {
    if (e.type === "submit" || (e as React.KeyboardEvent).key === "Enter") {
      e.preventDefault();
      if (search.trim()) {
        navigate(`/dashboard?q=${encodeURIComponent(search.trim())}`);
      }
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
        {/* Left — Logo */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Link to="/" className="text-lg font-bold tracking-tight">
            <span className="text-gradient">BlogHub</span>
          </Link>
          <ArrowRight size={13} className="text-gray-300 flex-shrink-0" />
          <a
            href="https://blog2video.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-gray-400 hover:text-red-500 transition-colors"
          >
            Video
          </a>
        </div>

        {/* Center — Search */}
        <form
          onSubmit={handleSearchSubmit}
          className="flex-1 max-w-sm min-w-0"
        >
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none flex-shrink-0"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleSearchSubmit}
              placeholder="Search publications…"
              className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-full
                         pl-10 pr-4 py-2.5 placeholder:text-gray-400
                         focus:outline-none focus:bg-white focus:border-red-400 focus:ring-1 focus:ring-red-400/20
                         hover:border-gray-300 transition-colors"
            />
          </div>
        </form>

        {/* Right — Auth */}
        <div className="flex-shrink-0 flex items-center gap-3">
          {loading ? (
            <div className="w-10 h-10 bg-gray-100 rounded-full animate-pulse" />
          ) : user ? (
            <>
              <Link
                to="/dashboard"
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <Avatar name={user.name} size={32} />
                <span className="text-sm text-gray-600 truncate">@{user.tag}</span>
              </Link>
              <button
                onClick={logout}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Logout"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={openLoginModal}
            >
              Sign in
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
