/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CHALLENGES } from './data/challengesData';
import { GatewayMode } from './types/gateway';
import { ForensicEvent } from './types/evidence';
import { StorageService } from './services/storageService';
import { DemoBanner } from './components/layout/DemoBanner';
import { Navbar, NavTab } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { OverviewView } from './components/overview/OverviewView';
import { LabsCatalogView, TeamCategory } from './components/labs/LabsCatalogView';
import { LabWorkspaceView } from './components/workspace/LabWorkspaceView';
import { RedTeamWorkspace } from './components/redteam/RedTeamWorkspace';
import { GatewayLabWorkspace } from './components/gateway/GatewayLabWorkspace';
import { SecurityGatewayView } from './components/gateway/SecurityGatewayView';
import { BlueTeamWorkspace } from './components/blueteam/BlueTeamWorkspace';
import { EvidenceCenterView } from './components/evidence/EvidenceCenterView';
import { AdminDemoView } from './components/admin/AdminDemoView';
import { LabLaunchOverlay } from './components/labs/LabLaunchOverlay';
import { DemoAuthModal, DemoRole } from './components/auth/DemoAuthModal';
import { DemoGuideBar } from './components/demo/DemoGuideBar';
import { ArchitectureView } from './components/architecture/ArchitectureView';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [activeTeamCategory, setActiveTeamCategory] = useState<TeamCategory>('all');
  const [activeChallengeId, setActiveChallengeId] = useState<string>('lab-prompt-injection');
  const [workspaceMode, setWorkspaceMode] = useState<'workbench' | 'terminal'>('workbench');
  const [gatewayViewMode, setGatewayViewMode] = useState<'interceptor' | 'rules'>('interceptor');
  const [solvedIds, setSolvedIds] = useState<string[]>([]);
  const [gatewayMode, setGatewayMode] = useState<GatewayMode>('permissive');
  const [evidenceLogs, setEvidenceLogs] = useState<ForensicEvent[]>([]);

  // Demo Presentation Tour State
  const [isTourActive, setIsTourActive] = useState(false);
  const [tourStepIndex, setTourStepIndex] = useState(0);

  // Demo Role State
  const [currentRole, setCurrentRole] = useState<DemoRole>('redteam');
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  // Lab launch overlay state
  const [launchingLab, setLaunchingLab] = useState<{
    id: string;
    category: 'red' | 'gateway' | 'blue';
    title: string;
  } | null>(null);

  // Sync hash routing
  const parseHash = useCallback(() => {
    const hash = window.location.hash.replace(/^#\/?/, '');
    if (!hash || hash === 'overview') {
      setCurrentTab('overview');
      return;
    }

    if (hash === 'architecture') {
      setCurrentTab('architecture');
    } else if (hash === 'labs' || hash === 'labs/all') {
      setCurrentTab('labs');
      setActiveTeamCategory('all');
    } else if (hash === 'labs/red') {
      setCurrentTab('labs');
      setActiveTeamCategory('red');
    } else if (hash === 'labs/gateway') {
      setCurrentTab('labs');
      setActiveTeamCategory('gateway');
    } else if (hash === 'labs/blue') {
      setCurrentTab('labs');
      setActiveTeamCategory('blue');
    } else if (hash.startsWith('labs/red/')) {
      const id = hash.replace('labs/red/', '');
      setActiveChallengeId(id);
      setCurrentTab('workspace');
    } else if (hash.startsWith('labs/gateway/')) {
      setCurrentTab('gateway');
    } else if (hash.startsWith('labs/blue/')) {
      setCurrentTab('blueteam');
    } else if (hash === 'workspace') {
      setCurrentTab('workspace');
    } else if (hash === 'redteam') {
      setCurrentTab('workspace');
    } else if (hash === 'gateway') {
      setCurrentTab('gateway');
    } else if (hash === 'evidence') {
      setCurrentTab('evidence');
    } else if (hash === 'admin') {
      setCurrentTab('admin');
    }
  }, []);

  useEffect(() => {
    parseHash();
    window.addEventListener('hashchange', parseHash);
    return () => window.removeEventListener('hashchange', parseHash);
  }, [parseHash]);

  // Load initial persistent state
  const refreshState = useCallback(() => {
    setSolvedIds(StorageService.getSolvedChallenges());
    setGatewayMode(StorageService.getGatewayMode());
    setEvidenceLogs(StorageService.getEvidenceLogs());
  }, []);

  useEffect(() => {
    refreshState();
  }, [refreshState]);

  // Derived stats
  const totalScore = useMemo(() => {
    return CHALLENGES.filter(c => solvedIds.includes(c.id)).reduce(
      (sum, c) => sum + c.points,
      0
    );
  }, [solvedIds]);

  const flagsCapturedCount = useMemo(() => {
    const flags = StorageService.getCapturedFlags();
    return Object.keys(flags).length;
  }, [solvedIds]);

  const handleSelectTab = (tab: NavTab) => {
    setCurrentTab(tab);
    if (tab === 'overview') window.location.hash = '#/overview';
    else if (tab === 'architecture') window.location.hash = '#/architecture';
    else if (tab === 'labs') window.location.hash = '#/labs';
    else if (tab === 'workspace' || tab === 'redteam')
      window.location.hash = `#/labs/red/${activeChallengeId}`;
    else if (tab === 'gateway') window.location.hash = '#/gateway';
    else if (tab === 'blueteam') window.location.hash = '#/labs/blue';
    else if (tab === 'evidence') window.location.hash = '#/evidence';
    else if (tab === 'admin') window.location.hash = '#/admin';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectTeamCategory = (cat: TeamCategory) => {
    setActiveTeamCategory(cat);
    if (cat === 'all') window.location.hash = '#/labs';
    else window.location.hash = `#/labs/${cat}`;
  };

  // Start Lab action: shows launch overlay, provisions container, and opens workspace
  const handleStartLab = (labId: string, category: 'red' | 'gateway' | 'blue', title: string) => {
    setActiveChallengeId(labId);
    setLaunchingLab({ id: labId, category, title });
  };

  const handleCompleteLaunch = () => {
    if (!launchingLab) return;
    const cat = launchingLab.category;
    const id = launchingLab.id;
    setLaunchingLab(null);

    if (cat === 'red') {
      setCurrentTab('workspace');
      window.location.hash = `#/labs/red/${id}`;
    } else if (cat === 'gateway') {
      setCurrentTab('gateway');
      window.location.hash = `#/labs/gateway/${id}`;
    } else {
      setCurrentTab('blueteam');
      window.location.hash = `#/labs/blue/${id}`;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleGatewayMode = (mode: GatewayMode) => {
    StorageService.saveGatewayMode(mode);
    setGatewayMode(mode);
  };

  const handleResetAll = () => {
    StorageService.resetAll();
    refreshState();
  };

  const handlePreloadSolved = () => {
    StorageService.preloadSolvedState();
    refreshState();
  };

  const activeChallenge =
    CHALLENGES.find(c => c.id === activeChallengeId) || CHALLENGES[0];

  return (
    <div className="min-h-screen bg-[#070A11] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Persistent Demo Disclaimer Banner */}
      <DemoBanner gatewayMode={gatewayMode} />

      {/* Main Top Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        solvedCount={solvedIds.length}
        totalChallenges={CHALLENGES.length}
        flagsCapturedCount={flagsCapturedCount}
        totalScore={totalScore}
        evidenceCount={evidenceLogs.length}
        onReset={handleResetAll}
        isTourActive={isTourActive}
        onToggleTour={() => setIsTourActive(prev => !prev)}
        currentRole={currentRole}
        onOpenRoleModal={() => setIsRoleModalOpen(true)}
      />

      {/* Presentation Guided Tour Bar */}
      {isTourActive && (
        <DemoGuideBar
          currentStepIndex={tourStepIndex}
          onSelectStep={setTourStepIndex}
          onClose={() => setIsTourActive(false)}
          onNavigateTab={tab => handleSelectTab(tab as NavTab)}
        />
      )}

      {/* Main Page Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {currentTab === 'overview' && (
          <OverviewView
            challenges={CHALLENGES}
            solvedIds={solvedIds}
            flagsCapturedCount={flagsCapturedCount}
            totalScore={totalScore}
            evidenceLogs={evidenceLogs}
            gatewayMode={gatewayMode}
            onLaunchChallenge={id =>
              handleStartLab(
                id,
                'red',
                'Prompt Injection — System Prompt Extraction'
              )
            }
            onNavigateTab={tab => handleSelectTab(tab as NavTab)}
          />
        )}

        {currentTab === 'architecture' && (
          <ArchitectureView
            gatewayMode={gatewayMode}
            onToggleGatewayMode={handleToggleGatewayMode}
            onNavigateTab={tab => handleSelectTab(tab as NavTab)}
            onLaunchChallenge={id =>
              handleStartLab(
                id,
                'red',
                'Prompt Injection — System Prompt Extraction'
              )
            }
          />
        )}

        {currentTab === 'labs' && (
          <LabsCatalogView
            challenges={CHALLENGES}
            solvedIds={solvedIds}
            activeTeamCategory={activeTeamCategory}
            onSelectTeamCategory={handleSelectTeamCategory}
            onStartLab={handleStartLab}
          />
        )}

        {(currentTab === 'workspace' || currentTab === 'redteam') && (
          <div className="space-y-4">
            {/* Workspace View Toggle: Interactive Workbench vs Linux Shell Sandbox */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-[#0B0F19] border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-400">
                  INTERFACE:
                </span>
                <div className="flex items-center gap-1 bg-[#070A11] p-1 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setWorkspaceMode('workbench')}
                    className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                      workspaceMode === 'workbench'
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    3-Panel API & Prompt Workbench
                  </button>
                  <button
                    onClick={() => setWorkspaceMode('terminal')}
                    className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                      workspaceMode === 'terminal'
                        ? 'bg-rose-500 text-slate-950 shadow-md shadow-rose-500/20'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Linux Shell & Sandbox Files
                  </button>
                </div>
              </div>

              <div className="text-xs font-mono text-slate-400">
                Active Target: <span className="text-cyan-400">{activeChallenge.targetEndpoint}</span> ({activeChallenge.method})
              </div>
            </div>

            {workspaceMode === 'workbench' ? (
              <LabWorkspaceView
                challenges={CHALLENGES}
                activeChallengeId={activeChallengeId}
                onSelectChallenge={id => setActiveChallengeId(id)}
                gatewayMode={gatewayMode}
                onEventLogged={refreshState}
                onNavigateTab={tab => handleSelectTab(tab as NavTab)}
              />
            ) : (
              <RedTeamWorkspace
                challenge={activeChallenge}
                onReturnToCatalog={() => handleSelectTab('labs')}
                onNavigateTab={tab => handleSelectTab(tab as NavTab)}
              />
            )}
          </div>
        )}

        {currentTab === 'gateway' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#0B0F19] border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-400">
                  GATEWAY PERSPECTIVE:
                </span>
                <div className="flex items-center gap-1 bg-[#070A11] p-1 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setGatewayViewMode('interceptor')}
                    className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                      gatewayViewMode === 'interceptor'
                        ? 'bg-cyan-500 text-slate-950'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Live Traffic Interceptor & Evaluator
                  </button>
                  <button
                    onClick={() => setGatewayViewMode('rules')}
                    className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                      gatewayViewMode === 'rules'
                        ? 'bg-cyan-500 text-slate-950'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Guardrails & Policy Rules Matrix
                  </button>
                </div>
              </div>

              <div className="text-xs font-mono text-slate-400">
                Mode: <span className={gatewayMode === 'strict' ? 'text-rose-400 font-bold' : 'text-amber-400 font-bold'}>{gatewayMode.toUpperCase()}</span>
              </div>
            </div>

            {gatewayViewMode === 'interceptor' ? (
              <GatewayLabWorkspace
                onReturnToCatalog={() => handleSelectTab('labs')}
                onNavigateTab={tab => handleSelectTab(tab as NavTab)}
              />
            ) : (
              <SecurityGatewayView
                gatewayMode={gatewayMode}
                onToggleGatewayMode={handleToggleGatewayMode}
              />
            )}
          </div>
        )}

        {currentTab === 'blueteam' && (
          <BlueTeamWorkspace
            onReturnToCatalog={() => handleSelectTab('labs')}
            onNavigateTab={tab => handleSelectTab(tab as NavTab)}
          />
        )}

        {currentTab === 'evidence' && (
          <EvidenceCenterView
            evidenceLogs={evidenceLogs}
            onClearLogs={handleResetAll}
          />
        )}

        {currentTab === 'admin' && (
          <AdminDemoView
            gatewayMode={gatewayMode}
            onToggleGatewayMode={handleToggleGatewayMode}
            onResetAll={handleResetAll}
            onPreloadSolved={handlePreloadSolved}
            onSeedLogs={refreshState}
          />
        )}
      </main>

      {/* Lab Launch Animation Overlay */}
      {launchingLab && (
        <LabLaunchOverlay
          labId={launchingLab.id}
          labTitle={launchingLab.title}
          category={launchingLab.category}
          onComplete={handleCompleteLaunch}
          onCancel={() => setLaunchingLab(null)}
        />
      )}

      {/* Demo Identity & Role Selector Modal */}
      <DemoAuthModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        currentRole={currentRole}
        onSelectRole={role => {
          setCurrentRole(role);
          // Tailor recommended view for persona
          if (role === 'admin') setCurrentTab('admin');
          else if (role === 'blueteam') setCurrentTab('evidence');
          else setCurrentTab('workspace');
        }}
      />

      {/* Footer with Mandatory Local Lab Disclaimer */}
      <Footer />
    </div>
  );
}
