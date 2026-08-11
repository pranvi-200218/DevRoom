import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { UserProvider } from "./context/UserContext";
import RequireAuth from "./components/RequireAuth";
import Landing from "./pages/Landing";
import ResetPassword from "./pages/ResetPassword";
import JoinProject from "./pages/JoinProject";
import Home from "./pages/Home";
import ProjectDashboard from "./pages/ProjectDashboard";
import MemberManagement from "./pages/MemberManagement";
import TeamChat from "./pages/TeamChat";
import AIWorkspace from "./pages/AIWorkspace";
import ResourceVault from "./pages/ResourceVault";
import ProjectSettings from "./pages/ProjectSettings";

// NOTE: each page below still renders its own full sidebar + topbar exactly
// as authored in its source mockup (they weren't byte-identical to each
// other — different nav items, active states, avatar art — so unifying them
// into one shared <Layout> now would mean picking a winner and silently
// redesigning the others). Real shared-layout + <Outlet/> nesting is the
// next step, once sidebar state (active project, active tab) is wired to
// actual data instead of hardcoded markup.

// Small wrapper so RequireAuth only gates the routes nested under it,
// instead of the whole router (which used to hide Landing/ResetPassword
// behind a login wall even for logged-out visitors).
function ProtectedLayout() {
  return (
    <RequireAuth>
      <Outlet />
    </RequireAuth>
  );
}

export default function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes — no auth required */}
          <Route path="/" element={<Landing />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected routes — RequireAuth renders <Login/> in place of
              these if the visitor isn't signed in yet. */}
          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard" element={<Home />} />
            <Route path="/project/:projectId" element={<ProjectDashboard />} />
            <Route path="/project/:projectId/members" element={<MemberManagement />} />
            <Route path="/project/:projectId/chat" element={<TeamChat />} />
            <Route path="/project/:projectId/ai" element={<AIWorkspace />} />
            <Route path="/project/:projectId/resources" element={<ResourceVault />} />
            <Route path="/project/:projectId/settings" element={<ProjectSettings />} />
            <Route path="/join/:projectId" element={<JoinProject />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}