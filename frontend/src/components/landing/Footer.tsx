export default function Footer() {
  return (
    <footer className="border-t border-gray-200 py-8 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
        <span className="font-semibold text-gray-500">BlogHub</span>
        <span>© {new Date().getFullYear()} BlogHub. All rights reserved.</span>
      </div>
    </footer>
  );
}
