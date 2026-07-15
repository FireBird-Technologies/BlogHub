import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ArrowRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Button from "../ui/Button";
import Avatar from "../ui/Avatar";
import { blog2videoUrl } from "../../lib/blog2video";

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
      if (!search.trim()) return;
      if (!user) {
        openLoginModal();
        return;
      }
      navigate(`/dashboard?q=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur border-b border-gray-100">
      {/* Large screens: One row, full width layout */}
      <div className="hidden sm:block w-full max-w-7xl mx-auto px-4 sm:px-6 h-16">
        <div className="w-full h-full flex items-center justify-between gap-6">
          {/* Left — Logo + Search */}
          <div className="flex items-center gap-6 min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Link to={user ? "/dashboard" : "/"} className="text-lg font-bold tracking-tight">
              <span className="text-red-600">BlogHub</span>
            </Link>
            <ArrowRight size={12} className="text-gray-300 flex-shrink-0" />
            <a
              href={blog2videoUrl("navbar")}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-gray-400 hover:text-red-500 transition-colors"
            >
              Video
            </a>
          </div>

          {/* Search — sits just right of the logo */}
          <form
            onSubmit={handleSearchSubmit}
            className="w-full max-w-sm"
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
          </div>

          {/* Right — Auth */}
          <div className="flex-shrink-0 flex items-center gap-3">
            <Link
              to="/blogs"
              className="text-sm font-semibold text-gray-600 hover:text-red-600 transition-colors"
            >
              Blogs
            </Link>
            <span className="h-5 w-px bg-gray-200" aria-hidden />
            {loading ? (
              <div className="w-10 h-10 bg-gray-100 rounded-full animate-pulse" />
            ) : user ? (
              <>
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <Avatar src={user.avatar_url} name={user.name} size={32} />
                  <span className="text-sm text-gray-600 truncate">
                    {user.tag ? `@${user.tag}` : user.name}
                  </span>
                </Link>
                <button
                  onClick={logout}
                  className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
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
      </div>

      {/* Small screens: Two rows */}
      <div className="sm:hidden w-full max-w-7xl mx-auto px-4 sm:px-6">
        {/* Row 1: Logo and Auth */}
        <div className="h-14 flex items-center justify-between gap-3">
          {/* Left — Logo */}
          <div className="flex items-center gap-1 flex-shrink-0 min-w-0">
            <Link to={user ? "/dashboard" : "/"} className="text-base font-bold tracking-tight">
              <span className="text-red-600">BlogHub</span>
            </Link>
            <ArrowRight size={12} className="text-gray-300 flex-shrink-0" />
            <a
              href={blog2videoUrl("navbar")}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors"
            >
              Video
            </a>
          </div>

          {/* Right — Auth */}
          <div className="flex-shrink-0 flex items-center gap-3">
            <Link
              to="/blogs"
              className="text-xs font-semibold text-gray-600 hover:text-red-600 transition-colors"
            >
              Blogs
            </Link>
            <span className="h-4 w-px bg-gray-200" aria-hidden />
            {loading ? (
              <div className="w-8 h-8 bg-gray-100 rounded-full animate-pulse" />
            ) : user ? (
              <>
                <Link
                  to="/dashboard"
                  className="flex-shrink-0"
                  title="Go to dashboard"
                >
                  <Avatar src={user.avatar_url} name={user.name} size={28} />
                </Link>
                <button
                  onClick={logout}
                  className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
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

        {/* Row 2: Search bar (full width) */}
        <form
          onSubmit={handleSearchSubmit}
          className="pb-3"
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
                         pl-10 pr-4 py-2 placeholder:text-gray-400
                         focus:outline-none focus:bg-white focus:border-red-400 focus:ring-1 focus:ring-red-400/20
                         hover:border-gray-300 transition-colors"
            />
          </div>
        </form>
      </div>
    </nav>
  );
}
