import "@/lib/patchFetch"; // 👈 חייב להיות לפני כל דבר אחר שמשתמש ב-fetch

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// רק ב־production נטען ומירשמים ל־Service Worker
if (import.meta.env.PROD) {
  import("./registerServiceWorker");
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
