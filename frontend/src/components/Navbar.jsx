// components/Navbar.jsx
import { Link } from "react-router-dom";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function Navbar() {
  return (
    <header className="bg-white dark:bg-slate-900 shadow-md sticky top-0 z-50 border-b border-gray-200 dark:border-slate-700">
      <div dir="rtl" className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* לוגו */}
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity duration-300">
          <img src="/logo.png" alt="Logo" className="h-10 object-contain" />
        </Link>

        {/* בורר שפה */}
        <LanguageSwitcher />
      </div>
    </header>
  );
}
