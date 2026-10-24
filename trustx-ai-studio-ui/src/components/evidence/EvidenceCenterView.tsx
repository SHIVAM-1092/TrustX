import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  Download,
  Trash2,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  Hash,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { ForensicEvent, PolicyDecision, EventSeverity } from '../../types/evidence';
import { EventDetailModal } from './EventDetailModal';
import { ApiClient, AuditVerificationResult } from '../../services/apiClient';

interface EvidenceCenterViewProps {
  evidenceLogs: ForensicEvent[];
  onClearLogs: () => void;
}

export const EvidenceCenterView: React.FC<EvidenceCenterViewProps> = ({
  evidenceLogs,
  onClearLogs
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [decisionFilter, setDecisionFilter] = useState<string>('All');
  const [severityFilter, setSeverityFilter] = useState<string>('All');
  const [selectedEvent, setSelectedEvent] = useState<ForensicEvent | null>(null);
  const [verification, setVerification] = useState<AuditVerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerifyChain = async () => {
    setIsVerifying(true);
    const res = await ApiClient.verifyAuditChain();
    setVerification(res);
    setIsVerifying(false);
  };

  const handleSimulateTampering = async () => {
    await ApiClient.simulateTampering();
    const res = await ApiClient.verifyAuditChain();
    setVerification(res);
  };

  const filteredLogs = useMemo(() => {
    return evidenceLogs.filter(evt => {
      const matchesSearch =
        evt.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        evt.challengeTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        evt.promptPreview.toLowerCase().includes(searchTerm.toLowerCase()) ||
        evt.endpoint.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (evt.ruleTriggered && evt.ruleTriggered.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesDecision =
        decisionFilter === 'All' || evt.policyDecision === decisionFilter;

      const matchesSeverity =
        severityFilter === 'All' || evt.severity === severityFilter;

      return matchesSearch && matchesDecision && matchesSeverity;
    });
  }, [evidenceLogs, searchTerm, decisionFilter, severityFilter]);

  const handleExportJson = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(evidenceLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `trustx-forensic-evidence-${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-bold text-white tracking-wide">
              TrustX Forensic Evidence Center
            </h1>
            <span className="px-2 py-0.5 rounded bg-cyan-950/80 text-[10px] font-mono text-cyan-400 border border-cyan-800/40">
              {evidenceLogs.length} EVENTS RECORDED
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Chronological forensic audit ledger recording prompt payloads, gateway inspection scoring, and verification hashes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON Audit</span>
          </button>

          <button
            onClick={onClearLogs}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-800/40 text-xs font-mono transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset Logs</span>
          </button>
        </div>
      </div>

      {/* Cryptographic SHA-256 Chain Verification Bar */}
      <div className="rounded-xl bg-[#0B0F19] border border-slate-800 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/40">
              <Hash className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Cryptographic SHA-256 Audit Chain Verification</span>
                {verification ? (
                  verification.valid ? (
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] font-mono border border-emerald-800/40 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> VERIFIED INTACT ({verification.totalChecked} BLOCKS)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 text-[10px] font-mono border border-rose-800/40 flex items-center gap-1 animate-pulse">
                      <AlertTriangle className="w-3 h-3" /> INTEGRITY FAILED
                    </span>
                  )
                ) : (
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono">
                    UNVERIFIED
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Every event contains previousHash chaining to mathematically guarantee ledger immutability.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleVerifyChain}
              disabled={isVerifying}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-cyan-300 border border-cyan-500/30 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isVerifying ? 'Verifying Hashes...' : 'Verify Chain Integrity'}</span>
            </button>

            <button
              onClick={handleSimulateTampering}
              title="Tamper with a historical record to verify forensic failure detection"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-xs font-mono text-rose-300 border border-rose-800/40 transition-colors cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Simulate Tampering</span>
            </button>
          </div>
        </div>

        {/* Verification Failure Warning Box */}
        {verification && !verification.valid && (
          <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-700 text-rose-300 text-xs space-y-1 animate-in fade-in">
            <div className="font-bold flex items-center gap-1.5 text-rose-200">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>CRITICAL ALERT: FORENSIC AUDIT CHAIN INTEGRITY COMPROMISED</span>
            </div>
            <p className="text-[11px] text-rose-300">
              The mathematical hash chain has been broken. A historical event payload was altered without corresponding signature recalculation.
            </p>
            {verification.errors.map((err, i) => (
              <div key={i} className="text-[10px] font-mono text-rose-400 pl-4">
                • {err}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="rounded-xl bg-[#0B0F19] border border-slate-800 p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search event ID, prompt keywords, endpoint, or rule..."
              aria-label="Search forensic events"
              className="w-full bg-[#070A11] border border-slate-700/80 rounded-lg pl-10 pr-4 py-2 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto text-xs font-mono">
            {/* Decision Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px]">DECISION:</span>
              {['All', 'ALLOWED', 'FLAGGED', 'BLOCKED'].map(d => (
                <button
                  key={d}
                  onClick={() => setDecisionFilter(d)}
                  className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                    decisionFilter === d
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            {/* Severity Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px]">SEVERITY:</span>
              {['All', 'INFO', 'WARN', 'CRITICAL'].map(s => (
                <button
                  key={s}
                  onClick={() => setSeverityFilter(s)}
                  className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                    severityFilter === s
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="rounded-xl bg-[#0B0F19] border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-[#070A11] text-slate-400 text-[11px]">
                <th className="py-3 px-4">EVENT ID & TIME</th>
                <th className="py-3 px-3">SCENARIO / TARGET</th>
                <th className="py-3 px-3">DECISION</th>
                <th className="py-3 px-3">RISK SCORE</th>
                <th className="py-3 px-3">PROMPT PREVIEW</th>
                <th className="py-3 px-3">STATUS</th>
                <th className="py-3 px-4 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLogs.length > 0 ? (
                filteredLogs.map(evt => (
                  <tr
                    key={evt.id}
                    onClick={() => setSelectedEvent(evt)}
                    className="hover:bg-slate-900/50 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-cyan-400 group-hover:underline">
                        {evt.id}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(evt.timestamp).toLocaleTimeString()}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-200 font-sans truncate max-w-[200px]">
                        {evt.challengeTitle}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {evt.method} {evt.endpoint}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          evt.policyDecision === 'BLOCKED'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800/40'
                            : evt.policyDecision === 'FLAGGED'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800/40'
                            : 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                        }`}
                      >
                        {evt.policyDecision}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`font-bold ${
                          evt.riskScore > 70
                            ? 'text-rose-400'
                            : evt.riskScore > 30
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {evt.riskScore}/100
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="text-slate-300 text-[11px] truncate max-w-[260px]">
                        {evt.promptPreview}
                      </div>
                      {evt.ruleTriggered && (
                        <div className="text-[10px] text-amber-400 truncate max-w-[260px]">
                          {evt.ruleTriggered}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      {evt.flagCaptured ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>FLAG REVEALED</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono">
                          NO LEAK
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <span className="text-xs text-cyan-400 font-bold group-hover:text-cyan-300 inline-flex items-center gap-1">
                        <span>Details</span>
                        <ExternalLink className="w-3 h-3" />
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500 font-mono">
                    No forensic events match the filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Forensic Event Detail Modal */}
      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
};
