import React, { useState, useRef, useEffect } from 'react';
import {
  Terminal as TerminalIcon,
  Play,
  RotateCcw,
  Copy,
  Check,
  Trash2,
  CornerDownLeft,
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';
import { ApiClient, TerminalExecResult } from '../../services/apiClient';

interface TerminalEntry {
  id: string;
  command: string;
  stdout: string;
  stderr: string;
  exitCode: number;
  cwd: string;
  timestamp: string;
}

interface TerminalComponentProps {
  labId: string;
  onCommandRun?: (cmd: string, result: TerminalExecResult) => void;
}

export const TerminalComponent: React.FC<TerminalComponentProps> = ({
  labId,
  onCommandRun
}) => {
  const [entries, setEntries] = useState<TerminalEntry[]>([
    {
      id: 'init-0',
      command: 'uname -a && whoami',
      stdout: 'Linux trustx-lab-worker 6.6.0 #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux\noperator',
      stderr: '',
      exitCode: 0,
      cwd: '~/workspace',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);

  const [inputVal, setInputVal] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentCwd, setCurrentCwd] = useState('~/workspace');
  const [history, setHistory] = useState<string[]>(['uname -a && whoami']);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'terminal' | 'cheatsheet'>('terminal');

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  const handleRunCommand = async (cmdToRun: string) => {
    const trimmed = cmdToRun.trim();
    if (!trimmed || isExecuting) return;

    if (trimmed === 'clear') {
      setEntries([]);
      setInputVal('');
      return;
    }

    setIsExecuting(true);
    setHistory(prev => [...prev, trimmed]);
    setHistoryIndex(-1);

    const result = await ApiClient.executeTerminalCommand(labId, trimmed);
    setIsExecuting(false);

    if (result.cwd) {
      setCurrentCwd(result.cwd);
    }

    const newEntry: TerminalEntry = {
      id: `cmd-${Date.now()}`,
      command: trimmed,
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      cwd: result.cwd || currentCwd,
      timestamp: new Date().toLocaleTimeString()
    };

    setEntries(prev => [...prev, newEntry]);
    setInputVal('');

    if (onCommandRun) {
      onCommandRun(trimmed, result);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRunCommand(inputVal);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const nextIdx = historyIndex + 1 < history.length ? historyIndex + 1 : historyIndex;
        setHistoryIndex(nextIdx);
        setInputVal(history[history.length - 1 - nextIdx] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setInputVal(history[history.length - 1 - nextIdx] || '');
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInputVal('');
      }
    } else if (e.ctrlKey && e.key === 'l') {
      e.preventDefault();
      setEntries([]);
    }
  };

  const handleCopyAll = () => {
    const text = entries
      .map(e => `${currentCwd}$ ${e.command}\n${e.stdout}${e.stderr ? `\n[ERR]: ${e.stderr}` : ''}`)
      .join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const quickCommands = [
    { label: 'ls -la', cmd: 'ls -la' },
    { label: 'cat instructions.md', cmd: 'cat instructions.md' },
    { label: 'cat target_request.http', cmd: 'cat target_request.http' },
    { label: 'python3 exploit_poc.py', cmd: 'python3 exploit_poc.py' },
    { label: 'curl baseline FAQ', cmd: 'curl -s -X POST http://localhost:3000/api/v1/synthetic/agent/chat -H "Content-Type: application/json" -d \'{"prompt":"What are your operating hours?"}\'' }
  ];

  return (
    <div className="h-full flex flex-col bg-[#070A11] rounded-xl border border-slate-800 overflow-hidden font-mono text-xs">
      {/* Terminal Title Bar */}
      <div className="p-2.5 bg-[#05070D] border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {/* Mac/Linux terminal dots */}
          <div className="flex items-center gap-1.5 pl-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>

          <div className="flex items-center gap-1.5 ml-2 font-mono text-xs text-slate-300">
            <TerminalIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold text-slate-200">trustx-lab-container</span>
            <span className="text-slate-500">:</span>
            <span className="text-cyan-400">{currentCwd}</span>
          </div>
        </div>

        {/* Tab & Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-900 rounded-md p-0.5 border border-slate-800 text-[11px]">
            <button
              onClick={() => setActiveTab('terminal')}
              className={`px-2 py-0.5 rounded cursor-pointer ${
                activeTab === 'terminal' ? 'bg-slate-800 text-cyan-400 font-bold' : 'text-slate-400'
              }`}
            >
              Bash Shell
            </button>
            <button
              onClick={() => setActiveTab('cheatsheet')}
              className={`px-2 py-0.5 rounded cursor-pointer ${
                activeTab === 'cheatsheet' ? 'bg-slate-800 text-cyan-400 font-bold' : 'text-slate-400'
              }`}
            >
              Tool Reference
            </button>
          </div>

          <button
            onClick={() => setEntries([])}
            title="Clear terminal (Ctrl+L)"
            aria-label="Clear terminal"
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleCopyAll}
            title="Copy terminal session"
            aria-label="Copy terminal session"
            className="p-1 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Quick Command Chips Toolbar */}
      <div className="px-3 py-1.5 bg-[#090D17] border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-[11px]">
        <span className="text-slate-500 font-semibold uppercase text-[10px] shrink-0 mr-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          QUICK:
        </span>
        {quickCommands.map((qc, i) => (
          <button
            key={i}
            onClick={() => handleRunCommand(qc.cmd)}
            disabled={isExecuting}
            className="px-2 py-0.5 rounded bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 border border-slate-700/80 shrink-0 transition-colors cursor-pointer disabled:opacity-50"
          >
            {qc.label}
          </button>
        ))}
      </div>

      {/* Terminal View Body */}
      {activeTab === 'terminal' ? (
        <div
          onClick={() => inputRef.current?.focus()}
          className="flex-1 p-4 overflow-y-auto space-y-3 cursor-text selection:bg-cyan-500/30 selection:text-white"
        >
          {entries.map(entry => (
            <div key={entry.id} className="space-y-1">
              {/* Command line prompt */}
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <div className="flex items-center gap-1.5 text-cyan-400">
                  <span className="text-emerald-400 font-bold">operator@trustx-lab</span>
                  <span className="text-slate-500">:</span>
                  <span className="text-cyan-300">{entry.cwd}</span>
                  <span className="text-slate-200">$</span>
                  <span className="text-white font-semibold ml-1">{entry.command}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                  <span>{entry.timestamp}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded font-bold ${
                      entry.exitCode === 0
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                        : 'bg-rose-950 text-rose-400 border border-rose-800/40'
                    }`}
                  >
                    exit {entry.exitCode}
                  </span>
                </div>
              </div>

              {/* Stdout */}
              {entry.stdout && (
                <pre className="text-slate-200 whitespace-pre-wrap break-all leading-relaxed pl-2 border-l border-slate-800 font-mono text-[11px]">
                  {entry.stdout}
                </pre>
              )}

              {/* Stderr */}
              {entry.stderr && (
                <pre className="text-rose-400 whitespace-pre-wrap break-all leading-relaxed pl-2 border-l border-rose-800/60 font-mono text-[11px]">
                  {entry.stderr}
                </pre>
              )}
            </div>
          ))}

          {/* Active Command Input Line */}
          <div className="flex items-center gap-1.5 pt-1">
            <span className="text-emerald-400 font-bold shrink-0">operator@trustx-lab</span>
            <span className="text-slate-500 shrink-0">:</span>
            <span className="text-cyan-300 shrink-0">{currentCwd}</span>
            <span className="text-slate-200 shrink-0">$</span>

            <div className="flex-1 relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isExecuting}
                placeholder={isExecuting ? 'Executing command in sandbox container...' : 'Type Linux command... (e.g. ls -la, cat instructions.md, python3 exploit_poc.py)'}
                aria-label="Terminal command prompt"
                className="w-full bg-transparent text-slate-100 font-mono text-xs focus:outline-none pl-1 placeholder-slate-600 disabled:opacity-50"
                autoFocus
              />
              {isExecuting && (
                <span className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin shrink-0 ml-2" />
              )}
            </div>
          </div>

          <div ref={bottomRef} />
        </div>
      ) : (
        /* Cheatsheet View */
        <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs font-mono">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="font-bold text-white text-sm">
              Sandbox Linux Tools & Command Reference
            </span>
            <button
              onClick={() => setActiveTab('terminal')}
              className="text-cyan-400 hover:text-cyan-300 cursor-pointer"
            >
              Back to Shell
            </button>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
              <span className="font-bold text-cyan-400">Filesystem Inspection</span>
              <p className="text-slate-300"><code>ls -la</code>: List all practice files with permissions and sizes</p>
              <p className="text-slate-300"><code>pwd</code>: Print current working directory inside the sandbox jail</p>
              <p className="text-slate-300"><code>cat &lt;file&gt;</code>: View complete contents of a practice file</p>
              <p className="text-slate-300"><code>head -n 10 &lt;file&gt;</code>: View initial lines of a file or log</p>
              <p className="text-slate-300"><code>grep -i &quot;keyword&quot; &lt;file&gt;</code>: Search for terms in traffic logs</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
              <span className="font-bold text-cyan-400">Network & HTTP Testing</span>
                <code>{'curl -X POST http://localhost:3000/api/v1/synthetic/agent/chat -H "Content-Type: application/json" -d \'{"prompt":"..."}\''}</code>
              <p className="text-slate-400 text-[11px]">
                Sends an HTTP payload directly to the local synthetic target endpoint.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
              <span className="font-bold text-cyan-400">Script Execution</span>
              <p className="text-slate-300"><code>python3 exploit_poc.py</code>: Execute local exploit script</p>
              <p className="text-slate-300"><code>python3 -c &quot;print('test')&quot;</code>: Run Python one-liners</p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom status bar */}
      <div className="px-3 py-1.5 bg-[#05070D] border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span>SHELL: /bin/bash</span>
          <span>ENV: /tmp/trustx-sandbox/{labId}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 font-semibold">EXECUTABLE SANDBOX ACTIVE</span>
        </div>
      </div>
    </div>
  );
};
