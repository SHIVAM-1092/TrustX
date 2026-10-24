import { useState, useEffect } from "react";

/**
 * 3D TrustX Security Architecture visualization.
 * Pure SVG-based 3D scene that works without Three.js dependency.
 * Features:
 * - Four distinct nodes: Red Team, Policy Gateway, Target, Blue Team
 * - Connection arrows showing data flow
 * - Tooltip explanations on node hover
 * - Respects prefers-reduced-motion
 * - Graceful fallback when reduced motion is preferred
 */

export function Architecture3D() {
  const [motionReduced, setMotionReduced] = useState(
    typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setMotionReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setMotionReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  if (motionReduced) {
    return <ArchitectureFallback />;
  }

  return (
    <div className="architecture-wrapper" style={{ overflow: "hidden" }}>
      {/* 3D SVG architecture scene */}
      <svg
        viewBox="0 0 800 400"
        width="100%"
        height="400"
        style={{ display: "block" }}
      >
        <defs>
          /* Gradients for depth */
          <linearGradient id="gatewayGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          /* Subtle glows */
          <filter id="glowIce">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="glowTeal">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          /* Arrow markers */
          <marker
            id="arrowHead"
            markerWidth="10"
            markerHeight="10"
            refX="8"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="#8ccbff" />
          </marker>

          <marker
            id="arrowHeadTeal"
            markerWidth="10"
            markerHeight="10"
            refX="8"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="#36d6b0" />
          </marker>

          <marker
            id="arrowHeadGateway"
            markerWidth="10"
            markerHeight="10"
            refX="8"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="#8ccbff" />
          </marker>
        </defs>

        {/* BACKGROUND */}
        <rect width="800" height="400" fill="#0f172a" />

        {/* SUBTLE FLOOR GRID */}
        <g className="floor" opacity="0.1">
          <line x1="0" y1="0" x2="800" y2="400" stroke="#1e293b" strokeWidth="1" />
        </g>

        {/* RED TEAM - adversarial testing environment */}
        <g
          className="node red-team"
          transform="translate(80, 60)"
          style={{ cursor: "pointer", userSelect: "none" }}
        >
          <rect
            x="0"
            y="0"
            width="200"
            height="180"
            rx="14"
            fill="#1e293b"
            stroke="#3E4F64"
            strokeWidth={1.5}
            filter="url(#glowIce)"
          />
          <circle cx="100" cy="30" r="28" fill="#ef4444" />
          <text
            x="100"
            y="36"
            textAnchor="middle"
            fill="#f87171"
            fontSize="20"
            fontWeight="bold"
            fontFamily="Inter"
          >
            ⚔
          </text>
          <text
            x="100"
            y="72"
            textAnchor="middle"
            fill="#f8fafc"
            fontSize="15"
            fontWeight="600"
            fontFamily="Inter"
          >
            RED TEAM
          </text>
          <text
            x="100"
            y="96"
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="12"
            fontFamily="Inter"
          >
            Synthetic Adversarial Workloads
          </text>
          <text
            x="100"
            y="120"
            textAnchor="middle"
            fill="#64748b"
            fontSize="11"
            fontFamily="Inter"
          >
            mTLS • Challenge Handler • Attack Simulation
          </text>
        </g>

        {/* Policy Gateway - central enforcement boundary */}
        <g
          className="node gateway"
          transform="translate(400, 60)"
          style={{ cursor: "pointer", userSelect: "none" }}
        >
          <rect
            x="0"
            y="0"
            width="180"
            height="180"
            rx="14"
            fill="#1e293b"
            stroke="#8CCBFF"
            strokeWidth={2}
            filter="url(#glowIce)"
          />
          <circle cx="90" cy="30" r="28" fill="#0891b2" />
          <text
            x="90"
            y="36"
            textAnchor="middle"
            fill="#38bdf8"
            fontSize="20"
            fontWeight="bold"
            fontFamily="Inter"
          >
            🛡
          </text>
          <text
            x="90"
            y="72"
            textAnchor="middle"
            fill="#f8fafc"
            fontSize="15"
            fontWeight="600"
            fontFamily="Inter"
          >
            GATEWAY
          </text>
          <text
            x="90"
            y="96"
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="12"
            fontFamily="Inter"
          >
            Policy Enforcement • mTLS + JWT
          </text>
          <text
            x="90"
            y="120"
            textAnchor="middle"
            fill="#64748b"
            fontSize="11"
            fontFamily="Inter"
          >
            Default-Deny • Audit Chain
          </text>
        </g>

        {/* Target - isolated synthetic application */}
        <g
          className="node target"
          transform="translate(720, 60)"
          style={{ cursor: "pointer", userSelect: "none" }}
        >
          <rect
            x="0"
            y="0"
            width="200"
            height="180"
            rx="14"
            fill="#1e293b"
            stroke="#36D6B0"
            strokeWidth={1.5}
            filter="url(#glowTeal)"
          />
          <circle cx="100" cy="30" r="28" fill="#1d4ed8" />
          <text
            x="100"
            y="36"
            textAnchor="middle"
            fill="#3b82f6"
            fontSize="20"
            fontWeight="bold"
            fontFamily="Inter"
          >
            🎯
          </text>
          <text
            x="100"
            y="72"
            textAnchor="middle"
            fill="#f8fafc"
            fontSize="15"
            fontWeight="600"
            fontFamily="Inter"
          >
            TARGET
          </text>
          <text
            x="100"
            y="96"
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="12"
            fontFamily="Inter"
          >
            Synthetic LLM • Resettable
          </text>
          <text
            x="100"
            y="120"
            textAnchor="middle"
            fill="#64748b"
            fontSize="11"
            fontFamily="Inter"
          >
            System Prompt • Protection
          </text>
        </g>

        {/* Blue Team - defensive analysis environment */}
        <g
          className="node blue-team"
          transform="translate(400, 280)"
          style={{ cursor: "pointer", userSelect: "none" }}
        >
          <rect
            x="0"
            y="0"
            width="180"
            height="140"
            rx="14"
            fill="#1e293b"
            stroke="#36D6B0"
            strokeWidth={1.5}
            filter="url(#glowTeal)"
          />
          <circle cx="90" cy="25" r="24" fill="#065f46" />
          <text
            x="90"
            y="31"
            textAnchor="middle"
            fill="#10b981"
            fontSize="16"
            fontWeight="bold"
            fontFamily="Inter"
          >
            🔵
          </text>
          <text
            x="90"
            y="62"
            textAnchor="middle"
            fill="#f8fafc"
            fontSize="13"
            fontWeight="600"
            fontFamily="Inter"
          >
            BLUE TEAM
          </text>
          <text
            x="90"
            y="84"
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="11"
            fontFamily="Inter"
          >
            Defensive Testing • Monitor • Reset • Analyze
          </text>
        </g>

        {/* Arrows showing data flow */}
        {/* Red → Gateway */}
        <g stroke="#8CCBFF" strokeWidth={2} fill="none" markerEnd="url(#arrowHead)">
          <path d="M 280 160 L 380 160" />
        </g>

        {/* Gateway → Target */}
        <g stroke="#8CCBFF" strokeWidth={2} fill="none" markerEnd="url(#arrowHead)">
          <path d="M 540 160 L 660 160" />
        </g>

        {/* Gateway → Blue Team (controlled flow) */}
        <g stroke="#36D6B0" strokeWidth={2} fill="none" markerEnd="url(#arrowHeadTeal)">
          <path d="M 540 200 L 540 280" />
        </g>

        {/* Node click explanations - overlay */}
        <g
          style={{
            position: "absolute",
            left: "380px",
            top: "150px",
            color: "#8CCBFF",
            fontSize: "11px",
            fontFamily: "Inter",
            pointerEvents: "none",
          }}
        >
          <text>Conceptual data flow</text>
          <tspan x="0" dy="1.2em" style={{ opacity: 0.6 }}>
            → Policy evaluation
          </tspan>
        </g>

        {/* Teal flow label (Gateway → Blue) */}
        <g
          style={{
            position: "absolute",
            left: "460px",
            top: "230px",
            color: "#36D6B0",
            fontSize: "11px",
            fontFamily: "Inter",
            pointerEvents: "none",
          }}
        >
          <text>Allowed defensive flow</text>
          <tspan x="0" dy="1.2em" style={{ opacity: 0.6 }}>
            → Analysis
          </tspan>
        </g>
      </svg>

      {/* Node click explanations - tooltip overlay */}
      <div
        className="architecture-tooltip"
        style={{
          position: "absolute",
          pointerEvents: "none",
          background: "#1e293b",
          border: "1px solid #8CCBFF",
          borderRadius: "14px",
          padding: "16px",
          fontSize: "13px",
          color: "#F8FAFC",
          minWidth: "220px",
          maxWidth: "320px",
          zIndex: 100,
          opacity: 0,
          transition: "opacity 180ms ease",
        }}
      >
        <div id="red-tooltip" style={{ marginBottom: "12px" }}>
          <strong>RED TEAM</strong><br />
          Adversarial testing environment with synthetic workloads. Authorized access only through policy gateway.
        </div>
        <div id="gateway-tooltip" style={{ marginBottom: "12px" }}>
          <strong>POLICY GATEWAY</strong><br />
          Central enforcement boundary. Default-deny authorization with mTLS + JWT identity verification. All cross-domain requests evaluated in real-time.
        </div>
        <div id="target-tooltip" style={{ marginBottom: "12px" }}>
          <strong>TARGET</strong><br />
          Synthetic, resettable LLM service. Isolated from Red and Blue teams. Access controlled by explicit policy.
        </div>
        <div id="blue-tooltip" style={{ marginBottom: "12px" }}>
          <strong>BLUE TEAM</strong><br />
          Defensive analysis environment. Monitors, resets, and analyzes synthetic workloads. Policy-controlled access.
        </div>
      </div>

      {/* Rotate controls hint */}
      {!motionReduced && (
        <div
          style={{
            position: "absolute",
            bottom: "12px",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: "11px",
            color: "#64748B",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            zIndex: 100,
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}
        >
          Drag to rotate • Click nodes for details • Respects reduced-motion preferences
        </div>
      )}
    </div>
  );
}

export function ArchitectureFallback() {
  return (
    <div className="architecture-fallback" style={{
      textAlign: "center",
      padding: "48px 24px",
      color: "#64748B",
    }}>
      <svg
        width="64"
        height="64"
        viewBox="0 0 24 24"
        style={{ margin: "0 auto 16px", filter: "opacity(0.5)" }}
      >
        <path
          d="M8 16h8l-2-2-4,2-3-3-1,1H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h3l3-3 1,1h4a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-8z"
          fill="none"
          stroke="#8CCBFF"
          strokeWidth={1.5}
        />
      </svg>
      <h3 style={{ margin: "8px 0 4px", color: "#E9EEF4" }}>
        3D Architecture View
      </h3>
      <p style={{ margin: "0", fontSize: "14px" }}>
        Interactive 3D security architecture illustration
      </p>
    </div>
  );
}