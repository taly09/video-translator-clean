export function createPageUrl(name) {
  const routes = {
  Landing: "/",
  Upload: "/upload",
  Dashboard: "/dashboard",
  TranscriptionView: "/transcription-view",
  Transcriptions: "/transcriptions",
  Live: "/live",
  Pricing: "/pricing",
  LiveTranscription: "/live",
  Studio: "/studio",
  Preview: "/preview"  // ✅ הוספת כאן!
};



  // תמיכה בפרמטרים כמו ?id=...
  const [page, query] = name.split("?");
  const path = routes[page] || "/";
  return query ? `${path}?${query}` : path;
}
