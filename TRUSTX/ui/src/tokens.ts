/**
 * Design tokens for TrustX Premium Cybersecurity Platform
 * Following the Graphite Enterprise design system
 */

// Color palette - Graphite Enterprise
export const colors = {
  // Primary brand colors
  graphite: "#101214",        // Background
  charcoal: "#252B32",        // Elevated surfaces
  iceBlue: "#8CCBFF",         // Primary interactive highlights
  teal: "#36D6B0",            // Successful operations / active indicators
  silver: "#E9EEF4",          // Headings / important text

  // Semantic colors
  muted: "#64748B",           // Secondary text
  mutedSoft: "#94A3B8",       // Muted body text
  border: "#3E4F64",          // Card borders
  borderStrong: "#475569",    // Stronger borders
  danger: "#F87171",          // Errors / failures
  dangerBg: "#991B1B",        // Danger backgrounds
  success: "#34D399",         // Success / teal variant
  successBg: "#065F46",       // Success backgrounds
  warning: "#F59E0B",         // Warnings
  warningBg: "#92400E",       // Warning backgrounds
  accentBg: "#0C4A6E",        // Accent background

  // Additional UI colors
  bgElevated: "#1E293B",      // Cards/cards containers
  bgSubtle: "#0F172A",        // Subtle backgrounds
  cardHover: "#253047",       // Hover state
  focusRing: "#8CCBFF",       // Focus ring color
} as const;

// Typography scale
export const typography = {
  fontFamily: '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',

  // Display headlines (large, prominent)
  display: {
    headline: {
      fontSize: "48px",
      fontWeight: 700 as const,
      letterSpacing: "-0.03em" as const,
      lineHeight: 1.1 as const,
    },
    pageTitle: {
      fontSize: "32px",
      fontWeight: 600 as const,
      letterSpacing: "-0.02em" as const,
      lineHeight: 1.2 as const,
    },
    sectionHeading: {
      fontSize: "20px",
      fontWeight: 600 as const,
      letterSpacing: "-0.02em" as const,
      lineHeight: 1.4 as const,
    },
    cardTitle: {
      fontSize: "16px",
      fontWeight: 600 as const,
    },
    body: {
      fontSize: "14px",
      fontWeight: 400 as const,
      lineHeight: 1.6 as const,
    },
    small: {
      fontSize: "12px",
      fontWeight: 500 as const,
    },
    caption: {
      fontSize: "11px",
      fontWeight: 500 as const,
    },
  },

  // Line heights
  lineHeight: {
    tight: 1.1,
    normal: 1.5,
    relaxed: 1.6,
  },
} as const;

// Surface system
export const surfaces = {
  bg: colors.graphite,
  elevated: colors.charcoal,
  card: colors.bgElevated,
  cardHover: colors.cardHover,
  border: colors.border,
  borderFocus: colors.iceBlue,
} as const;

// Component radii
export const radius = {
  sm: "4px",
  md: "8px",
  lg: "12px",
  xl: "14px",
} as const;

// Transition durations
export const transitions = {
  fast: "150ms ease",
  normal: "180ms ease",
  slow: "220ms ease",
  buttonHover: "160ms ease",
} as const;

// Shadows
export const shadows = {
  sm: "0 2px 8px rgba(0, 0, 0, 0.3)",
  md: "0 4px 12px rgba(0, 0, 0, 0.4)",
  lg: "0 8px 24px rgba(0, 0, 0, 0.5)",
  xl: "0 12px 40px rgba(0, 0, 0, 0.6)",
} as const;

// Breakpoints
export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1200px",
} as const;

// Container widths
export const container = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1200px",
  // Maximum width for main content
  main: "1200px",
} as const;

// 3D scene configuration
export const threejs = {
  devicePixelRatio: Math.min(window.devicePixelRatio, 2),
  preferredMotionReduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  maxParticles: 50,
  particleSpeed: 2,
} as const;