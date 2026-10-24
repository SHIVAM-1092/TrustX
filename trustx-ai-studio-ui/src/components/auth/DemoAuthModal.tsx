import React, { useState } from 'react';
import {
  Shield,
  User,
  Check,
  X,
  Lock,
  Terminal,
  Activity,
  Sliders,
  AlertTriangle,
  Info
} from 'lucide-react';

export type DemoRole = 'admin' | 'redteam' | 'blueteam';

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: DemoRole;
  roleTitle: string;
  badgeColor: 'cyan' | 'rose' | 'emerald';
  clearance: string;
  description: string;
  recommendedTabs: string[];
}

export const DEMO_USERS: Record<DemoRole, DemoUser> = {
  redteam: {
    id: 'user-redteam',
    name: 'Alex Vance',
    email: 'operator-redteam@hackinthehills.local',
    role: 'redteam',
    roleTitle: 'Red Team Operator',
    badgeColor: 'rose',
    clearance: 'Tier 1 Adversarial Operator',
    description:
      'Focuses on prompt injection, delimiter escapes, BOLA exploitation, and token exfiltration in the training lab.',
    recommendedTabs: ['workspace', 'labs']
  },
  blueteam: {
    id: 'user-blueteam',
    name: 'Marcus Thorne',
    email: 'forensics-lead@hackinthehills.local',
    role: 'blueteam',
    roleTitle: 'Blue Team Forensic Analyst',
    badgeColor: 'cyan',
    clearance: 'Tier 2 Security Operations Analyst',
    description:
      'Focuses on telemetry correlation, gateway rule alerts, SHA-256 audit chain verification, and tamper detection.',
    recommendedTabs: ['evidence', 'gateway']
  },
  admin: {
    id: 'user-admin',
    name: 'Dr. Elena Rostova',
    email: 'admin-secops@hackinthehills.local',
    role: 'admin',
    roleTitle: 'Lab Administrator',
    badgeColor: 'emerald',
    clearance: 'SecOps Root Controller',
    description:
      'Manages security gateway mode policies (Strict vs Permissive), scenario state resets, and telemetry preloading.',
    recommendedTabs: ['admin', 'gateway']
  }
};

interface DemoAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: DemoRole;
  onSelectRole: (role: DemoRole) => void;
}

export const DemoAuthModal: React.FC<DemoAuthModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  onSelectRole
}) => {
  const [activeTab, setActiveTab] = useState<'personas' | 'login'>('personas');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSimulatedLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setLoginError('Please enter username/email and password.');
      return;
    }

    if (loginEmail.toLowerCase().includes('admin')) {
      onSelectRole('admin');
      onClose();
    } else if (loginEmail.toLowerCase().includes('blue') || loginEmail.toLowerCase().includes('forensic')) {
      onSelectRole('blueteam');
      onClose();
    } else {
      onSelectRole('redteam');
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl rounded-2xl bg-[#0B0F19] border border-slate-700/80 p-6 shadow-2xl shadow-cyan-950/30 text-slate-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close identity modal"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800/40 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 id="auth-modal-title" className="text-lg font-bold text-white tracking-wide">
              Demo Environment Identity & Roles
            </h2>
            <p className="text-xs text-slate-400">
              Select an operator persona to tailor the lab recording perspective.
            </p>
          </div>
        </div>

        {/* Demo Disclaimer */}
        <div className="my-4 p-3 rounded-lg bg-amber-950/30 border border-amber-800/40 text-amber-300 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
          <div>
            <span className="font-bold">DEMO ENVIRONMENT ROLE SWITCHER:</span> Persona switching adapts the recording view, recommended workflows, and operator identity in audit headers. It operates locally for video demonstrations and does not weaken server-side authorization.
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-2 mb-4 p-1 rounded-lg bg-[#070A11] border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setActiveTab('personas')}
            className={`flex-1 py-1.5 rounded-md text-center font-bold transition-all cursor-pointer ${
              activeTab === 'personas'
                ? 'bg-cyan-500 text-slate-950'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Quick Persona Switcher
          </button>
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-1.5 rounded-md text-center font-bold transition-all cursor-pointer ${
              activeTab === 'login'
                ? 'bg-cyan-500 text-slate-950'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Simulate Credential Login
          </button>
        </div>

        {activeTab === 'personas' ? (
          <div className="space-y-3">
            {(Object.keys(DEMO_USERS) as DemoRole[]).map(roleKey => {
              const u = DEMO_USERS[roleKey];
              const isSelected = currentRole === roleKey;
              return (
                <div
                  key={roleKey}
                  onClick={() => {
                    onSelectRole(roleKey);
                    onClose();
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer text-left flex items-start justify-between gap-4 ${
                    isSelected
                      ? 'bg-slate-900/90 border-cyan-500 shadow-lg shadow-cyan-950/30'
                      : 'bg-[#070A11] border-slate-800 hover:border-slate-700 hover:bg-slate-900/40'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{u.name}</span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                          u.role === 'admin'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                            : u.role === 'redteam'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800/40'
                            : 'bg-cyan-950 text-cyan-400 border border-cyan-800/40'
                        }`}
                      >
                        {u.roleTitle}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] font-mono text-cyan-400 flex items-center gap-1">
                          <Check className="w-3 h-3" /> ACTIVE
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">{u.email} • {u.clearance}</div>
                    <p className="text-xs text-slate-300 pt-1">{u.description}</p>
                  </div>

                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onSelectRole(roleKey);
                      onClose();
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold shrink-0 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    {isSelected ? 'Selected' : 'Select'}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <form onSubmit={handleSimulatedLogin} className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                DEMO IDENTITY / USERNAME
              </label>
              <input
                type="text"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                placeholder="e.g. operator-redteam, admin-secops, forensics-lead"
                className="w-full bg-[#070A11] border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                LOCAL LAB PASSWORD / TOKEN
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#070A11] border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {loginError && (
              <div className="text-xs text-rose-400 font-mono">{loginError}</div>
            )}

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-slate-800 text-xs font-mono text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-cyan-500 text-xs font-mono font-bold text-slate-950 hover:bg-cyan-400 transition-colors cursor-pointer"
              >
                Sign In to Demo Session
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
