import { useState, useEffect, useCallback } from "react";
import { Layout } from "../components/Layout";
import { Terminal } from "../components/Terminal";
import { api } from "../services/api";
import { ExecSession } from "../types";

interface BlueTeamLabProps {
  labId: string;
}

export function BlueTeamLab({ labId }: BlueTeamLabProps) {
  const [session, setSession] = useState<ExecSession | null>(null);
  const [initializing, setInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [detectionResults, setDetectionResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Lab data is static, but we can verify backend health
    setLoading(false);
  }, [labId]);

  const labs = [
    {
      id: "log-analysis-1",
      name: "Failed Login Detection",
      description: "Analyze authentication logs to detect brute-force and credential stuffing attempts.",
      objectives: [
        "Identify failed login patterns in auth.log",
        "Detect suspicious IP addresses",
        "Correlate sudo authentication failures",
        "Generate incident timeline"
      ],
      files: ["auth.log", "access.log"],
    },
    {
      id: "web-attack-1",
      name: "Web Attack Detection",
      description: "Analyze web server access logs to identify common attack patterns.",
      objectives: [
        "Identify SQL injection attempts",
        "Detect XSS payloads in requests",
        "Find directory traversal attempts",
        "Correlate with WAF alerts"
      ],
      files: ["access.log"],
    },
    {
      id: "persistence-1",
      name: "Persistence Investigation",
      description: "Investigate suspicious sudo commands and persistence mechanisms.",
      objectives: [
        "Find unauthorized sudo usage",
        "Detect persistence via cron/systemd",
        "Identify privilege escalation attempts",
        "Document evidence for incident report"
      ],
      files: ["auth.log"],
    },
    {
      id: "detection-rules-1",
      name: "Detection Rule Testing",
      description: "Test and validate detection rules against sample log data.",
      objectives: [
        "Run detection engine against auth.log",
        "Validate rule sensitivity",
        "Tune false positive rate",
        "Export detection results"
      ],
      files: ["auth.log", "detection_rule.json"],
    },
    {
      id: "network-investigation-1",
      name: "Network Traffic Investigation",
      description: "Analyze network traffic patterns to identify suspicious connections and data exfiltration attempts.",
      objectives: [
        "Identify unusual outbound connections from auth.log timestamps",
        "Detect suspicious IP addresses and port connections",
        "Correlate network events with process activity",
        "Generate network incident timeline"
      ],
      files: ["auth.log", "access.log"],
    },
    {
      id: "auth-incident-1",
      name: "Authentication Incident Investigation",
      description: "Investigate authentication anomalies and credential misuse events.",
      objectives: [
        "Identify abnormal authentication patterns and time anomalies",
        "Detect credential stuffing and brute-force patterns",
        "Correlate sudo authentication failures with privilege escalation",
        "Generate incident report with evidence"
      ],
      files: ["auth.log", "access.log"],
    },
  ];

  const currentLab = labs.find(l => l.id === labId) || labs[0];

  const handleSessionCreated = useCallback((sessionId: string) => {
    setSession({
      session_id: sessionId,
      created_at: new Date().toISOString(),
      last_used: new Date().toISOString(),
      working_dir: `/workspace/sessions/${sessionId}`,
      command_count: 0
    });
    setInitializing(false);
  }, []);

  const handleSessionDeleted = useCallback(() => {
    setSession(null);
    setAnalysisResults(null);
    setDetectionResults(null);
  }, []);

  const handleStartLab = async () => {
    setInitializing(true);
    setError(null);
    try {
      const health = await api.blueExecHealth();
      if (health.status !== "healthy") {
        throw new Error("Execution service not healthy. Check backend status.");
      }
      // Create session via API
      const newSession = await api.blueExecCreateSession();
      setSession({
        session_id: newSession.session_id,
        created_at: newSession.created_at,
        last_used: newSession.last_used,
        working_dir: newSession.working_dir,
        command_count: newSession.command_count
      });
      setInitializing(false);
    } catch (e) {
      setError(`Failed to start lab: ${e instanceof Error ? e.message : "Unknown error"}`);
      setInitializing(false);
    }
  };

  const handleStopLab = async () => {
    if (session) {
      try {
        await api.blueExecDeleteSession(session.session_id);
      } catch (e) {
        console.error("Failed to delete session:", e);
      }
      setSession(null);
      setAnalysisResults(null);
      setDetectionResults(null);
    }
  };

  const runAnalysis = async (searchTerms: string[]) => {
    if (!session) return;
    try {
      const logPath = `/workspace/sessions/${session.session_id}/auth.log`;
      const results = await api.blueExecAnalyze(logPath, searchTerms);
      setAnalysisResults(results);
    } catch (e) {
      setError(`Analysis failed: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  };

  const runDetection = async () => {
    if (!session) return;
    try {
      const logPath = `/workspace/sessions/${session.session_id}/auth.log`;
      const results = await api.blueExecDetect(logPath, session.session_id);
      setDetectionResults(results);
    } catch (e) {
      setError(`Detection failed: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  };

  return (
    <Layout>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <header className="workspace-header">
          <div className="workspace-header-content">
            <div className="workspace-title">
              <h1 className="workspace-title-text blue">
                🔵 {currentLab.name}
              </h1>
              <p className="workspace-subtitle">
                {currentLab.description}
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              {session ? (
                <button
                  onClick={handleStopLab}
                  disabled={initializing}
                  className="btn btn-secondary"
                  style={{ padding: "8px 16px" }}
                >
                  Stop Lab
                </button>
              ) : (
                <button
                  onClick={handleStartLab}
                  disabled={initializing}
                  className="btn btn-primary"
                  style={{ padding: "8px 16px" }}
                >
                  {initializing ? "Starting..." : "Start Lab"}
                </button>
              )}
            </div>
          </div>

          {initializing && (
            <div className="workspace-status initializing">
              <div className="spinner" style={{ width: "16px", height: "16px" }} />
              <span>Initializing Blue Team execution environment...</span>
            </div>
          )}

          {error && (
            <div className="workspace-status error">
              <span>⚠</span>
              <span>{error}</span>
              <button className="btn btn-ghost btn-sm" onClick={handleStartLab}>Retry</button>
            </div>
          )}
        </header>

        <div className="workspace-layout">
          {/* Left panel: Lab Instructions & Tools */}
          <div className="workspace-panel-left">
            <div className="card" style={{ padding: "20px" }}>
              <h3 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 600, color: "#f8fafc" }}>
                Learning Objectives
              </h3>
              <ul style={{ margin: 0, paddingLeft: "20px", color: "#cbd5e1", lineHeight: 1.8 }}>
                {currentLab.objectives.map((obj, i) => (
                  <li key={i} style={{ fontSize: "13px" }}>{obj}</li>
                ))}
              </ul>
            </div>

            <div className="card" style={{ padding: "20px" }}>
              <h3 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 600 }}>Practice Files</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {currentLab.files.map((file) => (
                  <span key={file} className="badge badge-info" style={{ fontSize: "12px" }}>
                    {file}
                  </span>
                ))}
              </div>
              <p style={{ margin: "12px 0 0", fontSize: "12px", color: "#64748b" }}>
                Files are available in your session workspace at <code>/workspace/sessions/{session?.session_id}/</code>
              </p>
            </div>

            {session && (
              <div className="card" style={{ padding: "20px" }}>
                <h3 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 600 }}>Quick Actions</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <button
                    onClick={() => runAnalysis(["Failed", "sudo", "authentication failure"])}
                    className="btn btn-secondary"
                    style={{ textAlign: "left" }}
                  >
                    🔍 Analyze Failed Logins
                  </button>
                  <button
                    onClick={() => runAnalysis(["Accepted", "Successful"])}
                    className="btn btn-secondary"
                    style={{ textAlign: "left" }}
                  >
                    ✅ Analyze Successful Logins
                  </button>
                  <button
                    onClick={runDetection}
                    className="btn btn-primary"
                    style={{ textAlign: "left" }}
                  >
                    🛡 Run Detection Engine
                  </button>
                  <button
                    onClick={() => runAnalysis(["find", "cron", "systemd", "ssh-key"])}
                    className="btn btn-secondary"
                    style={{ textAlign: "left" }}
                  >
                    🔎 Search Persistence Indicators
                  </button>
                </div>
              </div>
            )}

            {analysisResults && (
              <div className="card" style={{ padding: "20px", borderColor: "#38bdf8" }}>
                <h3 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 600, color: "#38bdf8" }}>
                  Analysis Results: {analysisResults.matches_found} matches in {analysisResults.total_lines} lines
                </h3>
                <div style={{ maxHeight: "200px", overflow: "auto", fontSize: "11px", fontFamily: "JetBrains Mono, monospace" }}>
                  {analysisResults.results.slice(0, 20).map((r: any, i: number) => (
                    <div key={i} style={{ marginBottom: "4px", padding: "6px", background: "#0a0e1a", borderRadius: "4px", color: "#cbd5e1" }}>
                      <span style={{ color: "#f87171" }}>{r.match}:</span> {r.line}
                    </div>
                  ))}
                  {analysisResults.results.length > 20 && (
                    <div style={{ color: "#64748b", fontSize: "11px" }}>
                      ... and {analysisResults.results.length - 20} more matches
                    </div>
                  )}
                </div>
              </div>
            )}

            {detectionResults && (
              <div className="card" style={{ padding: "20px", borderColor: "#10b981" }}>
                <h3 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 600, color: "#10b981" }}>
                  Detection Results
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "12px" }}>
                  <div style={{ background: "#065f46", padding: "10px", borderRadius: "6px", textAlign: "center" }}>
                    <div style={{ fontSize: "20px", fontWeight: "bold", color: "#f87171" }}>
                      {detectionResults.severity_distribution?.high || 0}
                    </div>
                    <div style={{ fontSize: "11px", color: "#cbd5e1" }}>High</div>
                  </div>
                  <div style={{ background: "#78350f", padding: "10px", borderRadius: "6px", textAlign: "center" }}>
                    <div style={{ fontSize: "20px", fontWeight: "bold", color: "#fbbf24" }}>
                      {detectionResults.severity_distribution?.medium || 0}
                    </div>
                    <div style={{ fontSize: "11px", color: "#cbd5e1" }}>Medium</div>
                  </div>
                  <div style={{ background: "#1e3a5f", padding: "10px", borderRadius: "6px", textAlign: "center" }}>
                    <div style={{ fontSize: "20px", fontWeight: "bold", color: "#38bdf8" }}>
                      {detectionResults.severity_distribution?.low || 0}
                    </div>
                    <div style={{ fontSize: "11px", color: "#cbd5e1" }}>Low</div>
                  </div>
                </div>
                <div style={{ maxHeight: "200px", overflow: "auto", fontSize: "11px", fontFamily: "JetBrains Mono, monospace" }}>
                  {detectionResults.patterns_found?.slice(0, 15).map((p: any, i: number) => (
                    <div key={i} style={{ marginBottom: "4px", padding: "6px", background: "#0a0e1a", borderRadius: "4px", color: "#cbd5e1" }}>
                      <span style={{
                        color: p.severity === "high" ? "#f87171" : p.severity === "medium" ? "#fbbf24" : "#38bdf8",
                        textTransform: "uppercase",
                        fontSize: "9px",
                        marginRight: "8px"
                      }}>{p.type}</span>
                      {p.line}
                    </div>
                  ))}
                  {detectionResults.patterns_found && detectionResults.patterns_found.length > 15 && (
                    <div style={{ color: "#64748b", fontSize: "11px" }}>
                      ... and {detectionResults.patterns_found.length - 15} more patterns
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right panel: Terminal */}
          <div className="workspace-panel-right card">
            <div className="terminal-header">
              <strong>Blue Team Execution Environment</strong>
              <div className="terminal-meta">
                <span>Session: {session?.session_id || "Not started"}</span>
                <span>Cmds: {session?.command_count || 0}</span>
              </div>
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
              {loading ? (
                <div className="state-container">
                  <div className="spinner"></div>
                  <p className="state-message">Loading lab configuration...</p>
                </div>
              ) : session ? (
                <Terminal
                  instanceId={`blue-lab-${labId}`}
                  team="blue"
                  initialSessionId={session.session_id}
                  onSessionCreated={handleSessionCreated}
                  onSessionDeleted={handleSessionDeleted}
                  initialCommand={["ls", "-la", "/workspace"]}
                />
              ) : (
                <div style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#64748b",
                  padding: "40px",
                }}>
                  <div style={{ fontSize: "48px", marginBottom: "16px", color: "#10b981" }}>🔵</div>
                  <h3 style={{ margin: "0 0 8px" }}>Lab Not Started</h3>
                  <p style={{ margin: 0, textAlign: "center", maxWidth: "300px" }}>
                    Click "Start Lab" to initialize your isolated Blue Team execution environment with sample logs and detection tools.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}