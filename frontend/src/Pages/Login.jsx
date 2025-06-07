// src/Pages/Login.jsx

import React from "react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center">התחברות</h1>
        <form>
          <div className="mb-4">
            <label className="block mb-1 font-medium">אימייל</label>
            <input type="email" className="w-full border p-2 rounded" />
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-medium">סיסמה</label>
            <input type="password" className="w-full border p-2 rounded" />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
          >
            התחבר
          </button>
        </form>
      </div>
    </div>
  );
}
