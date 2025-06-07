// components/Navbar.jsx
import { Link } from "react-router-dom";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { UploadCloud, Grid, Settings } from "lucide-react";

export default function Navbar() {
  return (
    <header className="bg-white shadow-md sticky top-0 z-50 border-b border-gray-200">
      <div dir="rtl" className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* לוגו עם שם */}
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity duration-300">
        </Link>

        {/* ניווט וקישורים */}
        <nav className="flex gap-6 items-center text-gray-700 font-semibold">
          <Link
            to="/upload"
            className="flex items-center gap-1 hover:text-indigo-600 transition-colors duration-200"
          >
            <UploadCloud className="w-5 h-5" />
            העלה קובץ
          </Link>
          <Link
            to="/dashboard"
            className="flex items-center gap-1 hover:text-indigo-600 transition-colors duration-200"
          >
            <Grid className="w-5 h-5" />
            הדשבורד שלי
          </Link>
          <Link
            to="/settings"
            className="flex items-center gap-1 hover:text-indigo-600 transition-colors duration-200"
          >
            <Settings className="w-5 h-5" />
            הגדרות
          </Link>
        </nav>

        {/* סלקטור שפה */}
        <LanguageSwitcher />
      </div>
    </header>
  );
}
