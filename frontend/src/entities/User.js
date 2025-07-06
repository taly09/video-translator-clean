const API_BASE_URL = ""; // כי אנחנו משתמשים ב-proxy של Vite

export const User = {
  /**
   * מביא את המשתמש הנוכחי מה-session
   * מחזיר null אם לא מחובר
   */
  async me() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/user/me`, {
      credentials: "include", // חשוב כדי לשלוח את ה-cookie של ה-session
    });

    console.log("👤 user res:", res);

    if (!res.ok) {
      console.warn("⚠️ לא מחובר או שגיאה בקבלת המשתמש");
      return null;
    }

    const data = await res.json();
    console.log("👤 user data:", data);  // ⬅ כאן להוסיף את ה-console.log
    return data.data?.user || null;      // ⬅ וגם את התיקון למבנה הנכון
  } catch (err) {
    console.error("❌ שגיאה בקבלת המשתמש:", err);
    return null;
  }
}
,

  /**
   * מפנה את המשתמש להתחברות עם Google
   */
  async login() {
    // שולח את המשתמש ל־/login/google ב-backend
    window.location.href = `/login/google`;
  },

  /**
   * מנתק את המשתמש מה-session ומחזיר לדף הבית
   */
  async logout() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        console.log("✅ Logged out successfully");
        // החזר לדף הבית או כל דף אחר
        window.location.href = "/";
      } else {
        console.error("❌ Logout failed", res.status);
      }
    } catch (err) {
      console.error("❌ Logout error:", err);
    }
  }
};
