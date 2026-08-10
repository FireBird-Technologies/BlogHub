import { Link } from "react-router-dom";
import { LEGAL } from "../../constants/legal";
import { blog2videoUrl, pdf2vidUrl } from "../../lib/blog2video";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 py-8 px-4 bg-white">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 text-sm text-gray-400 w-full">
        <div className="flex flex-col items-center sm:items-start gap-1.5 text-center sm:text-left">
          <span className="font-semibold text-gray-500">{LEGAL.siteName}</span>
          <span>
            © {new Date().getFullYear()} {LEGAL.siteName}. All rights reserved.
          </span>
        </div>
        <div className="flex flex-col items-center sm:items-start gap-1.5 text-center sm:text-left">
          <Link to="/submit-your-newsletter" className="hover:text-gray-700 transition-colors">
            Submit your newsletter
          </Link>
          <Link to="/blogs" className="hover:text-gray-700 transition-colors">
            Blogs
          </Link>
          <Link to="/terms" className="hover:text-gray-700 transition-colors">
            Terms of Service
          </Link>
          <Link to="/privacy" className="hover:text-gray-700 transition-colors">
            Privacy Policy
          </Link>
        </div>
        {/* Reciprocal links to the two sibling properties. Both sites carry
            BlogHub in their own footers; the UTM tags (see lib/blog2video.ts)
            let each receiving domain attribute the referral. */}
        <div className="flex flex-col items-center sm:items-start gap-1.5 text-center sm:text-left">
          <span className="font-semibold text-gray-500">Also from FireBird</span>
          <a
            href={blog2videoUrl("footer")}
            className="hover:text-gray-700 transition-colors"
          >
            Blog2Video — URL to video
          </a>
          <a href={pdf2vidUrl("footer")} className="hover:text-gray-700 transition-colors">
            PDF2Video — document to video
          </a>
        </div>
      </div>
    </footer>
  );
}
