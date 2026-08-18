import { useAuth } from "../context/UserContext";
import Login from "../pages/Login";
import Loader from "./Loader";

export default function RequireAuth({ children }) {
  const { user, loading } = useAuth();

  // Recovery links must work even when the visitor isn't logged in yet —
  // this is exactly the pre-invited-account case, so never gate it.
  if (window.location.pathname.startsWith("/reset-password")) {
    return children;
  }

  if (loading) {
    return <Loader fullPage label="checking_session..." size="lg" />;
  }

  if (!user) {
    return <Login />;
  }

  return children;
}