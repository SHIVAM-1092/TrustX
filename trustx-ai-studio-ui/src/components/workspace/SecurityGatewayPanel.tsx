import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Flag,
  Copy,
  Check,
  ExternalLink,
  Lock,
  Unlock,
  KeyRound,
  FileText
} from 'lucide-react';
import { Challenge } from '../../types/challenge';
import { SimulationResult } from '../../services/simulationEngine';
import { FlowDiagramMini } from './FlowDiagramMini';

interface SecurityGatewayPanelProps {
  challenge: Challenge;
  latestResult: SimulationResult | null;
  isExecuting: boolean;
  activeStage: number;
  isSolved: boolean;
  capturedFlag?: string;
  onSubmitFlag: (flagInput: string) => boolean;
  onOpenEvidence: () => void;
}

export const SecurityGatewayPanel: React.FC<SecurityGatewayPanelProps> = ({
  challenge,
  latestResult,
  isExecuting,
  activeStage,
  isSolved,
  capturedFlag,
  onSubmitFlag,
  onOpenEvidence
}) => {
  const [manualFlagInput, setManualFlagInput] = useState('');
  const [submissionFeedback, setSubmissionFeedback] = useState<'success' | 'incorrect' | null>(null);
  const [copiedFlag, setCopiedFlag] = useState(false);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualFlagInput.trim()) return;
    const ok = onSubmitFlag(manualFlagInput.trim());
    if (ok) {
      setSubmissionFeedback('success');
    } else {
      setSubmissionFeedback('incorrect');
      setTimeout(() => setSubmissionFeedback(null), 3000);
    }
  };

  const handleCopyFlag = () => {
    const flagToCopy = capturedFlag || challenge.flag;
    navigator.clipboard.writeText(flagToCopy);
    setCopiedFlag(true);
    setTimeout(() => setCopiedFlag(false), 2000);
  };

  const activeFlag = capturedFlag || (isSolved ? challenge.flag : undefined);

  return (
    <div className="h-full flex flex-col bg-[#0B0F19] rounded-xl border border-slate-800 overflow-hidden">
      {/* Top Header */}
      <div className="p-3 bg-[#070A11] border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 font-mono text-xs">
          <ShieldAlert className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-white tracking-wide">
            GATEWAY INSPECTION & AUDIT
          </span>
        </div>
        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] font-mono text-slate-400 border border-slate-700">
          REAL-TIME TELEMETRY
        </span>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {/* Pipeline Flow Visualization */}
        <FlowDiagramMini
          isExecuting={isExecuting}
          activeStage={activeStage}
          policyDecision={latestResult?.policyDecision}
          flagCaptured={latestResult?.flagCaptured || isSolved}
        />

        {/* Policy Decision Banner */}
        <div className="p-3.5 rounded-lg bg-[#070A11] border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 font-semibold">GATEWAY POLICY DECISION</span>
            {latestResult ? (
              <span
                className={`font-bold px-2 py-0.5 rounded text-[11px] uppercase ${
                  latestResult.policyDecision === 'BLOCKED'
                    ? 'bg-rose-950 text-rose-400 border border-rose-800/40'
                    : latestResult.policyDecision === 'FLAGGED'
                    ? 'bg-amber-950 text-amber-400 border border-amber-800/40'
                    : 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                }`}
              >
                {latestResult.policyDecision}
              </span>
            ) : (
              <span className="text-slate-400 text-[11px]">AWAITING DISPATCH</span>
            )}
          </div>

          {latestResult ? (
            <div className="space-y-1.5 pt-1 text-[11px] font-mono">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Heuristic Risk Score:</span>
                <span
                  className={`font-bold ${
                    latestResult.riskScore > 70
                      ? 'text-rose-400'
                      : latestResult.riskScore > 30
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {latestResult.riskScore} / 100
                </span>
              </div>

              {latestResult.ruleTriggered && (
                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-400 shrink-0">Rule Trigger:</span>
                  <span className="text-amber-400 text-right truncate">
                    {latestResult.ruleTriggered}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-[11px] text-slate-400 font-mono">
              Send a request from the workbench to observe gateway boundary scoring.
            </p>
          )}
        </div>

        {/* Inspection Steps Breakdown */}
        {latestResult && latestResult.inspectionSteps.length > 0 && (
          <div className="p-3.5 rounded-lg bg-[#070A11] border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono text-slate-300">
              <span className="font-semibold flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>Inspection Stage Scoring</span>
              </span>
              <span className="text-[10px] text-slate-400">3 CHECKS</span>
            </div>

            <div className="space-y-2">
              {latestResult.inspectionSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded bg-slate-900/60 border border-slate-800 text-[11px] font-mono space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">{step.name}</span>
                    <span
                      className={`font-bold ${
                        step.passed ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {step.passed ? 'PASS' : 'FLAGGED'} ({step.score}/100)
                    </span>
                  </div>
                  <p className="text-slate-400 text-[10px] font-sans leading-normal">
                    {step.details}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Flag Submission & Captured Display */}
        <div className="p-3.5 rounded-lg bg-[#070A11] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
              <span>CHALLENGE FLAG CAPTURE</span>
            </span>
            {isSolved ? (
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40 text-[10px] font-bold">
                SOLVED
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800/40 text-[10px]">
                PENDING
              </span>
            )}
          </div>

          {activeFlag ? (
            <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-emerald-300 font-semibold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Flag Captured & Verified!</span>
                </span>
                <span className="text-[10px] bg-emerald-900/60 px-1.5 py-0.2 rounded text-emerald-300">
                  +100 PTS
                </span>
              </div>

              <div className="p-2 rounded bg-slate-950 border border-emerald-800/40 font-mono text-xs text-emerald-400 select-all break-all flex items-center justify-between gap-2">
                <span>{activeFlag}</span>
                <button
                  onClick={handleCopyFlag}
                  title="Copy captured flag"
                  className="p-1 rounded text-emerald-400 hover:text-white hover:bg-emerald-900/40 transition-colors cursor-pointer shrink-0"
                >
                  {copiedFlag ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-2">
              <p className="text-[11px] text-slate-400">
                Extract the system prompt to discover the secret flag, or paste it below:
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={manualFlagInput}
                  onChange={e => setManualFlagInput(e.target.value)}
                  placeholder="TRUSTX{...}"
                  aria-label="Flag input"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-md bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition-colors cursor-pointer"
                >
                  Submit
                </button>
              </div>

              {submissionFeedback === 'incorrect' && (
                <div className="text-[11px] font-mono text-rose-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Incorrect flag. Inspect the model output carefully!</span>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Forensic Event Telemetry Link */}
        <div className="pt-1">
          <button
            onClick={onOpenEvidence}
            className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors text-xs font-mono cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>Inspect in Evidence Center</span>
            </span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  );
};
