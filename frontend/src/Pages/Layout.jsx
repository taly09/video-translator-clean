import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { createPageUrl } from "@/utils/createPageUrl";
import { User } from "@/entities/User";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  FileText, Upload, Home, LogOut, Sparkles,
  User as UserIcon, MessageSquare, Mic, Crown,
  Menu, X, Settings, BarChart3, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function LayoutContent({ children }) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const direction = i18n.language === "he" ? "rtl" : "ltr";

  // Load user data
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await User.me();
        setUser(userData);
      } catch (error) {
        console.log("User not authenticated");
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  // Hide layout for landing page
  // if (location.pathname === createPageUrl("Landing") || location.pathname === "/") {
  //   return <>{children}</>;
  // }

  const handleLogout = async () => {
    await User.logout();
    window.location.href = createPageUrl("Landing");
  };
  
  const handleLogin = async () => {
    await User.login();
  };

  const navItems = [
    {
    to: "",
    icon: Sparkles,
    label: "דף הבית"
  },
    { 
      to: "Dashboard", 
      icon: BarChart3, 
      label: "דשבורד",
    },
    { 
      to: "Upload", 
      icon: Upload, 
      label: "העלאת קבצים",
      highlight: true
    },
    { 
      to: "WhatsAppUpload", 
      icon: MessageSquare, 
      label: "תמלול WhatsApp",
      badge: "חדש"
    },
    { 
      to: "LiveTranscription", 
      icon: Mic, 
      label: "תמלול חי",
      badge: "Pro"
    },
      {
  to: "Pricing",
  icon: Crown,
  label: "תמחור"
}

  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 overflow-hidden" dir={direction}>
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

        .dark .glass-effect {
          background: linear-gradient(145deg,
            rgba(30, 41, 59, 0.9) 0%,
            rgba(30, 41, 59, 0.7) 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .luxury-shadow {
          box-shadow:
            0 25px 50px -12px rgba(0, 0, 0, 0.25),
            0 0 0 1px rgba(255, 255, 255, 0.1);
        }

        .dark .luxury-shadow {
          box-shadow:
            0 25px 50px -12px rgba(0, 0, 0, 0.5),
            0 0 0 1px rgba(255, 255, 255, 0.05);
        }

        .nav-link {
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          position: relative;
          overflow: hidden;
        }

        .floating-animation {
          animation: float 6s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }

        .pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite alternate;
        }

        @keyframes pulse-glow {
          from {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
          }
          to {
            box-shadow: 0 0 30px rgba(59, 130, 246, 0.6);
          }
        }
      `}</style>

      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 right-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="glass-effect rounded-full w-12 h-12 shadow-lg"
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </div>

      {/* Sidebar */}
      <AnimatePresence>
{(isMenuOpen || typeof window !== 'undefined' && window.innerWidth >= 1024) && (
  <motion.aside
    initial={{ x: direction === "rtl" ? 300 : -300, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    exit={{ x: direction === "rtl" ? 300 : -300, opacity: 0 }}
    transition={{ duration: 0.3, ease: "easeInOut" }}
    className="fixed lg:relative inset-y-0 left-0 lg:left-auto z-40 w-80 glass-effect luxury-shadow"
  >

            <div className="flex flex-col h-full p-6">
              {/* Logo */}
<Link to={createPageUrl("Dashboard")} className="mb-10 flex justify-center">
                <img src="/logo.png" alt="Logo" className="h-36 w-36 object-contain" />
                {/*<div>*/}
                {/*  /!*<h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">*!/*/}
                {/*  /!*  TranscribePro*!/*/}
                {/*  /!*</h1>*!/*/}
                {/*  /!*<p className="text-xs text-slate-500 dark:text-slate-400">AI Transcription</p>*!/*/}
                {/*</div>*/}
              </Link>

              {/* User Info */}
              {user && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {user.full_name?.charAt(0) || "U"}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                        {user.full_name || "משתמש"}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Navigation */}
              <nav className="flex-1 space-y-2">
                {navItems.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === createPageUrl(item.to);
                  
                  return (
                    <motion.div
                      key={item.to}
                      initial={{ opacity: 0, x: direction === "rtl" ? 50 : -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                        to={createPageUrl(item.to)}
                        className={`nav-link flex items-center gap-4 px-4 py-4 rounded-2xl text-base font-medium transition-all group ${
                          isActive
                            ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg pulse-glow"
                            : item.highlight
                            ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 text-green-700 dark:text-green-300 hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900/30 dark:hover:to-emerald-900/30"
                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Icon className={`w-5 h-5 ${isActive ? "text-white" : ""}`} />
                        <span className="flex-1">{item.label}</span>
                        {item.badge && (
                          <Badge
                            variant="secondary"
                            className="text-xs bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>

              {/* Theme & Language Controls */}
              <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">הגדרות</span>
                  <div className="flex items-center gap-2">
                    <LanguageSwitcher />
                    <ThemeToggle />
                  </div>
                </div>

                {/* Auth Button */}
                {user ? (
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="w-full justify-start gap-3 rounded-xl border-slate-200 dark:border-slate-700 hover:bg-red-50 hover:border-red-200 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:border-red-700 dark:hover:text-red-400"
                  >
                    <LogOut className="w-4 h-4" />
                    התנתק
                  </Button>
                ) : (
                  <Button
                    onClick={handleLogin}
                    className="w-full justify-start gap-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl shadow-lg"
                  >
                    <UserIcon className="w-4 h-4" />
                    התחבר
                  </Button>
                )}
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="h-full">
          {children}
        </div>
      </main>

      {/* Mobile Overlay */}
      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </div>
  );
}

export default function Layout({ children }) {
  return (
    <ThemeProvider>
      <LayoutContent>{children}</LayoutContent>
    </ThemeProvider>
  );
}