import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { createPageUrl } from "@/utils/createPageUrl";

export default function SidebarLink({ to, icon, tKey, isActive, badgeKey, closeMenu }) {
  const { t } = useTranslation();

  const label = t(tKey);
  const badge = badgeKey ? t(badgeKey) : null;

  return (
    <Link
      to={createPageUrl(to)}
      onClick={closeMenu}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
        isActive ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100 text-gray-700"
      }`}
    >
      {icon}
      <span>{label}</span>
      {badge && (
        <span
          className={`ml-auto text-xs px-2 py-0.5 rounded-full font-semibold ${
            ["חדש!", "New!", "جديد!"].includes(badge)
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}
