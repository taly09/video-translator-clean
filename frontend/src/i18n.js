import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpApi from "i18next-http-backend";



i18n
  .use(HttpApi)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "he",
    supportedLngs: ["he", "en", "ar", "zh", "es", "ru", "de", "fr"],
    detection: {
      order: ["localStorage", "cookie", "navigator"], // querystring הוסר
      caches: ["localStorage", "cookie"],
    },
    backend: {
      loadPath: "/locales/{{lng}}/translation.json",
    },
    interpolation: {
      escapeValue: false,
    },
  });

// 🌍 זיהוי מדינה והגדרת שפה
fetch("https://ipapi.co/json/")
  .then(res => res.json())
  .then(data => {
    const country = data.country?.toLowerCase();
    const langByCountry = {
      il: "he",
      sa: "ar",
      eg: "ar",
      fr: "fr",
      de: "de",
      es: "es",
      ru: "ru",
      us: "en",
      gb: "en",
      cn: "zh",
    };
    const selectedLang = langByCountry[country] || "en";
    i18n.changeLanguage(selectedLang);
  })
  .catch(() => {
    i18n.changeLanguage("he"); // fallback במקרה של שגיאה
  });

export default i18n;
