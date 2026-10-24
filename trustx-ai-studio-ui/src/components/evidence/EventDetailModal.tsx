import React, { useState } from 'react';
import {
  FileText,
  Copy,
  Check,
  ShieldAlert,
  ShieldCheck,
  X,
  Hash,
  Globe,
  Terminal,
  Activity
} from 'lucide-react';
import { ForensicEvent } from '../../types/evidence';
import { Modal } from '../common/Modal';

interface EventDetailModalProps {
  event: ForensicEvent | null;
  onClose: () => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({ event, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!event) return null;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(event, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={!!event}
      onClose={onClose}
      title={`Forensic Event Record: ${event.id}`}
      maxWidth="2xl"
    >
      <div className="space-y-4 text-xs font-mono">
        {/* Top summary row */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-[#070A11] border border-slate-800">
          <div className="flex items-center gap-2">
            <span
              className={`font-bold px-2 py-0.5 rounded text-[11px] uppercase ${
                event.policyDecision === 'BLOCKED'
                  ? 'bg-rose-950 text-rose-400 border border-rose-800/40'
                  : event.policyDecision === 'FLAGGED'
                  ? 'bg-amber-950 text-amber-400 border border-amber-800/40'
                  : 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
              }`}
            >
              {event.policyDecision}
            </span>
            <span
              className={`font-semibold px-2 py-0.5 rounded text-[10px] uppercase ${
                event.severity === 'CRITICAL'
                  ? 'bg-rose-900/40 text-rose-300'
                  : event.severity === 'WARN'
                  ? 'bg-amber-900/40 text-amber-300'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              SEV: {event.severity}
            </span>
          </div>

          <div className="text-slate-400 text-[11px]">
            Risk Score: <strong className="text-white">{event.riskScore} / 100</strong>
          </div>
        </div>

        {/* Network & Source Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 rounded-lg bg-slate-900/50 border border-slate-800 text-[11px]">
          <div>
            <span className="text-slate-500 block mb-1">CALLER CONTEXT</span>
            <div className="text-slate-300">Source IP: {event.sourceIp}</div>
            <div className="text-slate-400 truncate max-w-xs">UA: {event.userAgent}</div>
            <div className="text-slate-300">Origin: {event.origin}</div>
          </div>
          <div>
            <span className="text-slate-500 block mb-1">TARGET SPECIFICATION</span>
            <div className="text-slate-300">Scenario: {event.challengeTitle}</div>
            <div className="text-cyan-400">Endpoint: {event.method} {event.endpoint}</div>
            <div className="text-slate-400">Timestamp: {new Date(event.timestamp).toLocaleString()}</div>
          </div>
        </div>

        {/* Inspection Steps */}
        {event.inspectionSteps && event.inspectionSteps.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-slate-400 font-semibold text-[11px]">
              GATEWAY INSPECTION VERDICTS
            </span>
            <div className="space-y-1.5">
              {event.inspectionSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded bg-[#070A11] border border-slate-800 flex items-start justify-between text-[11px]"
                >
                  <div>
                    <span className="font-bold text-slate-200">{step.name}: </span>
                    <span className="text-slate-400">{step.details}</span>
                  </div>
                  <span
                    className={`font-bold ml-2 shrink-0 ${
                      step.passed ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {step.passed ? 'PASS' : 'FLAGGED'} ({step.score}/100)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Prompt Preview */}
        <div>
          <span className="text-slate-400 font-semibold text-[11px] block mb-1">
            RECORDED PROMPT PAYLOAD
          </span>
          <pre className="p-3 rounded-lg bg-[#070A11] border border-slate-800 text-slate-200 whitespace-pre-wrap break-all text-[11px] max-h-32 overflow-y-auto">
            {event.promptPreview}
          </pre>
        </div>

        {/* Response Preview */}
        <div>
          <span className="text-slate-400 font-semibold text-[11px] block mb-1">
            RECORDED RESPONSE BODY
          </span>
          <pre className="p-3 rounded-lg bg-[#070A11] border border-slate-800 text-slate-200 whitespace-pre-wrap break-all text-[11px] max-h-36 overflow-y-auto">
            {event.responsePreview}
          </pre>
        </div>

        {/* Forensic Hash */}
        <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 truncate max-w-md">
            <Hash className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-slate-500">SHA-256:</span>
            <span className="text-slate-300 font-mono truncate">{event.forensicHash}</span>
          </div>
          <span className="text-emerald-400 text-[10px] shrink-0">VERIFIED</span>
        </div>

        {/* Action button */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={handleCopyJson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-slate-200 text-xs font-mono transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Full Event JSON</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
