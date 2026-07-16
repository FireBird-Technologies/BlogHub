import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import { blog2videoUrl } from "../../lib/blog2video";

export default function Navbar() {
  const { user, loading, logout, openLoginModal } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Logged-in users go to the dashboard; logged-out users go to the landing page.
  const logoTo = user ? "/dashboard" : "/";

  // Burger menu (small screens only) — holds the nav tabs and, when logged out, Sign in.
  const burger = (
    <div className="relative sm:hidden" ref={menuRef}>
      <button
        type="button"
        onClick={() => setMenuOpen((o) => !o)}
        className="p-1.5 text-gray-600 hover:text-red-600 transition-colors"
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
                type="button"
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
  );

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

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Link to={logoTo} className="text-lg font-bold tracking-tight">
            <span className="text-red-600">BlogHub</span>
          </Link>
          <ArrowRight size={13} className="text-gray-300 flex-shrink-0" />
          <a
            href={blog2videoUrl("navbar")}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-gray-400 hover:text-red-500 transition-colors"
          >
            Video
          </a>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-7">
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
            <div className="h-8 w-20 rounded-full bg-gray-100 animate-pulse" aria-label="Checking sign-in status" />
          ) : user ? (
            <>
              <Link
                to="/profile"
                title="View your profile"
                className="flex items-center gap-2 rounded-full border border-gray-200 bg-white py-1 pl-1 pr-3
                           text-sm font-semibold text-gray-700 shadow-sm
                           hover:border-red-300 hover:bg-red-50/50 hover:text-gray-900 hover:shadow
                           transition-all"
              >
                <Avatar src={user.avatar_url} name={user.name} position={user.avatar_position} scale={user.avatar_scale} size={28} />
                <span className="hidden sm:block">{user.tag ? `@${user.tag}` : user.name}</span>
                <span className="sm:hidden">Profile</span>
              </Link>
              {burger}
              <button
                type="button"
                onClick={logout}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                title="Sign out"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <>
              {burger}
              <Button variant="primary" size="sm" onClick={openLoginModal} className="hidden sm:inline-flex">
                Sign in
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
