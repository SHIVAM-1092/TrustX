import { useState, useEffect } from "react";
import { api } from "../services/api";
import { AuditEvent } from "../types";
import { Layout } from "../components/Layout";

export function ActivityPage() {
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [verification, setVerification] = useState<{ valid: boolean; errors: string[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const loadData = async () => {
    try {
      const [auditRes, verifyRes] = await Promise.all([
        api.getAuditEvents(100).catch(() => ({ events: [] })),
        api.verifyAuditChain().catch(() => null),
      ]);
      setAuditEvents(auditRes.events || []);
      setVerification(verifyRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 5000);
    return () => clearInterval(timer);
  }, []);

  const filteredEvents = auditEvents.filter((evt) => {
    if (filter === "all") return true;
    if (filter === "allowed") return evt.allowed;
    if (filter === "denied") return !evt.allowed;
    return true;
  });

  const stats = {
    total: auditEvents.length,
    allowed: auditEvents.filter((e) => e.allowed).length,
    denied: auditEvents.filter((e) => !e.allowed).length,
  };

  return (
    <Layout>
      <div className="activity-header">
        <div>
          <h1>Activity & Audit Trail</h1>
          <p style={{ color: "#94a3b8", margin: "4px 0 0" }}>
            SHA-256 hash-chained authorization log
          </p>
        </div>
        <div className="activity-stats">
          <div className="activity-stat">
            <span className="activity-stat-value">{stats.total}</span>
            <span className="activity-stat-label">Total Events</span>
          </div>
          <div className="activity-stat">
            <span className="activity-stat-value" style={{ color: "var(--success)" }}>{stats.allowed}</span>
            <span className="activity-stat-label">Allowed</span>
          </div>
          <div className="activity-stat">
            <span className="activity-stat-value" style={{ color: "var(--danger)" }}>{stats.denied}</span>
            <span className="activity-stat-label">Denied</span>
          </div>
        </div>
      </div>

      {verification && (
        <div className={`card`} style={{ marginBottom: "24px", borderColor: verification.valid ? "var(--success)" : "var(--danger)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ color: verification.valid ? "var(--success)" : "var(--danger)" }}>
              {verification.valid ? "✓" : "✗"}
            </span>
            <div>
              <strong style={{ color: verification.valid ? "var(--success)" : "var(--danger)" }}>
                {verification.valid ? "Audit Chain Valid" : "Audit Chain Compromised / Errors"}
              </strong>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#94a3b8" }}>
                {verification.errors?.length > 0
                  ? verification.errors.slice(0, 2).join("; ")
                  : "Hash chain verified from genesis."}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="activity-filters">
        <button className={`filter-pill ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>
          All ({stats.total})
        </button>
        <button className={`filter-pill ${filter === "allowed" ? "active" : ""}`} onClick={() => setFilter("allowed")}>
          Allowed ({stats.allowed})
        </button>
        <button className={`filter-pill ${filter === "denied" ? "active" : ""}`} onClick={() => setFilter("denied")}>
          Denied ({stats.denied})
        </button>
        <button className="btn btn-secondary btn-sm" onClick={loadData} disabled={loading}>
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="state-container">
          <div className="spinner"></div>
          <p className="state-message">Loading audit trail...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="state-container">
          <div className="state-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <h2 className="state-title">No Events Match</h2>
          <p className="state-message">No audit events match the current filter.</p>
        </div>
      ) : (
        <div className="card" style={{ overflow: "hidden" }}>
          <table className="audit-table">
            <thead>
              <tr>
                <th style={{ width: "120px" }}>Action</th>
                <th style={{ width: "160px" }}>Source → Dest</th>
                <th style={{ width: "200px" }}>Path</th>
                <th style={{ width: "80px" }}>Status</th>
                <th style={{ width: "100px" }}>Prev Hash</th>
                <th style={{ width: "100px" }}>Current Hash</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((evt) => (
                <tr key={evt.event_id}>
                  <td>
                    <span className={`badge ${evt.allowed ? "badge-success" : "badge-danger"}`}>
                      {evt.event_type}
                    </span>
                  </td>
                  <td>
                    <span className={`cell-domain ${evt.source_domain}`}>{evt.source_domain}</span>
                    <span style={{ margin: "0 6px", color: "#64748b" }}>→</span>
                    <span className={`cell-domain ${evt.destination_domain}`}>{evt.destination_domain}</span>
                  </td>
                  <td style={{ color: "#94a3b8", fontFamily: "JetBrains Mono, monospace" }}>
                    {evt.path}
                  </td>
                  <td>
                    <span style={{ color: evt.allowed ? "var(--success)" : "var(--danger)", fontWeight: 500 }}>
                      {evt.allowed ? "ALLOW" : "DENY"}
                    </span>
                  </td>
                  <td className="hash-cell">
                    {evt.prev_hash ? `${evt.prev_hash.substring(0, 12)}...` : "GENESIS"}
                  </td>
                  <td className="hash-cell current">
                    {evt.hash.substring(0, 12)}...
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}