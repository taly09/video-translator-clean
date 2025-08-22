// /src/entities/User.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // למשל: http://localhost:8765

export const User = {
  // קריאה למשתמש הנוכחי
  async me() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/me`, {
        credentials: "include",
      });
      if (!res.ok) return null; // 401 לפני התחברות זה תקין
      const data = await res.json();
      return data?.data?.user || null;
    } catch (err) {
      console.error("❌ שגיאה בקבלת המשתמש:", err);
      return null;
    }
  },

  // לוגין עם Google – ניווט לשרת (לא לפרונטאנד)
  login() {
    const frontend = window.location.origin;
    const next = frontend + window.location.pathname + window.location.search;
    window.location.assign(
      `${API_BASE_URL}/login/google?frontend=${encodeURIComponent(frontend)}&next=${encodeURIComponent(next)}`
    );
  },

  // לוגין דמה (DEV בלבד)
  async loginDev() {
    const res = await fetch(`${API_BASE_URL}/api/login/dev`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) {
      alert("Dev login failed");
      return;
    }
    window.location.reload();
  },

  // התנתקות
  async logout() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/logout`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        window.location.href = "/"; // או /login
      } else {
        console.error("❌ Logout failed", res.status);
      }
    } catch (err) {
      console.error("❌ Logout error:", err);
    }
  },
};
