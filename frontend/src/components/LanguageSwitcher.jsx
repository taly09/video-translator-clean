import React from "react";
import i18n from "@/i18n"; // ✅ נתיב נכון עבור שימוש

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe } from "lucide-react";

const languages = [
  { code: "he", label: "עברית", flag: "🇮🇱" },
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
];

export function LanguageSwitcher() {
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem("i18nextLng", lng); // שמירה בלוקל סטורג'
  };

  const selectedLanguage = languages.find(l => l.code === i18n.language) || languages[0];

  return (
    <Select onValueChange={changeLanguage} value={i18n.language}>
      <SelectTrigger className="w-auto bg-transparent border-0 gap-2 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50">
        <Globe className="w-4 h-4" />
        <SelectValue placeholder={selectedLanguage.label} />
      </SelectTrigger>
      <SelectContent>
        {languages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            <div className="flex items-center gap-2">
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
