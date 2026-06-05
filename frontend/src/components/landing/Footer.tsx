import { Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 py-8 px-4 bg-white">
      <div className="max-w-6xl mx-auto flex flex-col items-center gap-3 text-sm text-gray-400">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
          <span className="font-semibold text-gray-500">BlogHub</span>
          <span>© {new Date().getFullYear()} BlogHub. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
