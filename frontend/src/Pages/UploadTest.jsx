import React from "react";

export default function UploadTest() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded shadow-md">
        <h1 className="text-xl font-bold mb-4">העלאת קובץ (בדיקה)</h1>
        <input type="file" />
      </div>
    </div>
  );
}
