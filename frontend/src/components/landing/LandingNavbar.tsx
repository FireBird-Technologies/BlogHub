import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ArrowRight, Menu, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Button from "../ui/Button";
import Avatar from "../ui/Avatar";
import { blog2videoUrl } from "../../lib/blog2video";

export default function LandingNavbar() {
  const navigate = useNavigate();
  const { user, loading, openLoginModal, logout } = useAuth();
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Close the mobile menu when clicking outside of it.
  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

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
            <div className="flex items-center gap-7">
              <Link
                to="/featured-faq"
                className="text-sm font-semibold text-gray-600 hover:text-red-600 transition-colors"
              >
                Get featured
              </Link>
              <Link
                to="/blogs"
                className="text-sm font-semibold text-gray-600 hover:text-red-600 transition-colors"
              >
                Blogs
              </Link>
            </div>
            <span className="h-5 w-px bg-gray-200" aria-hidden />
            {loading ? (
              <div className="w-10 h-10 bg-gray-100 rounded-full animate-pulse" />
            ) : user ? (
              <>
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <Avatar src={user.avatar_url} name={user.name} position={user.avatar_position} scale={user.avatar_scale} size={32} />
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
            {loading ? (
              <div className="w-8 h-8 bg-gray-100 rounded-full animate-pulse" />
            ) : user ? (
              <>
                <Link
                  to="/dashboard"
                  className="flex-shrink-0"
                  title="Go to dashboard"
                >
                  <Avatar src={user.avatar_url} name={user.name} position={user.avatar_position} scale={user.avatar_scale} size={28} />
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
            ) : null}

            {/* Burger menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="p-1.5 -mr-1.5 text-gray-600 hover:text-red-600 transition-colors"
                aria-label="Menu"
                aria-expanded={menuOpen}
              >
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-gray-100 bg-white py-1 shadow-lg z-50">
                  {!loading && !user && (
                    <>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          openLoginModal();
                        }}
                        className="block w-full text-left px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Sign in
                      </button>
                      <div className="my-1 h-px bg-gray-100" />
                    </>
                  )}
                  <Link
                    to="/featured-faq"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors"
                  >
                    Get featured
                  </Link>
                  <Link
                    to="/blogs"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors"
                  >
                    Blogs
                  </Link>
                </div>
              )}
            </div>
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
