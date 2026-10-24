import React, { useState } from 'react';
import {
  Award,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  X
} from 'lucide-react';
import { Confetti } from '../common/Confetti';

interface FlagUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  flag: string;
  points: number;
  challengeTitle: string;
  onViewEvidence: () => void;
}

export const FlagUnlockModal: React.FC<FlagUnlockModalProps> = ({
  isOpen,
  onClose,
  flag,
  points,
  challengeTitle,
  onViewEvidence
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(flag);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Confetti durationMs={4000} />
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="flag-modal-title"
      >
        <div
          className="fixed inset-0"
          onClick={onClose}
          aria-hidden="true"
        />

        <div className="relative w-full max-w-lg bg-[#0B0F19] border border-cyan-400/50 rounded-2xl shadow-2xl shadow-cyan-950/60 overflow-hidden z-10 p-6 space-y-5">
          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-4 right-4 p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Celebration Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-cyan-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-cyan-500/30 border border-cyan-300">
              <Award className="w-8 h-8 text-slate-950" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/40 font-mono text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>CHALLENGE COMPLETE</span>
            </div>
            <h2 id="flag-modal-title" className="text-xl font-extrabold text-white tracking-wide">
              Vulnerability Successfully Exploited!
            </h2>
            <p className="text-xs text-slate-300 max-w-sm mx-auto">
              You bypassed weak delimiter enforcement and extracted the confidential system prompt from the synthetic agent.
            </p>
          </div>

          {/* Flag Box */}
          <div className="p-4 rounded-xl bg-[#070A11] border border-cyan-500/40 space-y-2 shadow-inner">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">AUTHENTICATED CAPTURE FLAG</span>
              <span className="text-emerald-400 font-bold">+{points} PTS</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-sm text-cyan-300 font-bold select-all break-all flex items-center justify-between gap-3">
              <span>{flag}</span>
              <button
                onClick={handleCopy}
                aria-label="Copy flag to clipboard"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Flag</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Architectural Takeaway */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-slate-200">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Defense-in-Depth Takeaway</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Prompt injection cannot be prevented purely by polite system prompt directives like &quot;never reveal this&quot;. Enterprise architectures require an upstream Security Gateway with structural delimiter isolation, strict prompt intent scoring, and real-time output token masking.
            </p>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              onClick={() => {
                onClose();
                onViewEvidence();
              }}
              className="flex items-center gap-1.5 text-xs font-mono text-slate-300 hover:text-white px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              <span>Inspect Event in Evidence Center</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition-colors cursor-pointer"
            >
              Continue Labs
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
