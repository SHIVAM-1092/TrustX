import { useState, useEffect } from "react";
import { LandingPage } from "./pages/LandingPage";
import { LabsPage } from "./pages/LabsPage";
import { ChallengeWorkspace } from "./pages/ChallengeWorkspace";
import { ActivityPage } from "./pages/ActivityPage";
import { RedTeamLab } from "./pages/RedTeamLab";
import { BlueTeamLab } from "./pages/BlueTeamLab";

type Route =
  | { page: "landing" }
  | { page: "labs" }
  | { page: "workspace"; challengeId: string }
  | { page: "activity" }
  | { page: "red-lab"; challengeId: string }
  | { page: "blue-lab"; labId: string }
  | { page: "not-found" };

function parseHash(): Route {
  const rawHash = window.location.hash.slice(1);
  if (!rawHash || rawHash === "/" || rawHash === "") return { page: "landing" };

  // Handle trailing slashes and empty hash
  const hash = rawHash.replace(/\/$/, "");

  if (hash === "/labs") return { page: "labs" };
  if (hash === "/activity") return { page: "activity" };

  const workspaceMatch = hash.match(/^\/labs\/([^/]+)$/);
  if (workspaceMatch) {
    return { page: "workspace", challengeId: workspaceMatch[1] };
  }

  const redLabMatch = hash.match(/^\/red-lab\/([^/]+)$/);
  if (redLabMatch) {
    return { page: "red-lab", challengeId: redLabMatch[1] };
  }

  const blueLabMatch = hash.match(/^\/blue-lab\/([^/]+)$/);
  if (blueLabMatch) {
    return { page: "blue-lab", labId: blueLabMatch[1] };
  }

  return { page: "not-found" };
}

export default function App() {
  const [route, setRoute] = useState<Route>(parseHash);

  useEffect(() => {
    const handler = () => setRoute(parseHash());
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  switch (route.page) {
    case "landing":
      return <LandingPage />;
    case "labs":
      return <LabsPage />;
    case "workspace":
      return <ChallengeWorkspace challengeId={route.challengeId} />;
    case "activity":
      return <ActivityPage />;
    case "red-lab":
      return <RedTeamLab challengeId={route.challengeId} />;
    case "blue-lab":
      return <BlueTeamLab labId={route.labId} />;
    case "not-found":
      return (
        <div className="app-layout">
          <header className="app-header">
            <div className="header-inner">
              <a href="#/" className="brand">
                <span className="brand-mark">TRUST</span><span className="brand-accent">X</span>
              </a>
              <nav className="nav-primary">
                <a href="#/" className="nav-link">Dashboard</a>
                <a href="#/labs" className="nav-link">Labs</a>
                <a href="#/activity" className="nav-link">Activity</a>
              </nav>
            </div>
          </header>
          <main className="app-main" style={{ padding: "48px 24px", textAlign: "center" }}>
            <h1 style={{ fontSize: "32px", marginBottom: "16px" }}>404 — Page Not Found</h1>
            <p style={{ color: "#94a3b8", marginBottom: "24px" }}>
              The route <strong style={{ color: "#f8fafc" }}>{window.location.hash}</strong> does not exist.
            </p>
            <a href="#/" className="btn btn-primary">Return to Dashboard</a>
          </main>
        </div>
      );
    default:
      return <LandingPage />;
  }
}