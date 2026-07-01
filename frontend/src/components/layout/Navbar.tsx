import { Link } from "react-router-dom";
import { ArrowRight, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import { blog2videoUrl } from "../../lib/blog2video";

export default function Navbar() {
  const { user, loading, logout, openLoginModal } = useAuth();

  // Logged-in users go to the dashboard; logged-out users go to the landing page.
  const logoTo = user ? "/dashboard" : "/";

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
          <Link
            to="/blogs"
            className="text-sm font-semibold text-gray-600 hover:text-red-600 transition-colors"
          >
            Blogs
          </Link>
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
                <Avatar src={user.avatar_url} name={user.name} size={28} />
                <span className="hidden sm:block">{user.tag ? `@${user.tag}` : user.name}</span>
                <span className="sm:hidden">Profile</span>
              </Link>
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
            <Button variant="primary" size="sm" onClick={openLoginModal}>
              Sign in
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
