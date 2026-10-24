import React from "react";

export function Layout({ children }: { children: React.ReactNode }) {
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
      <main className="app-main">{children}</main>
      <footer className="app-footer">
        <p>TrustX — Adversarial AI Safety Infrastructure Prototype</p>
      </footer>
    </div>
  );
}