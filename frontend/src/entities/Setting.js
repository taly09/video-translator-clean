const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8765";

export const Setting = {
  async list() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/settings`);

      if (!res.ok) throw new Error("Failed to load settings");
      return await res.json();
    } catch (err) {
      console.error("Error fetching settings:", err);
      return [];
    }
  },

  async create(data) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save settings");
      return await res.json();
    } catch (err) {
      console.error("Error saving settings:", err);
      return null;
    }
  },

  async update(id, data) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/settings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update settings");
      return await res.json();
    } catch (err) {
      console.error("Error updating settings:", err);
      return null;
    }
  },
};
