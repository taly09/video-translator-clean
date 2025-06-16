import React, { useEffect, useState } from "react";
import { User } from "@/entities/User";
import { LogOut } from "lucide-react";

export default function UserMenu() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const u = await User.me();
        setUser(u);
      } catch (err) {
        // לא מחובר
      }
    }
    fetchUser();
  }, []);

  if (!user) return null;

  return (
    <div className="flex items-center gap-3 p-2 bg-white rounded-lg shadow border">
      <img
        src={user.picture}
        alt={user.full_name}
        className="w-8 h-8 rounded-full"
        referrerPolicy="no-referrer"
      />
      <span className="text-sm font-medium">{user.full_name}</span>
      <button
        onClick={User.logout}
        className="text-sm text-red-600 hover:underline flex items-center gap-1"
      >
        <LogOut className="w-4 h-4" />
        יציאה
      </button>
    </div>
  );
}
