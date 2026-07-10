import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { UserProvider } from "./context/UserContext";
import NameCaptureGate from "./components/NameCaptureGate";

import Home from "./pages/Home";
import ProjectDashboard from "./pages/ProjectDashboard";
import MemberManagement from "./pages/MemberManagement";
import TeamChat from "./pages/TeamChat";
import AIWorkspace from "./pages/AIWorkspace";
import ResourceVault from "./pages/ResourceVault";

// NOTE: each page below still renders its own full sidebar + topbar exactly
// as authored in its source mockup (they weren't byte-identical to each
// other — different nav items, active states, avatar art — so unifying them
// into one shared <Layout> now would mean picking a winner and silently
// redesigning the others). Real shared-layout + <Outlet/> nesting is the
// next step, once sidebar state (active project, active tab) is wired to
// actual data instead of hardcoded markup.
export default function App() {
  return (
    <UserProvider>
      <NameCaptureGate>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/project/:projectId" element={<ProjectDashboard />} />
            <Route path="/project/:projectId/members" element={<MemberManagement />} />
            <Route path="/project/:projectId/chat" element={<TeamChat />} />
            <Route path="/project/:projectId/ai" element={<AIWorkspace />} />
            <Route path="/project/:projectId/resources" element={<ResourceVault />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </NameCaptureGate>
    </UserProvider>
  );
}