import React from "react";

export const VideoPlayer = ({ videoUrl, transcriptionId }) => {
  const extractFilename = (url) => {
    if (!url) return "";
    const parts = url.split("/");
    return parts[parts.length - 1];
  };

  const fullUrl = `${import.meta.env.VITE_API_BASE_URL}/api/proxy/results/${transcriptionId}/${extractFilename(videoUrl)}`;

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-2">🎬 צפייה בסרטון עם כתוביות</h2>
      <video
        controls
        className="w-full rounded-md shadow-md"
        style={{ maxHeight: "600px", backgroundColor: "#000" }}
      >
        <source src={fullUrl} type="video/mp4" />
        הדפדפן שלך לא תומך בווידאו.
      </video>
    </div>
  );
};
