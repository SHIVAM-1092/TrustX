import { Layout } from "../components/Layout";
import { Architecture3D } from "../components/Architecture3D";

export function LandingPage() {
  return (
    <Layout>
      <div className="landing-hero-split">
        <section className="landing-hero">
          <h1>
            <span className="accent">TRUST</span>X
          </h1>
          <p>
            Adversarial AI Safety Testing Infrastructure.
            Isolate the teams. Protect the target. Prove the boundary.
          </p>
          <div className="cta-group">
            <a href="#/labs" className="btn btn-primary btn-lg">
              Start Testing →
            </a>
            <a href="#/activity" className="btn btn-secondary btn-lg">
              View Audit Trail
            </a>
          </div>
        </section>

        <section className="architecture-illustration">
          <Architecture3D />
          <p className="architecture-caption">
            TrustX Architecture: Red Team → Policy Gateway → Target → Blue Team
          </p>
        </section>
      </div>

      <section className="feature-grid" style={{ maxWidth: "1200px", margin: "0 auto 80px", padding: "0 24px" }}>
        <div className="feature-card card">
          <div className="feature-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h3>Server-Side Policy Gateway</h3>
          <p>Default-deny authorization with mTLS and JWT identity verification. All cross-domain requests evaluated in real-time.</p>
        </div>

        <div className="feature-card card">
          <div className="feature-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <h3>Isolated Security Domains</h3>
          <p>Red, Target, and Blue teams run in separate network segments with TLS isolation. No direct cross-domain access.</p>
        </div>

        <div className="feature-card card">
          <div className="feature-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M12 12v4l2 2" />
            </svg>
          </div>
          <h3>Tamper-Evident Audit Trail</h3>
          <p>SHA-256 hash-chained audit log records every authorization decision with full request context.</p>
        </div>

        <div className="feature-card card">
          <div className="feature-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <path d="M18 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
            </svg>
          </div>
          <h3>Synthetic Prompt Injection Lab</h3>
          <p>Hands-on challenge with server-validated flags. Real attack payloads reach a synthetic target LLM.</p>
        </div>

        <div className="feature-card card">
          <div className="feature-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8" />
              <path d="M12 17v4" />
            </svg>
          </div>
          <h3>Reset & Replay Capability</h3>
          <p>Instant target state reset for iterative testing. Challenge progress tracked per learner session.</p>
        </div>

        <div className="feature-card card">
          <div className="feature-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>
          <h3>Prototype Scope — Honest Claims</h3>
          <p>Container isolation, network segmentation, and passing tests each have limitations. Residual risks documented.</p>
        </div>
      </section>
    </Layout>
  );
}