const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const User = {
  async me() {
    const res = await fetch(`${API_BASE_URL}/api/user/me`, {
      credentials: "include",
    });
    console.log("👤 user res:", res);

if (!res.ok) {
  return null;
}
    return await res.json();
  },

  async login() {
    window.location.href = `${API_BASE_URL}/login/google`;
  },

  async logout() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/logout`, {
      method: "POST",
      credentials: "include",
    });

    if (!res.ok) {
      console.error("❌ Logout failed", res.status);
    } else {
      console.log("✅ Logged out successfully");
    }
  } catch (err) {
    console.error("❌ Logout error:", err);
  }
}



};
