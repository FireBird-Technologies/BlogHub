import { useNavigate } from "react-router-dom";
import { ArrowLeft, Compass } from "lucide-react";
import Navbar from "../components/layout/Navbar";

interface NotFoundProps {
  title?: string;
  message?: string;
}

export default function NotFound({
  title = "Page does not exist",
  message = "The page you’re looking for doesn’t exist or has been removed.",
}: NotFoundProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="text-7xl sm:text-8xl font-extrabold text-red-100 select-none">404</div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">{title}</h1>
        <p className="text-sm text-gray-500 mt-3 max-w-md">{message}</p>

        <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 bg-white
                       text-sm font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={14} /> Go back
          </button>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700
                       text-sm font-medium text-white transition-colors shadow-sm shadow-red-600/20"
          >
            <Compass size={14} /> Browse publications
          </button>
        </div>
      </main>
    </div>
  );
}
