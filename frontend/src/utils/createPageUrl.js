export function createPageUrl(name) {
  const routes = {
    Landing: "/",
    Upload: "/upload",
    Dashboard: "/dashboard",
    TranscriptionView: "/TranscriptionView",
    Transcriptions: "/transcriptions",
    Live: "/live",
    Pricing: "/pricing",
    LiveTranscription: "/live"
  };

  // תמיכה בפרמטרים כמו ?id=...
  const [page, query] = name.split("?");
  const path = routes[page] || "/";
  return query ? `${path}?${query}` : path;
}
