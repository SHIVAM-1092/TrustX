import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Hash,
  ArrowLeft,
  FileText,
  Clock,
  Layers,
  Sparkles,
  ExternalLink,
  Edit3,
  Save,
  Check
} from 'lucide-react';
import { ApiClient, AuditVerificationResult } from '../../services/apiClient';

interface BlueTeamWorkspaceProps {
  onReturnToCatalog: () => void;
  onNavigateTab: (tab: 'evidence' | 'admin') => void;
}

export const BlueTeamWorkspace: React.FC<BlueTeamWorkspaceProps> = ({
  onReturnToCatalog,
  onNavigateTab
}) => {
  const [events, setEvents] = useState<any[]>([]);
  const [verification, setVerification] = useState<AuditVerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [tamperingNotice, setTamperingNotice] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState('All');
  const [filterDecision, setFilterDecision] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [investigationNotes, setInvestigationNotes] = useState(
    '### Blue Team Investigation Log #2026-10-22\n- Target: /api/v1/synthetic/agent/chat\n- Observed prompt injection attempt from 192.168.1.104 with override keyword "ignore all previous instructions".\n- Gateway Policy RULE-AI-01 triggered alert.\n- Hash chain integrity currently being monitored for unauthorized ledger tampering.'
  );
  const [notesSaved, setNotesSaved] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  const loadData = async () => {
    const list = await ApiClient.getAuditEvents();
    setEvents(list);
    handleVerifyChain();
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleVerifyChain = async () => {
    setIsVerifying(true);
    const result = await ApiClient.verifyAuditChain();
    setVerification(result);
    setIsVerifying(false);
  };

  const handleSimulateTampering = async () => {
    const res = await ApiClient.simulateTampering();
    setTamperingNotice(res.message);
    // Reload events to get corrupted record
    const list = await ApiClient.getAuditEvents();
    setEvents(list);
    // Automatically re-verify to show the failure!
    const vResult = await ApiClient.verifyAuditChain();
    setVerification(vResult);
  };

  const handleSaveNotes = () => {
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  };

  const filteredEvents = events.filter(e => {
    const matchesSearch =
      e.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.payloadSummary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.endpoint.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDecision = filterDecision === 'All' || e.policyDecision === filterDecision;
    const matchesSeverity =
      filterSeverity === 'All' ||
      (filterSeverity === 'CRITICAL' && e.riskScore >= 70) ||
      (filterSeverity === 'WARN' && e.riskScore >= 30 && e.riskScore < 70) ||
      (filterSeverity === 'INFO' && e.riskScore < 30);

    return matchesSearch && matchesDecision && matchesSeverity;
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Top Header */}
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

          <div className="p-2 rounded-lg bg-blue-950/80 text-blue-400 border border-blue-500/40 shrink-0">
            <Shield className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase bg-blue-950 text-blue-300 border border-blue-800/40">
                BLUE TEAM INVESTIGATION WORKSPACE
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase bg-slate-800 text-slate-300">
                AUDIT TELEMETRY & FORENSICS
              </span>
            </div>
            <h1 className="text-base font-bold text-white mt-0.5">
              Incident Correlation & Cryptographic Hash-Chain Verification
            </h1>
          </div>
        </div>

        {/* Verification Controls */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            onClick={handleVerifyChain}
            disabled={isVerifying}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-colors cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
            <span>Verify Audit Chain</span>
          </button>

          <button
            onClick={handleSimulateTampering}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800/50 transition-colors cursor-pointer"
            title="Inject simulated unauthorized record modification to test integrity detection"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Simulate Tampering Test</span>
          </button>
        </div>
      </div>

      {/* Prominent Cryptographic Audit-Chain Verification Status Card */}
      {verification && (
        <div
          className={`p-4 rounded-xl border font-mono text-xs transition-all ${
            verification.valid
              ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/50 border-rose-500 text-rose-200 shadow-xl shadow-rose-950/40 ring-1 ring-rose-500/60'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              {verification.valid ? (
                <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0 mt-0.5 animate-bounce" />
              )}
              <div className="space-y-1">
                <div className="font-bold text-sm tracking-wide flex items-center gap-2">
                  <span>
                    {verification.valid
                      ? 'CRYPTOGRAPHIC AUDIT-CHAIN INTEGRITY: VERIFIED VALID'
                      : 'CRITICAL WARNING: AUDIT-CHAIN INTEGRITY COMPROMISED / CORRUPTED'}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 text-slate-300">
                    {verification.totalChecked} RECORDS SCANNED
                  </span>
                </div>
                <p className="text-xs font-sans leading-relaxed text-slate-300">
                  {verification.valid
                    ? 'All historical forensic records possess matching SHA-256 parent hash signatures. No record tampering, deletion, or out-of-order reinsertion detected.'
                    : 'A forensic hash signature mismatch was detected in the audit ledger. Historical records have been modified without updating the parent cryptographic hash!'}
                </p>

                {/* If invalid, print actual errors honestly */}
                {!verification.valid && verification.errors.length > 0 && (
                  <div className="mt-2 p-2.5 rounded bg-black/60 border border-rose-800/80 space-y-1 text-[11px] text-rose-300">
                    <div className="font-bold text-rose-400 uppercase">Integrity Failure Log:</div>
                    {verification.errors.map((err, i) => (
                      <div key={i} className="flex items-start gap-1">
                        <span>›</span>
                        <span>{err}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="text-right shrink-0 text-[10px] text-slate-400">
              Verified: {new Date(verification.verifiedAt).toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Correlation Timeline (8 cols) & Investigation Notebook (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Correlation Timeline */}
        <div className="lg:col-span-8 rounded-xl bg-[#0B0F19] border border-slate-800 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <span className="font-bold text-white text-sm font-mono flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>INCIDENT CORRELATION TIMELINE ({filteredEvents.length})</span>
            </span>

            {/* Quick Filters */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search events..."
                className="bg-[#070A11] border border-slate-700 rounded px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 w-36 sm:w-44"
              />
              <select
                value={filterDecision}
                onChange={e => setFilterDecision(e.target.value)}
                className="bg-[#070A11] border border-slate-700 rounded px-2 py-1 text-slate-300 text-xs cursor-pointer"
              >
                <option value="All">All Decisions</option>
                <option value="ALLOW">ALLOW</option>
                <option value="DENY">DENY</option>
                <option value="FLAGGED">FLAGGED</option>
              </select>
            </div>
          </div>

          {/* Timeline List */}
          <div className="space-y-2.5 max-h-[500px] overflow-y-auto font-mono text-xs">
            {filteredEvents.length > 0 ? (
              filteredEvents.map(evt => (
                <div
                  key={evt.id}
                  onClick={() => setSelectedEvent(evt)}
                  className="p-3 rounded-lg bg-[#070A11] border border-slate-800 hover:border-blue-500/50 transition-all cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-bold px-2 py-0.5 rounded uppercase ${
                          evt.policyDecision === 'DENY'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800/40'
                            : evt.policyDecision === 'FLAGGED'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800/40'
                            : 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                        }`}
                      >
                        {evt.policyDecision}
                      </span>
                      <span className="text-cyan-400 font-bold">{evt.id}</span>
                      <span className="text-slate-500">({evt.sourceIdentity})</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400 text-[10px]">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>

                  <div className="text-slate-200 text-xs font-mono line-clamp-1">
                    {evt.payloadSummary}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
                    <span className="truncate max-w-xs">
                      Target: <strong className="text-slate-300">{evt.endpoint}</strong>
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Hash className="w-3 h-3 text-cyan-400" />
                      <span className="truncate max-w-[120px]">{evt.eventHash}</span>
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-500 font-mono text-xs">
                No events match filter criteria.
              </div>
            )}
          </div>
        </div>

        {/* Right: Analyst Investigation Notebook */}
        <div className="lg:col-span-4 rounded-xl bg-[#0B0F19] border border-slate-800 p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 font-mono text-xs">
              <span className="font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-cyan-400" />
                <span>INVESTIGATION NOTEBOOK</span>
              </span>
              <button
                onClick={handleSaveNotes}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer text-xs"
              >
                {notesSaved ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Saved</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3 h-3" />
                    <span>Save</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              Record incident hypotheses, threat actor indicators (IoCs), and forensic conclusions for this training scenario.
            </p>

            <textarea
              value={investigationNotes}
              onChange={e => setInvestigationNotes(e.target.value)}
              rows={12}
              aria-label="Investigation Notes"
              className="w-full bg-[#070A11] border border-slate-700/80 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500 resize-none leading-relaxed"
            />
          </div>

          <div className="p-3 rounded-lg bg-[#070A11] border border-slate-800/80 font-mono text-[11px] text-slate-400 space-y-1">
            <div className="text-slate-300 font-semibold">INVESTIGATOR METRICS</div>
            <div className="flex justify-between">
              <span>Audited Events:</span>
              <span className="text-cyan-400 font-bold">{events.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Cryptographic Chain:</span>
              <span className={verification?.valid ? 'text-emerald-400' : 'text-rose-400'}>
                {verification?.valid ? 'INTACT' : 'TAMPERED / FAILED'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
