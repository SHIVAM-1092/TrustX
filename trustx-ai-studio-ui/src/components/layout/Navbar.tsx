import React from 'react';
import {
  Shield,
  LayoutDashboard,
  FlaskConical,
  Terminal,
  Activity,
  FileText,
  Sliders,
  Flag,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  User,
  ChevronDown,
  Layers
} from 'lucide-react';
import { DemoRole, DEMO_USERS } from '../auth/DemoAuthModal';

export type NavTab =
  | 'overview'
  | 'architecture'
  | 'labs'
  | 'workspace'
  | 'gateway'
  | 'evidence'
  | 'admin'
  | 'redteam'
  | 'blueteam';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  solvedCount: number;
  totalChallenges: number;
  flagsCapturedCount: number;
  totalScore: number;
  evidenceCount: number;
  onReset: () => void;
  isTourActive: boolean;
  onToggleTour: () => void;
  currentRole: DemoRole;
  onOpenRoleModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  solvedCount,
  totalChallenges,
  flagsCapturedCount,
  totalScore,
  evidenceCount,
  onReset,
  isTourActive,
  onToggleTour,
  currentRole,
  onOpenRoleModal
}) => {
  const currentUser = DEMO_USERS[currentRole] || DEMO_USERS.redteam;

  // Normalized active tab for styling
  const activeNormalizedTab =
    currentTab === 'redteam' ? 'workspace' : currentTab === 'blueteam' ? 'evidence' : currentTab;

  const navItems = [
    { id: 'overview' as NavTab, label: 'Overview', icon: LayoutDashboard },
    { id: 'architecture' as NavTab, label: 'Architecture', icon: Layers },
    {
      id: 'labs' as NavTab,
      label: 'Security Labs',
      icon: FlaskConical,
      badge: `${totalChallenges}`
    },
    {
      id: 'workspace' as NavTab,
      label: 'Lab Workspace',
      icon: Terminal,
      badge: solvedCount > 0 ? 'SOLVED' : 'ACTIVE',
      badgeColor: solvedCount > 0 ? 'emerald' : 'cyan'
    },
    {
      id: 'gateway' as NavTab,
      label: 'Security Gateway',
      icon: ShieldCheck
    },
    {
      id: 'evidence' as NavTab,
      label: 'Evidence Center',
      icon: FileText,
      badge: `${evidenceCount}`
    },
    {
      id: 'admin' as NavTab,
      label: 'Admin Demo',
      icon: Sliders
    }
  ];

  return (
    <header className="bg-[#0B0F19] border-b border-slate-800/80 sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16 gap-3">
        {/* Brand */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => onSelectTab('overview')}
            aria-label="TrustX AI Security Gateway home"
            className="flex items-center gap-3 group text-left cursor-pointer shrink-0"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/40 group-hover:border-cyan-300 transition-colors">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white tracking-wider text-sm font-mono">
                  TRUST<span className="text-cyan-400">X</span>
                </span>
                <span className="px-1.5 py-0.2 rounded bg-cyan-950/80 text-[10px] font-mono text-cyan-400 border border-cyan-800/40">
                  GATEWAY
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono tracking-tight">
                AI Security Gateway
              </div>
            </div>
          </button>

          {/* Main Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeNormalizedTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-800/90 text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-950/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                        item.badgeColor === 'emerald'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                          : item.badgeColor === 'cyan'
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/40'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Actions: Tour Toggle, Stats, Role Pill, Reset */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Demo Tour Toggle Button */}
          <button
            onClick={onToggleTour}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              isTourActive
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/25 ring-1 ring-cyan-300'
                : 'bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-500/30'
            }`}
            title="Toggle guided presentation demo tour"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {isTourActive ? 'Demo Tour Active' : 'Guided Demo Tour'}
            </span>
          </button>

          {/* Quick Score & Flags Badge */}
          <div className="hidden xl:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-[#070A11] border border-slate-800 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <Flag className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400">FLAGS:</span>
              <span className="font-semibold text-cyan-300">
                {flagsCapturedCount}/{totalChallenges}
              </span>
            </div>
            <div className="w-px h-3.5 bg-slate-800" />
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">SCORE:</span>
              <span className="font-semibold text-emerald-400">{totalScore} PTS</span>
            </div>
          </div>

          {/* Role Persona Switcher Pill */}
          <button
            onClick={onOpenRoleModal}
            title="Switch demo operator role"
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#070A11] hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-mono transition-colors cursor-pointer"
          >
            <div
              className={`w-2 h-2 rounded-full ${
                currentUser.role === 'admin'
                  ? 'bg-emerald-400'
                  : currentUser.role === 'redteam'
                  ? 'bg-rose-400'
                  : 'bg-cyan-400'
              }`}
            />
            <span className="text-slate-200 hidden md:inline truncate max-w-[110px]">
              {currentUser.name}
            </span>
            <span
              className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                currentUser.role === 'admin'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                  : currentUser.role === 'redteam'
                  ? 'bg-rose-950 text-rose-300 border border-rose-800/40'
                  : 'bg-cyan-950 text-cyan-300 border border-cyan-800/40'
              }`}
            >
              {currentUser.role === 'admin'
                ? 'ADMIN'
                : currentUser.role === 'redteam'
                ? 'RED TEAM'
                : 'BLUE TEAM'}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {/* Reset State Button */}
          <button
            onClick={onReset}
            title="Reset demo laboratory state"
            aria-label="Reset demo laboratory state"
            className="flex items-center gap-1 px-2 py-1.5 text-xs font-mono text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-md border border-slate-800 hover:border-rose-800/40 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden lg:inline text-[11px]">Reset</span>
          </button>
        </div>
      </div>

      {/* Responsive Navigation for tablets and mobile */}
      <div className="lg:hidden flex items-center justify-start overflow-x-auto px-4 py-2 border-t border-slate-800/80 gap-1 bg-[#070A11]">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeNormalizedTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-slate-800 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
