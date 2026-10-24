import React, { useState, useRef, useEffect, useCallback } from "react";
import { ExecResponse, ExecRequest } from "../types";

interface TerminalProps {
  /** Unique terminal instance ID */
  instanceId: string;
  /** "red" or "blue" - determines which execution service to use */
  team: "red" | "blue";
  /** Initial session ID (optional, will be created if not provided) */
  initialSessionId?: string;
  /** Callback when session is created */
  onSessionCreated?: (sessionId: string) => void;
  /** Callback when session is deleted */
  onSessionDeleted?: () => void;
  /** Optional initial command to run */
  initialCommand?: string[];
  /** Maximum command history to display */
  maxHistory?: number;
  /** CSS class for styling */
  className?: string;
}

interface CommandHistoryEntry {
  command: string[];
  response: ExecResponse;
  timestamp: number;
}

export function Terminal({
  instanceId,
  team,
  initialSessionId,
  onSessionCreated,
  onSessionDeleted,
  initialCommand,
  maxHistory = 50,
  className = ""
}: TerminalProps) {
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId || null);
  const [history, setHistory] = useState<CommandHistoryEntry[]>([]);
  const [input, setInput] = useState<string>("");
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(true);

  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // API wrappers with dynamic import fallback
  const executeCommand = useCallback(async (cmd: string[], sid: string): Promise<ExecResponse> => {
    const { api } = await import("../services/api");
    const req: ExecRequest = {
      command: cmd,
      session_id: sid,
      timeout: 30,
      max_output: 10000,
    };
    if (team === "red") {
      return api.redExecExecute(req);
    } else {
      return api.blueExecExecute(req);
    }
  }, [team]);

  const createSession = useCallback(async (): Promise<string> => {
    const { api } = await import("../services/api");
    if (team === "red") {
      const session = await api.redExecCreateSession();
      return session.session_id;
    } else {
      const session = await api.blueExecCreateSession();
      return session.session_id;
    }
  }, [team]);

  const deleteSession = useCallback(async (sid: string) => {
    const { api } = await import("../services/api");
    if (team === "red") {
      return api.redExecDeleteSession(sid);
    } else {
      return api.blueExecDeleteSession(sid);
    }
  }, [team]);

  // Connect / Initialize session
  const initializeSession = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      let sid = initialSessionId || sessionId;
      if (!sid) {
        sid = await createSession();
        setSessionId(sid);
        onSessionCreated?.(sid);
      }
      setConnected(true);
      setError(null);

      // Run initial command if provided and history is empty
      if (initialCommand && initialCommand.length > 0 && history.length === 0) {
        try {
          const response = await executeCommand(initialCommand, sid);
          setHistory([{ command: initialCommand, response, timestamp: Date.now() }]);
        } catch (err) {
          console.error("Initial command execution failed:", err);
        }
      }
    } catch (err) {
      console.error("Terminal initialization failed:", err);
      setError(err instanceof Error ? err.message : "Failed to connect to execution service");
      setConnected(false);
    } finally {
      setConnecting(false);
    }
  }, [initialSessionId, sessionId, createSession, executeCommand, initialCommand, history.length, onSessionCreated]);

  useEffect(() => {
    initializeSession();
    return () => {
      if (sessionId && !initialSessionId) {
        deleteSession(sessionId).catch(console.error);
        onSessionDeleted?.();
      }
    };
  }, [instanceId]);

  // Scroll to bottom on new history
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history, executing]);

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || executing) return;

    let activeSid = sessionId;
    if (!activeSid) {
      try {
        activeSid = await createSession();
        setSessionId(activeSid);
        onSessionCreated?.(activeSid);
      } catch (err) {
        setError("Failed to create session for execution");
        return;
      }
    }

    const rawCmd = input.trim();
    // Parse arguments respecting basic spaces
    const cmdArgs = rawCmd.split(/\s+/);
    setInput("");
    setExecuting(true);
    setError(null);

    try {
      const response = await executeCommand(cmdArgs, activeSid);
      setHistory(prev => [...prev, { command: cmdArgs, response, timestamp: Date.now() }].slice(-maxHistory));
      setConnected(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Command execution failed");
    } finally {
      setExecuting(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const teamAccent = team === "red" ? "var(--danger)" : "var(--success)";

  return (
    <div className={`terminal ${className}`} style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      minHeight: "420px",
      background: "#080c14",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-lg)",
      overflow: "hidden",
      fontFamily: '"JetBrains Mono", monospace',
      boxShadow: "var(--shadow)",
    }}>
      {/* Terminal Top Bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px",
        background: "var(--bg-elevated)",
        borderBottom: "1px solid var(--border)",
        fontSize: "12px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ display: "flex", gap: "6px" }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
          </div>
          <span style={{ color: teamAccent, fontWeight: 700, letterSpacing: "0.05em", marginLeft: "8px" }}>
            {team === "red" ? "⚔ RED TEAM CONTAINER" : "🔵 BLUE TEAM CONTAINER"}
          </span>
          {sessionId && (
            <span style={{ color: "var(--fg-subtle)", fontSize: "11px", background: "var(--bg)", padding: "2px 6px", borderRadius: "4px" }}>
              sid:{sessionId}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {connecting && <span style={{ color: "var(--accent)", fontSize: "11px" }}>Connecting...</span>}
          {connected && <span style={{ color: "var(--success)", fontSize: "11px" }}>● Connected</span>}
          {!connected && !connecting && (
            <button onClick={initializeSession} className="btn btn-secondary btn-sm" style={{ fontSize: "11px", padding: "2px 8px" }}>
              Reconnect
            </button>
          )}
          <button
            onClick={() => setHistory([])}
            disabled={history.length === 0}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: "11px", padding: "2px 8px", color: "var(--fg-muted)" }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{
          padding: "10px 16px",
          background: "var(--danger-bg)",
          color: "var(--danger)",
          borderBottom: "1px solid var(--border)",
          fontSize: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <span>⚠ {error}</span>
          <button onClick={initializeSession} className="btn btn-ghost btn-sm" style={{ color: "var(--danger)", padding: "2px 6px" }}>Retry</button>
        </div>
      )}

      {/* Output / History Area */}
      <div
        ref={terminalRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          fontSize: "13px",
          lineHeight: "1.6",
          color: "var(--fg)",
        }}
      >
        {history.length === 0 && !connecting && (
          <div style={{ color: "var(--fg-subtle)", textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: "28px", marginBottom: "12px", color: teamAccent }}>
              {team === "red" ? "⚔" : "🔵"}
            </div>
            <p style={{ fontWeight: 600, color: "var(--fg-muted)", marginBottom: "4px" }}>
              Isolated {team === "red" ? "Red Team" : "Blue Team"} Execution Environment Ready
            </p>
            <p style={{ fontSize: "12px" }}>
              Type commands like <code style={{ color: "var(--accent)" }}>{team === "red" ? "ls -la /workspace" : "cat auth.log"}</code> and press Enter.
            </p>
          </div>
        )}

        {history.map((entry, idx) => (
          <div key={idx} style={{ marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ color: teamAccent, fontWeight: 600 }}>
                labuser@trustx-{team}:~$
              </span>
              <span style={{ color: "var(--fg)", fontWeight: 500 }}>
                {entry.command.join(" ")}
              </span>
              <span style={{ color: "var(--fg-subtle)", fontSize: "11px", marginLeft: "auto" }}>
                {new Date(entry.timestamp).toLocaleTimeString()} ({entry.response.duration_ms}ms)
              </span>
            </div>

            {entry.response.stdout && (
              <pre style={{
                margin: "4px 0",
                padding: "8px 12px",
                background: "var(--bg)",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                color: "var(--fg)",
                fontSize: "12px",
              }}>
                {entry.response.stdout}
              </pre>
            )}

            {entry.response.stderr && (
              <pre style={{
                margin: "4px 0",
                padding: "8px 12px",
                background: "var(--danger-bg)",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--danger)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                color: "var(--danger)",
                fontSize: "12px",
              }}>
                {entry.response.stderr}
              </pre>
            )}

            <div style={{ display: "flex", gap: "12px", fontSize: "11px", color: "var(--fg-subtle)", marginTop: "4px" }}>
              <span>Exit Code: <strong style={{ color: entry.response.exit_code === 0 ? "var(--success)" : "var(--danger)" }}>{entry.response.exit_code}</strong></span>
              {entry.response.timed_out && <span style={{ color: "var(--warning)" }}>Timed Out</span>}
              {entry.response.truncated && <span style={{ color: "var(--warning)" }}>Output Truncated</span>}
            </div>
          </div>
        ))}

        {executing && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--accent)" }}>
            <span>labuser@trustx-{team}:~$</span>
            <span className="spinner" style={{ width: "12px", height: "12px" }} />
            <span style={{ fontSize: "12px", color: "var(--fg-muted)" }}>Executing command...</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleExecute} style={{
        display: "flex",
        alignItems: "center",
        borderTop: "1px solid var(--border)",
        background: "var(--bg-elevated)",
      }}>
        <span style={{
          padding: "12px 16px",
          color: teamAccent,
          fontWeight: 600,
          fontSize: "13px",
          userSelect: "none",
          whiteSpace: "nowrap",
        }}>
          labuser@trustx-{team}:~$
        </span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={executing || !sessionId}
          placeholder={!sessionId ? "Initializing session..." : "Type command (e.g. pwd, ls, cat auth.log)..."}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "var(--fg)",
            fontFamily: "inherit",
            fontSize: "13px",
            padding: "12px 16px 12px 0",
          }}
          autoFocus
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="submit"
          disabled={executing || !input.trim() || !sessionId}
          className="btn btn-primary btn-sm"
          style={{ margin: "6px 12px" }}
        >
          Run
        </button>
      </form>
    </div>
  );
}
