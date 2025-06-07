import React from "react";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";

const languages = [
  { code: "he", label: "עברית", flag: "🇮🇱" },
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
];

export default function LanguageSwitcher() {
  const { i18n: i18nInstance } = useTranslation();

  const changeLanguage = (lng) => {
    i18nInstance.changeLanguage(lng);
  };

  return (
    <div className="relative inline-block text-left">
      <select
        onChange={(e) => changeLanguage(e.target.value)}
  value={i18nInstance.language}
        className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-200 text-sm"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
}
