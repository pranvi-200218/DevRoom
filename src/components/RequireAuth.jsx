import { useAuth } from "../context/UserContext";
import Login from "../pages/Login";

export default function RequireAuth({ children }) {
  const { user, loading } = useAuth();

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