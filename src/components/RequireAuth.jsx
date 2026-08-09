import { useAuth } from "../context/UserContext";
import Login from "../pages/Login";

export default function RequireAuth({ children }) {
  const { user, loading } = useAuth();

  // Recovery links must work even when the visitor isn't logged in yet —
  // this is exactly the pre-invited-account case, so never gate it.
  if (window.location.pathname.startsWith("/reset-password")) {
    return children;
  }

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background text-on-surface-variant text-sm">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return children;
}