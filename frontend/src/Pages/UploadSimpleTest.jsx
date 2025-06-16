import React from "react";

export default function UploadSimple() {
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("נבחר קובץ:", file.name);
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>בחירת קובץ פשוטה</h1>
      <input type="file" onChange={handleFileChange} />
    </div>
  );
}
