import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { UserProvider } from "./context/UserContext";
import RequireAuth from "./components/RequireAuth";
import RouteLoader from "./components/RouteLoader";

// Route-level code splitting: each page is its own chunk, only fetched when
// its route is actually visited. Landing stays eagerly imported since it's
// the first thing almost every visitor sees — no point splitting it out
// just to immediately re-request it. Cuts the old single ~680KB bundle
// down into per-route chunks (see the Vite build warning this fixes).
import Landing from "./pages/Landing";
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const JoinProject = lazy(() => import("./pages/JoinProject"));
const Home = lazy(() => import("./pages/Home"));
const ProjectDashboard = lazy(() => import("./pages/ProjectDashboard"));
const MemberManagement = lazy(() => import("./pages/MemberManagement"));
const TeamChat = lazy(() => import("./pages/TeamChat"));
const AIWorkspace = lazy(() => import("./pages/AIWorkspace"));
const ResourceVault = lazy(() => import("./pages/ResourceVault"));
const ProjectSettings = lazy(() => import("./pages/ProjectSettings"));

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
        <Suspense fallback={<RouteLoader />}>
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
        </Suspense>
      </BrowserRouter>
    </UserProvider>
  );
}