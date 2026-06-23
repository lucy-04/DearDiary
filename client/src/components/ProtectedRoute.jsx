import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// Gate the app behind a token. No token → bounce to login.
export default function ProtectedRoute({ children }) {
  const { user } = useAuth();
  const token = localStorage.getItem("token");
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
