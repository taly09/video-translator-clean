export function extractFilename(url) {
  if (!url) return "";
  try {
    return new URL(url).pathname.split("/").pop();
  } catch {
    return url.split("/").pop();
  }
}

export function parseSRTToBlocks(srtText) {
  if (!srtText) return [];
  const blocks = [];
  const entries = srtText.replace(/\r\n/g, "\n").trim().split(/\n{2,}/);
  for (const entry of entries) {
    const lines = entry.trim().split("\n");
    if (lines.length < 2) continue;
    const timeMatch = lines[1].match(/^(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})$/);
    if (!timeMatch) continue;
    blocks.push({
      start: timeMatch[1],
      end: timeMatch[2],
      text: lines.slice(2).join("\n").trim(),
    });
  }
  return blocks;
}
