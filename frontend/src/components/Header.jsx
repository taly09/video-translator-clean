import { useUser } from "@/context/UserContext";
import { User } from "@/entities/User";

export default function Header() {
  const { user, setUser, loading } = useUser();

  const handleLogout = async () => {
    await User.logout();
    setUser(null);
  };

  if (loading) return null;

  return (
    <header style={{ padding: "1rem", display: "flex", justifyContent: "flex-end" }}>
      {user ? (
        <button onClick={handleLogout}>🔒 התנתקות</button>
      ) : (
        <button onClick={User.login}>🔐 התחברות</button>
      )}
    </header>
  );
}
