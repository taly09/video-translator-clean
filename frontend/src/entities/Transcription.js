export const Transcription = {
  async list({ limit = 10, skip = 0 } = {}) {
    const res = await fetch(`/api/transcriptions?limit=${limit}&skip=${skip}`, {
      method: "GET",
      credentials: "include",
    });

    if (!res.ok) throw new Error("Failed to fetch transcriptions");

    const json = await res.json();

    return {
      results: Array.isArray(json.data)
        ? json.data.map((t) => ({
            ...t,
            id: t.id || t.task_id || crypto.randomUUID(), // fallback חכם
            title: t.title || t.file_name || "ללא שם",
            created_date: t.created_date || t.created_at || null,
            duration: t.duration || 0,
            accuracy: t.accuracy || null,
            language: t.language || "auto",
            source_type: t.source_type || "upload", // "live" / "whatsapp" / "upload"
            status: t.status || "unknown",
          }))
        : [],
      total: Array.isArray(json.data) ? json.data.length : 0,
    };
  },


  async get(id) {
    const res = await fetch(`/api/transcriptions/${id}`, {
      method: "GET",
      credentials: "include",
    });

    if (!res.ok) throw new Error(`Failed to fetch transcription with ID ${id}`);

    const json = await res.json();
    return json.data; // ✅ מחזיר רק את ה־data
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

  async burn(id) {
    const res = await fetch(`/api/transcriptions/burn/${id}`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to burn subtitles");
    return await res.json();
  },

  async summary(id) {
    const res = await fetch(`/api/transcriptions/summary/${id}`, {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch AI summary");
    return await res.json();
  },

  async checkAllowance() {
    const res = await fetch(`/api/transcriptions/check-allowance`, {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to check allowance");
    return await res.json();
  },
};
