import { Navigate } from "react-router-dom";
import { useUser } from "@/context/UserContext";

export default function PrivateRoute({ children }) {
  const { user, loading } = useUser();

  if (loading) return null; // אפשר גם Spinner

  return user ? children : <Navigate to="/login" replace />;
}
