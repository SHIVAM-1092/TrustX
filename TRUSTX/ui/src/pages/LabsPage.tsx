import { useState, useEffect } from "react";
import { api } from "../services/api";
import { Challenge } from "../types";
import { Layout } from "../components/Layout";

interface BlueLab {
  id: string;
  name: string;
  description: string;
  objectives: string[];
  files: string[];
}

const blueLabs: BlueLab[] = [
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
];

export function LabsPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      setLoading(true);
      const challengeList = await api.getChallenges();
      // Backend may return empty array when policy validation fails (default-deny),
      // or may return challenges if policy is configured. Either way, set the result.
      setChallenges(challengeList);
      setError(null);
    } catch (e: any) {
      // Do not fabricate challenge data or show fake success.
      // Preserve the error for user feedback; retry will re-attempt the API call.
      setError(e.message || "Failed to load challenges");
    } finally {
      setLoading(false);
    }
  };

  const renderLabCard = (lab: any, isRed: boolean) => (
    <article
      key={lab.id}
      className={`lab-card card ${isRed ? "lab-card-red" : "lab-card-blue"}`}
    >
      <div className="lab-card-header">
        <div>
          <h2 className="card-title">
            {isRed ? "âš" : "🟦"}{lab.name}
          </h2>
          <p className="card-subtitle">{lab.category || "Blue Team"}</p>
        </div>
        <span className="badge badge-info">{lab.difficulty || "Intermediate"}</span>
      </div>
      <div className="lab-card-meta">
        <span className="badge badge-neutral">~15 min</span>
        <span className="badge badge-neutral">{isRed ? "1 challenge" : "4 objectives"}</span>
      </div>
      <p className="lab-card-description">{lab.description}</p>
      <div className="lab-card-footer">
        <div className="lab-card-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: "0%" }}></div>
          </div>
          <span>Not started</span>
        </div>
        <a
          href={isRed ? `#/red-lab/${lab.id}` : `#/blue-lab/${lab.id}`}
          className="btn btn-primary btn-sm"
        >
          {isRed ? "Start Red Lab" : "Start Blue Lab"}
        </a>
      </div>
    </article>
  );

  return (
    <Layout>
      <div className="labs-header">
        <div>
          <h1>Security Labs</h1>
          <p style={{ margin: "4px 0 0", color: "var(--fg-muted)", fontSize: "14px" }}>
            Adversarial AI testing environments with isolated execution and policy enforcement
          </p>
        </div>
        <div className="labs-header-actions">
          <button className="btn btn-secondary btn-sm" onClick={loadChallenges} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="card" style={{ borderColor: "var(--danger)", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <span style={{ color: "var(--danger)" }}>⚠</span>
            <span style={{ flex: "1 1 200px" }}>{error}</span>
            <button className="btn btn-ghost btn-sm" onClick={loadChallenges}>Retry</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="state-container">
          <div className="spinner"></div>
          <h3 className="state-title">Loading Security Labs</h3>
          <p className="state-message">Fetching challenges and environment status...</p>
        </div>
      ) : (
        <div>
          {/* Red Team Labs */}
          <section className="lab-section">
            <div className="lab-section-header">
              <h2 className="lab-section-title red">
                <span>🔴</span> Red Team Labs
              </h2>
              <p className="lab-section-desc">
                Adversarial AI testing with isolated execution environments and authorized targets.
              </p>
            </div>
            <div className="labs-grid">
              {challenges.length === 0 ? (
                <div className="state-container">
                  <h3 className="state-title">No Red Team Labs Available</h3>
                  <p className="state-message">
                    Red Team challenges require backend service. Verify execution service health.
                  </p>
                  <button className="btn btn-secondary btn-sm" onClick={loadChallenges} style={{ marginTop: "16px" }}>
                    Retry
                  </button>
                </div>
              ) : (
                challenges.map((challenge) => renderLabCard(challenge, true))
              )}
            </div>
          </section>

          {/* Blue Team Labs */}
          <section className="lab-section">
            <div className="lab-section-header">
              <h2 className="lab-section-title blue">
                <span>🟦</span> Blue Team Labs
              </h2>
              <p className="lab-section-desc">
                Defensive security exercises with realistic log data and detection engineering.
              </p>
            </div>
            <div className="labs-grid">
              {blueLabs.map((lab) => renderLabCard(lab, false))}
            </div>
          </section>
        </div>
      )}
    </Layout>
  );
}