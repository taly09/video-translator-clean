import React, { createContext, useContext, useState, useEffect } from "react";
import { User as UserAPI } from "@/entities/User";

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const fetchedUser = await UserAPI.me();
        setUser(fetchedUser || null);
      } catch (err) {
        console.error("❌ שגיאה בטעינת המשתמש:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []);

  const login = () => UserAPI.login();
  const logout = () => UserAPI.logout();

  return (
    <UserContext.Provider value={{ user, setUser, loading, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
