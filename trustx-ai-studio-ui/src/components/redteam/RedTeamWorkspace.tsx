import React, { useState, useEffect } from 'react';
import {
  Terminal as TerminalIcon,
  Shield,
  RotateCcw,
  Square,
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  AlertTriangle,
  FileText,
  Activity,
  Send,
  Sparkles,
  Award,
  Copy,
  Check
} from 'lucide-react';
import { Challenge } from '../../types/challenge';
import { ApiClient } from '../../services/apiClient';
import { StorageService } from '../../services/storageService';
import { FileExplorerComponent } from './FileExplorerComponent';
import { TerminalComponent } from './TerminalComponent';
import { FlagUnlockModal } from '../workspace/FlagUnlockModal';

interface RedTeamWorkspaceProps {
  challenge: Challenge;
  onReturnToCatalog: () => void;
  onNavigateTab: (tab: 'evidence' | 'gateway' | 'admin') => void;
}

export const RedTeamWorkspace: React.FC<RedTeamWorkspaceProps> = ({
  challenge,
  onReturnToCatalog,
  onNavigateTab
}) => {
  const [activeLeftTab, setActiveLeftTab] = useState<'brief' | 'files' | 'tasks'>('brief');
  const [targetPrompt, setTargetPrompt] = useState(challenge.examplePayloads[0]?.prompt || '');
  const [isSendingPrompt, setIsSendingPrompt] = useState(false);
  const [targetResponse, setTargetResponse] = useState<string | null>(null);
  const [isSolved, setIsSolved] = useState(false);
  const [capturedFlag, setCapturedFlag] = useState<string | null>(null);
  const [flagInput, setFlagInput] = useState('');
  const [flagFeedback, setFlagFeedback] = useState<'success' | 'error' | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [tasks, setTasks] = useState(challenge.tasks);
  const [labState, setLabState] = useState<'Ready' | 'Stopped'>('Ready');

  useEffect(() => {
    const solved = StorageService.getSolvedChallenges().includes(challenge.id);
    setIsSolved(solved);
    const flags = StorageService.getCapturedFlags();
    if (flags[challenge.id]) {
      setCapturedFlag(flags[challenge.id]);
    }
  }, [challenge.id]);

  const handleSendPromptToTarget = async () => {
    if (!targetPrompt.trim() || isSendingPrompt) return;
    setIsSendingPrompt(true);

    try {
      const res = await fetch(challenge.targetEndpoint, {
        method: challenge.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: targetPrompt })
      });
      const data = await res.json();
      setTargetResponse(data.output || JSON.stringify(data, null, 2));

      // If output contains a flag, auto-capture it
      if (data.flag_leaked || (data.output && data.output.includes('TRUSTX{'))) {
        const match = data.output.match(/TRUSTX\{[a-zA-Z0-9_]+\}/);
        if (match) {
          handleValidateFlag(match[0]);
        }
      }
    } catch (err: any) {
      setTargetResponse(`[ERROR] Connection failed: ${err.message}`);
    } finally {
      setIsSendingPrompt(false);
    }
  };

  const handleValidateFlag = async (flagToTest: string) => {
    const res = await ApiClient.validateFlagServerSide(challenge.id, flagToTest);
    if (res.valid) {
      setIsSolved(true);
      setCapturedFlag(res.flag || flagToTest);
      StorageService.saveSolvedChallenge(challenge.id);
      StorageService.saveCapturedFlag(challenge.id, res.flag || flagToTest);
      setFlagFeedback('success');
      setShowModal(true);
      setTasks(prev => prev.map(t => ({ ...t, completed: true })));
    } else {
      setFlagFeedback('error');
      setTimeout(() => setFlagFeedback(null), 3500);
    }
  };

  const handleResetLab = async () => {
    await ApiClient.resetLab(challenge.id);
    setTargetResponse(null);
    setFlagFeedback(null);
    setTargetPrompt(challenge.examplePayloads[0]?.prompt || '');
  };

  const handleStopLab = async () => {
    await ApiClient.stopLab(challenge.id);
    setLabState('Stopped');
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Top Navigation & Workspace Header */}
      <div className="rounded-xl bg-[#0B0F19] border border-slate-800 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onReturnToCatalog}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Return to Labs Catalog"
            aria-label="Return to Labs Catalog"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="p-2 rounded-lg bg-rose-950/80 text-rose-400 border border-rose-500/40 shrink-0">
            <TerminalIcon className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase bg-rose-950 text-rose-300 border border-rose-800/40">
                RED TEAM WORKSPACE
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                  labState === 'Ready'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                    : 'bg-rose-950 text-rose-400 border border-rose-800/40'
                }`}
              >
                {labState}
              </span>
              <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                /tmp/trustx-sandbox/{challenge.id}
              </span>
            </div>
            <h1 className="text-base font-bold text-white mt-0.5">
              {challenge.title}
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            onClick={handleResetLab}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Reset Lab</span>
          </button>

          <button
            onClick={handleStopLab}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-200 border border-rose-800/60 transition-colors cursor-pointer"
          >
            <Square className="w-3.5 h-3.5 text-rose-400" />
            <span>Stop Lab</span>
          </button>
        </div>
      </div>

      {/* 3-Panel Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[660px]">
        {/* Left Panel: Briefing, Practice Files, Tasks (3 cols) */}
        <div className="lg:col-span-3 rounded-xl bg-[#0B0F19] border border-slate-800 flex flex-col overflow-hidden">
          {/* Subtabs */}
          <div className="flex items-center border-b border-slate-800 bg-[#070A11] p-1.5 gap-1 font-mono text-xs">
            <button
              onClick={() => setActiveLeftTab('brief')}
              className={`flex-1 py-1 rounded text-center cursor-pointer transition-colors ${
                activeLeftTab === 'brief'
                  ? 'bg-slate-800 text-cyan-400 font-bold border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Mission
            </button>
            <button
              onClick={() => setActiveLeftTab('files')}
              className={`flex-1 py-1 rounded text-center cursor-pointer transition-colors ${
                activeLeftTab === 'files'
                  ? 'bg-slate-800 text-cyan-400 font-bold border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Files
            </button>
            <button
              onClick={() => setActiveLeftTab('tasks')}
              className={`flex-1 py-1 rounded text-center cursor-pointer transition-colors ${
                activeLeftTab === 'tasks'
                  ? 'bg-slate-800 text-cyan-400 font-bold border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tasks
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs font-sans">
            {activeLeftTab === 'brief' && (
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">
                    OBJECTIVE & SCOPE
                  </span>
                  <p className="text-slate-300 mt-1 leading-relaxed text-xs">
                    {challenge.description}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-[#070A11] border border-slate-800 font-mono text-[11px] space-y-1.5">
                  <div className="text-slate-400 font-semibold">TARGET PROFILE</div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Method:</span>
                    <span className="text-cyan-400 font-bold">{challenge.method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Endpoint:</span>
                    <span className="text-slate-200 truncate">{challenge.targetEndpoint}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Flag Format:</span>
                    <span className="text-emerald-400">TRUSTX{'{...}'}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">
                    KEY HINTS
                  </span>
                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px]">
                      1. Check the <code>exploit_poc.py</code> script in the practice files tab or run it directly in the terminal!
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px]">
                      2. Weak delimiters invert priority on imperative prompts like &quot;Ignore all previous instructions...&quot;
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeLeftTab === 'files' && (
              <FileExplorerComponent labId={challenge.id} />
            )}

            {activeLeftTab === 'tasks' && (
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">
                  MISSION CHECKLIST
                </span>
                {tasks.map(t => (
                  <div
                    key={t.id}
                    className={`p-2.5 rounded-lg border text-xs font-mono flex items-start gap-2 ${
                      t.completed
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                        : 'bg-[#070A11] border-slate-800 text-slate-300'
                    }`}
                  >
                    <CheckCircle2
                      className={`w-4 h-4 mt-0.5 shrink-0 ${
                        t.completed ? 'text-emerald-400' : 'text-slate-600'
                      }`}
                    />
                    <div className={t.completed ? 'line-through opacity-80' : ''}>
                      {t.label}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center Panel: Real Linux Terminal (5 cols) */}
        <div className="lg:col-span-5 min-h-[500px]">
          <TerminalComponent labId={challenge.id} />
        </div>

        {/* Right Panel: Target REST Workbench & Flag Validation (4 cols) */}
        <div className="lg:col-span-4 rounded-xl bg-[#0B0F19] border border-slate-800 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-3 bg-[#070A11] border-b border-slate-800 flex items-center justify-between font-mono text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>TARGET INTERACTION & RESULTS</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              HTTP POST API
            </span>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {/* Quick HTTP Test bench */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Prompt Payload:</span>
                <span className="text-[10px] text-cyan-400">Direct Target Dispatch</span>
              </div>
              <textarea
                value={targetPrompt}
                onChange={e => setTargetPrompt(e.target.value)}
                rows={3}
                aria-label="Direct prompt payload"
                placeholder="Type prompt to send directly to synthetic target..."
                className="w-full bg-[#070A11] border border-slate-700/80 rounded-lg p-3 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500 resize-none leading-relaxed"
              />
              <button
                onClick={handleSendPromptToTarget}
                disabled={isSendingPrompt || !targetPrompt.trim()}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition-colors disabled:opacity-40 cursor-pointer"
              >
                {isSendingPrompt ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Transmitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Request to Target</span>
                  </>
                )}
              </button>
            </div>

            {/* Target Response Viewer */}
            <div className="space-y-1">
              <span className="text-[11px] font-mono text-slate-400 font-semibold">
                TARGET RESPONSE STREAM
              </span>
              <div className="p-3 bg-[#070A11] rounded-lg border border-slate-800 font-mono text-xs min-h-[140px] max-h-[220px] overflow-y-auto">
                {targetResponse ? (
                  <pre className="text-slate-200 whitespace-pre-wrap break-all text-[11px] leading-relaxed">
                    {targetResponse}
                  </pre>
                ) : (
                  <div className="text-slate-500 text-center py-8 text-[11px]">
                    No request transmitted yet. Use the prompt box above or run <code>curl</code> or <code>python3 exploit_poc.py</code> in the terminal!
                  </div>
                )}
              </div>
            </div>

            {/* Server-Side Flag Validation */}
            <div className="p-3.5 rounded-lg bg-[#070A11] border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                  <span>FLAG VERIFICATION</span>
                </span>
                {isSolved ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                    VERIFIED
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800/40">
                    PENDING
                  </span>
                )}
              </div>

              {isSolved && capturedFlag ? (
                <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-emerald-300 font-semibold">
                    <span>Verified Master Flag:</span>
                    <span className="text-[10px] bg-emerald-900/60 px-1.5 py-0.2 rounded text-emerald-300">
                      +{challenge.points} PTS
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-emerald-800/40 font-mono text-xs text-emerald-400 select-all break-all">
                    {capturedFlag}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-[11px] text-slate-400 font-sans">
                    Submit the extracted flag for server-side validation:
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={flagInput}
                      onChange={e => setFlagInput(e.target.value)}
                      placeholder="TRUSTX{...}"
                      aria-label="Flag input"
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      onClick={() => handleValidateFlag(flagInput)}
                      className="px-3 py-1.5 rounded-md bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition-colors cursor-pointer"
                    >
                      Submit
                    </button>
                  </div>

                  {flagFeedback === 'error' && (
                    <div className="text-[11px] font-mono text-rose-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Incorrect flag. Inspect the model output carefully!</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Flag Unlock Modal */}
      <FlagUnlockModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        flag={capturedFlag || ''}
        points={challenge.points}
        challengeTitle={challenge.title}
        onViewEvidence={() => onNavigateTab('evidence')}
      />
    </div>
  );
};
