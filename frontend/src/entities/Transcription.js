export const Transcription = {
  async list({ limit = 10, skip = 0 } = {}) {
    const res = await fetch(`/api/transcriptions?limit=${limit}&skip=${skip}`, {
      method: "GET",
      credentials: "include",
    });

    if (!res.ok) throw new Error("Failed to fetch transcriptions");

    const json = await res.json();

    return {
      results: Array.isArray(json.results) ? json.results : [],
      total: json.total || 0,
    };
  },

  async get(id) {
    const res = await fetch(`/api/transcriptions/${id}`, {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) throw new Error(`Failed to fetch transcription with ID ${id}`);
    return await res.json();
  },

  async create(data) {
    const result = {
      id: data.id || crypto.randomUUID(),
      title: data.title || data.original_filename || "תמלול",
      file_url: data.file_url,
      content: data.content || "",
      language: data.language || "auto",
      created_date: new Date().toISOString(),
      status: data.status || "processing",
      srt_url: data.srt_url || null,
      txt_url: data.txt_url || null,
      pdf_url: data.pdf_url || null,
      docx_url: data.docx_url || null,
      video_with_subs_url: data.video_with_subs_url || null,
    };

    const res = await fetch(`/api/transcriptions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(result),
    });

    if (!res.ok) throw new Error("Failed to save transcription");
    return await res.json();
  },

  async delete(id) {
    const res = await fetch(`/api/transcriptions/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to delete transcription");
    return true;
  },

  // 🆕 פונקציה לעדכון תמלול (למשל תוכן SRT)
  async update(id, data) {
    const res = await fetch(`/api/transcriptions/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update transcription");
    return await res.json();
  },

  // 🆕 פונקציה לקריאה להטמעת כתוביות
  async burn(id) {
    const res = await fetch(`/api/transcriptions/burn/${id}`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to burn subtitles");
    return await res.json();
  },

  // 🆕 פונקציה לסיכום AI
  async summary(id) {
    const res = await fetch(`/api/transcriptions/summary/${id}`, {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch AI summary");
    return await res.json();
  },

  // 🆕 בדיקת מגבלות שימוש (Freemium)
  async checkAllowance() {
    const res = await fetch(`/api/transcriptions/check-allowance`, {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to check allowance");
    return await res.json(); // לדוגמה: { allowed: true, remaining_minutes: 23, plan: "free" }
  },
};
