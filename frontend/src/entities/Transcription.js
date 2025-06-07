export const Transcription = {
  async list({ limit = 10, skip = 0 } = {}) {
  const res = await fetch(`http://localhost:8765/api/transcriptions?limit=${limit}&skip=${skip}`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) throw new Error("Failed to fetch transcriptions");

  const json = await res.json();

  // מחזיר גם את התוצאות וגם כמה יש בסך הכול
  return {
    results: Array.isArray(json.results) ? json.results : [],
    total: json.total || 0
  };
}

,


  async get(id) {
    const res = await fetch(`http://localhost:8765/api/transcriptions/${id}`);
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
  video_with_subs_url: data.video_with_subs_url || null, // ← הוספה חשובה
};


    const res = await fetch("http://localhost:8765/api/transcriptions", {
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
    const res = await fetch(`http://localhost:8765/api/transcriptions/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to delete transcription");
    return true;
  },
};
