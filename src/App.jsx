import { lazy, Suspense, useLayoutEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { gsap } from "gsap";
import { UserProvider } from "./context/UserContext";
import { ToastProvider } from "./components/Toast";
import { DialogProvider } from "./components/Dialog";
import ErrorBoundary from "./components/ErrorBoundary";
import RequireAuth from "./components/RequireAuth";
import RouteLoader from "./components/RouteLoader";

// Route-level code splitting: each page is its own chunk, only fetched when
// its route is actually visited. Landing stays eagerly imported since it's
// the first thing almost every visitor sees.
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

function ProtectedLayout() {
  return (
    <RequireAuth>
      <Outlet />
    </RequireAuth>
  );
}

// Cross-fade between routes instead of a hard cut. Respects
// prefers-reduced-motion (skips straight to the final state).
function PageTransition({ children }) {
  const location = useLocation();
  const ref = useRef(null);

  useLayoutEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!ref.current) return;
    if (reduced) {
      gsap.set(ref.current, { opacity: 1 });
      return;
    }
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.35, ease: "power2.out", clearProps: "transform" }
      );
    });
    return () => ctx.revert();
  }, [location.pathname]);

  return <div ref={ref}>{children}</div>;
}

export default function App() {
  return (
    <UserProvider>
      <ToastProvider>
        <DialogProvider>
          <BrowserRouter>
            <Suspense fallback={<RouteLoader />}>
              <PageTransition>
                <ErrorBoundary>
                  <Routes>
                    {/* Public routes — no auth required */}
                    <Route path="/" element={<Landing />} />
                    <Route path="/reset-password" element={<ResetPassword />} />

                    {/* Protected routes — RequireAuth renders <Login/> in place
                        of these if the visitor isn't signed in yet. */}
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
                </ErrorBoundary>
              </PageTransition>
            </Suspense>
          </BrowserRouter>
        </DialogProvider>
      </ToastProvider>
    </UserProvider>
  );
}