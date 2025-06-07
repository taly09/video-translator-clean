import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { createPageUrl } from "@/utils/createPageUrl";
import { User } from "@/entities/User";
import Logo from "@/components/Logo";
console.log("📦 Layout נטען");


import {
  FileText, Upload, Home, LogOut,
  User as UserIcon, MessageSquare, Mic, Crown,
  Sparkles, Menu, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import SidebarLink from "@/components/SidebarLink";

console.log("📥 Layout component פועל"); // בדיוק פה ↓

export default function Layout({ children }) {
      console.log("📥 Layout component פועל");

  const { t, i18n } = useTranslation();
  const direction = ["he", "ar"].includes(i18n.language) ? "rtl" : "ltr";

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
        console.log("🟡 Layout useEffect: user =", user, "loading =", loading);

    async function fetchUser() {
      try {
        const userData = await User.me();
        setUser(userData?.user);
      } catch {
        console.log("User not authenticated");
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  const isActive = (pageName) => location.pathname === createPageUrl(pageName);
  const handleLogout = async () => {
      console.log("🔴 handleLogout התחיל"); // בדיקה

    await User.logout();
    window.location.href = createPageUrl("Landing");
  };
  const handleLogin = async () => {
    await User.login();
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 overflow-hidden" dir={direction}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

        * {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .glass-effect {
          backdrop-filter: blur(20px);
          background: linear-gradient(145deg,
            rgba(255, 255, 255, 0.9) 0%,
            rgba(255, 255, 255, 0.7) 100%);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .luxury-shadow {
          box-shadow:
            0 25px 50px -12px rgba(0, 0, 0, 0.25),
            0 0 0 1px rgba(255, 255, 255, 0.1);
        }

        .gradient-text {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .btn-premium {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          box-shadow:
            0 15px 35px rgba(102, 126, 234, 0.4),
            0 5px 15px rgba(0, 0, 0, 0.1);
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        }

        .btn-premium:hover {
          transform: translateY(-2px);
          box-shadow:
            0 25px 50px rgba(102, 126, 234, 0.6),
            0 10px 25px rgba(0, 0, 0, 0.15);
        }

        .sidebar-link {
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        }

        .sidebar-link:hover {
          transform: translateX(-3px);
        }
      `}</style>

      {/* Mobile Menu Button */}
      <button
        className="md:hidden fixed top-6 right-6 z-50 glass-effect p-3 rounded-2xl luxury-shadow"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside
  className={`fixed top-0 right-0 h-full w-80 z-40 glass-effect luxury-shadow
  overflow-y-auto
  transition-transform duration-500 transform
  ${isMenuOpen ? "translate-x-0" : "translate-x-full"}
  md:translate-x-0 md:static md:block`}
>

        {/* Logo Section */}
{/* Logo Section */}
<div className="relative border-b border-gray-200 p-4 flex justify-center" style={{ height: "72px" }}>
  <Link to="/" onClick={() => setIsMenuOpen(false)} style={{ position: "absolute", top: "-40px" }}>
    <img
      src="/logo.png"
      alt="Logo"
      style={{ height: "150px", objectFit: "contain", cursor: "pointer" }}
    />
  </Link>
</div>




        {/* Navigation */}
        <nav className="p-6 space-y-3 text-base font-semibold">
          <SidebarLink
            to="Landing"
            icon={<Home className="w-5 h-5" />}
            tKey="sidebar.home"
            isActive={isActive("Landing")}
            closeMenu={() => setIsMenuOpen(false)}
          />
          <SidebarLink
            to="Upload"
            icon={<Upload className="w-5 h-5" />}
            tKey="sidebar.upload"
            isActive={isActive("Upload")}
            closeMenu={() => setIsMenuOpen(false)}
          />
          <SidebarLink
            to="WhatsAppUpload"
            icon={<MessageSquare className="w-5 h-5" />}
            tKey="sidebar.whatsapp"
            isActive={isActive("WhatsAppUpload")}
            badgeKey="sidebar.new"
            closeMenu={() => setIsMenuOpen(false)}
          />
          <SidebarLink
            to="Dashboard"
            icon={<FileText className="w-5 h-5" />}
            tKey="sidebar.transcriptions"
            isActive={isActive("Dashboard")}
            closeMenu={() => setIsMenuOpen(false)}
          />
          <SidebarLink
            to="LiveTranscription"
            icon={<Mic className="w-5 h-5" />}
            tKey="sidebar.live"
            isActive={isActive("LiveTranscription")}
            badgeKey="sidebar.pro"
            closeMenu={() => setIsMenuOpen(false)}
          />
          <SidebarLink
            to="Pricing"
            icon={<Crown className="w-5 h-5" />}
            tKey="sidebar.pricing"
            isActive={isActive("Pricing")}
            closeMenu={() => setIsMenuOpen(false)}
          />
        </nav>

        {/* User Section */}
<div className="sticky bottom-0 right-0 left-0 p-6 border-t border-white/20 bg-white">
          {loading ? (
            <div className="h-16 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse rounded-2xl"></div>
          ) : user ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 glass-effect rounded-2xl">
                <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <UserIcon className="w-7 h-7 text-white" />
                </div>
                <div className="overflow-hidden">
                  <p className="font-bold text-slate-900 truncate text-lg">{user.full_name}</p>
                  <p className="text-sm text-slate-500 truncate font-medium">{user.email}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start h-15 rounded-xl border-2 font-semibold hover:scale-105 transition-all"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5 ml-2" />
                {t("sidebar.logout")}
              </Button>
            </div>
          ) : (
            <Button
              className="w-full btn-premium text-white border-0 h-14 rounded-xl font-bold"
              onClick={handleLogin}
            >
              <UserIcon className="w-5 h-5 ml-2" />
              {t("sidebar.login")}
            </Button>
          )}
        </div>
      </aside>

      {/* Main Content */}
<div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-auto">
          <div className="w-full">{children}</div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </div>
  );
}