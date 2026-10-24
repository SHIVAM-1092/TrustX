import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Award,
  RotateCcw,
  Flag,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  ShieldAlert,
  Sliders,
  Sparkles,
  Info
} from 'lucide-react';
import { Challenge } from '../../types/challenge';
import { GatewayMode } from '../../types/gateway';
import { runSimulation, SimulationResult } from '../../services/simulationEngine';
import { StorageService } from '../../services/storageService';
import { MissionBriefPanel } from './MissionBriefPanel';
import { RequestWorkbenchPanel, HistoryItem } from './RequestWorkbenchPanel';
import { SecurityGatewayPanel } from './SecurityGatewayPanel';
import { FlagUnlockModal } from './FlagUnlockModal';

interface LabWorkspaceViewProps {
  challenges: Challenge[];
  activeChallengeId: string;
  onSelectChallenge: (id: string) => void;
  gatewayMode: GatewayMode;
  onEventLogged: () => void;
  onNavigateTab: (tab: 'evidence' | 'gateway' | 'admin' | 'overview') => void;
}

export const LabWorkspaceView: React.FC<LabWorkspaceViewProps> = ({
  challenges,
  activeChallengeId,
  onSelectChallenge,
  gatewayMode,
  onEventLogged,
  onNavigateTab
}) => {
  const currentChallenge =
    challenges.find(c => c.id === activeChallengeId) || challenges[0];

  const [prompt, setPrompt] = useState<string>(
    currentChallenge.examplePayloads[0]?.prompt || ''
  );
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeStage, setActiveStage] = useState(0);
  const [latestResult, setLatestResult] = useState<SimulationResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [tasksCompleted, setTasksCompleted] = useState<Record<string, boolean>>({});
  const [isSolved, setIsSolved] = useState(false);
  const [capturedFlag, setCapturedFlag] = useState<string | undefined>(undefined);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);

  // Sync state when challenge changes
  useEffect(() => {
    const solvedList = StorageService.getSolvedChallenges();
    const solved = solvedList.includes(currentChallenge.id);
    setIsSolved(solved);

    const savedTasks = StorageService.getCompletedTasks();
    setTasksCompleted(savedTasks);

    const savedFlags = StorageService.getCapturedFlags();
    if (savedFlags[currentChallenge.id]) {
      setCapturedFlag(savedFlags[currentChallenge.id]);
    } else {
      setCapturedFlag(undefined);
    }

    // Default to first example payload
    if (currentChallenge.examplePayloads[0]) {
      setPrompt(currentChallenge.examplePayloads[0].prompt);
    } else {
      setPrompt('');
    }
    setLatestResult(null);
  }, [currentChallenge.id]);

  // Execute prompt against simulation engine with animated pipeline stages
  const handleExecute = () => {
    if (!prompt.trim() || isExecuting) return;

    setIsExecuting(true);
    setActiveStage(0);

    // Staged animation: Red Team (0) -> Gateway (1) -> Target (2) -> Evaluator (3) -> Evidence (4)
    setTimeout(() => setActiveStage(1), 200);
    setTimeout(() => setActiveStage(2), 400);
    setTimeout(() => setActiveStage(3), 650);

    setTimeout(() => {
      const result = runSimulation(currentChallenge, prompt, gatewayMode);
      setLatestResult(result);
      setActiveStage(4);
      setIsExecuting(false);

      // Record to history
      const historyItem: HistoryItem = {
        id: `hist-${Date.now()}`,
        timestamp: new Date().toISOString(),
        prompt,
        result
      };
      setHistory(prev => [historyItem, ...prev]);

      // Record forensic evidence
      StorageService.addEvidenceLog(result.forensicEvent);

      // Update tasks
      result.tasksCompletedUpdate.forEach(u => {
        StorageService.saveTaskCompleted(u.taskId, u.completed);
      });
      setTasksCompleted(StorageService.getCompletedTasks());

      // Evaluate challenge completion
      if (result.flagCaptured && result.capturedFlag) {
        setCapturedFlag(result.capturedFlag);
        StorageService.saveCapturedFlag(currentChallenge.id, result.capturedFlag);
        StorageService.saveSolvedChallenge(currentChallenge.id);
        setIsSolved(true);
        setShowCelebrationModal(true);
      }

      // Notify parent to refresh state (solved IDs, flags, evidence)
      onEventLogged();
    }, 900);
  };

  const handleSelectHistoryItem = (item: HistoryItem) => {
    setPrompt(item.prompt);
    setLatestResult(item.result);
  };

  const handleManualFlagSubmit = (flagInput: string): boolean => {
    if (flagInput.trim() === currentChallenge.flag) {
      setCapturedFlag(currentChallenge.flag);
      StorageService.saveCapturedFlag(currentChallenge.id, currentChallenge.flag);
      StorageService.saveSolvedChallenge(currentChallenge.id);
      setIsSolved(true);
      setShowCelebrationModal(true);
      onEventLogged();
      return true;
    }
    return false;
  };

  const handleResetChallenge = () => {
    if (currentChallenge.examplePayloads[0]) {
      setPrompt(currentChallenge.examplePayloads[0].prompt);
    }
    setLatestResult(null);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Workspace Top Bar */}
      <div className="rounded-xl bg-[#0B0F19] border border-slate-800 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Challenge Selector */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800/40 shrink-0">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase">
                ACTIVE LAB MISSION
              </span>
              {!currentChallenge.isPrimaryInteractive && (
                <span className="px-1.5 py-0.2 rounded bg-amber-950 text-amber-400 text-[10px] font-mono border border-amber-800/40">
                  SCENARIO PREVIEW
                </span>
              )}
            </div>

            {/* Dropdown to switch challenges */}
            <div className="relative mt-0.5">
              <select
                value={currentChallenge.id}
                onChange={e => onSelectChallenge(e.target.value)}
                aria-label="Select challenge"
                className="bg-[#070A11] border border-slate-700/80 rounded-md text-white font-bold text-sm py-1 pl-2.5 pr-8 focus:outline-none focus:border-cyan-500 font-sans cursor-pointer"
              >
                {challenges.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.difficulty} • {c.points} PTS)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right Status Indicators & Quick Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Difficulty & Points */}
          <div className="flex items-center gap-2 font-mono text-xs">
            <span
              className={`px-2 py-1 rounded font-bold uppercase text-[10px] ${
                currentChallenge.difficulty === 'Easy'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                  : currentChallenge.difficulty === 'Medium'
                  ? 'bg-amber-950 text-amber-400 border border-amber-800/40'
                  : 'bg-rose-950 text-rose-400 border border-rose-800/40'
              }`}
            >
              {currentChallenge.difficulty}
            </span>

            <span className="px-2 py-1 rounded bg-slate-900 text-cyan-400 font-bold border border-slate-800 text-[10px]">
              {currentChallenge.points} PTS
            </span>

            {isSolved ? (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-950 text-emerald-400 font-bold border border-emerald-800/40 text-[10px]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>SOLVED</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded bg-slate-900 text-slate-400 border border-slate-800 text-[10px]">
                UNSOLVED
              </span>
            )}
          </div>

          {/* Reset challenge inputs */}
          <button
            onClick={handleResetChallenge}
            title="Reset workbench inputs"
            aria-label="Reset workbench inputs"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-slate-400 hover:text-white bg-slate-900 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Prompt</span>
          </button>
        </div>
      </div>

      {/* Primary Interactive Flag Notice Banner if already solved */}
      {isSolved && (
        <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Challenge Solved!</strong> Flag unlocked: <code>{capturedFlag || currentChallenge.flag}</code>
            </span>
          </div>
          <button
            onClick={() => setShowCelebrationModal(true)}
            className="text-cyan-400 hover:text-cyan-300 underline font-semibold cursor-pointer"
          >
            Show Celebration Details
          </button>
        </div>
      )}

      {/* Three-Panel Interactive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[640px]">
        {/* Left Panel: Mission Brief & Tasks (3 columns on lg) */}
        <div className="lg:col-span-3 min-h-[500px]">
          <MissionBriefPanel
            challenge={currentChallenge}
            tasksCompleted={tasksCompleted}
          />
        </div>

        {/* Center Panel: Request Workbench (5 columns on lg) */}
        <div className="lg:col-span-5 min-h-[500px]">
          <RequestWorkbenchPanel
            challenge={currentChallenge}
            prompt={prompt}
            onChangePrompt={setPrompt}
            onSubmit={handleExecute}
            isExecuting={isExecuting}
            latestResult={latestResult}
            history={history}
            onSelectHistoryItem={handleSelectHistoryItem}
            onClear={() => setPrompt('')}
          />
        </div>

        {/* Right Panel: Security Gateway & Flag Verification (4 columns on lg) */}
        <div className="lg:col-span-4 min-h-[500px]">
          <SecurityGatewayPanel
            challenge={currentChallenge}
            latestResult={latestResult}
            isExecuting={isExecuting}
            activeStage={activeStage}
            isSolved={isSolved}
            capturedFlag={capturedFlag}
            onSubmitFlag={handleManualFlagSubmit}
            onOpenEvidence={() => onNavigateTab('evidence')}
          />
        </div>
      </div>

      {/* Flag Unlock Celebration Modal */}
      <FlagUnlockModal
        isOpen={showCelebrationModal}
        onClose={() => setShowCelebrationModal(false)}
        flag={capturedFlag || currentChallenge.flag}
        points={currentChallenge.points}
        challengeTitle={currentChallenge.title}
        onViewEvidence={() => onNavigateTab('evidence')}
      />
    </div>
  );
};
