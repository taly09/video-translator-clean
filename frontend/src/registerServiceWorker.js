// src/registerServiceWorker.js

// אם הדפדפן תומך ב־Service Worker, הרשם אותו
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then(reg => {
        console.log("SW registered:", reg);
      })
      .catch(err => {
        console.error("SW registration failed:", err);
      });
  });
}
