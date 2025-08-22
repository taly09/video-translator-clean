// src/context/UserContext.jsx

import React, { createContext, useContext, useState, useEffect } from "react";
import { User as UserAPI } from "@/entities/User";

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // פונקציה שנטענת גם באפקט וגם ב–AutoLoginHandler
  const loadUser = async () => {
    setLoading(true);
    try {
      const fetched = await UserAPI.me();
      setUser(fetched || null);
    } catch (err) {
      console.error("❌ שגיאה בטעינת המשתמש:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // טעינת המשתמש אוטומטית כשרכיב ה–Provider עולה
  useEffect(() => {
    loadUser();
  }, []);

  // פונקציות התחברות / התנתקות
  const login = () => UserAPI.login();
  const logout = () => UserAPI.logout();

  return (
    <UserContext.Provider value={{ user, loading, login, logout, loadUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
