import { Link } from "react-router-dom";
import { LEGAL } from "../../constants/legal";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 py-8 px-4 bg-white">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 text-sm text-gray-400 w-full">
        <div className="flex flex-col items-start gap-1.5 text-left">
          <span className="font-semibold text-gray-500">{LEGAL.siteName}</span>
          <span>
            © {new Date().getFullYear()} {LEGAL.siteName}. All rights reserved.
          </span>
        </div>
        <div className="flex flex-col items-start gap-1.5 text-left">
          <Link to="/terms" className="hover:text-gray-700 transition-colors">
            Terms of Service
          </Link>
          <Link to="/privacy" className="hover:text-gray-700 transition-colors">
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}
