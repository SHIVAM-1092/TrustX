import React, { useState } from 'react';
import {
  FileText,
  CheckSquare,
  HelpCircle,
  Shield,
  Lightbulb,
  CheckCircle2,
  Lock,
  ChevronDown,
  ChevronUp,
  Target
} from 'lucide-react';
import { Challenge, TaskItem, HintItem } from '../../types/challenge';

interface MissionBriefPanelProps {
  challenge: Challenge;
  tasksCompleted: Record<string, boolean>;
  onToggleTask?: (taskId: string) => void;
}

export const MissionBriefPanel: React.FC<MissionBriefPanelProps> = ({
  challenge,
  tasksCompleted
}) => {
  const [activeTab, setActiveTab] = useState<'brief' | 'tasks' | 'tactics' | 'hints'>('brief');
  const [unlockedHints, setUnlockedHints] = useState<number[]>([1]); // Hint 1 unlocked by default

  const toggleHint = (hintId: number) => {
    if (unlockedHints.includes(hintId)) {
      setUnlockedHints(unlockedHints.filter(h => h !== hintId));
    } else {
      setUnlockedHints([...unlockedHints, hintId]);
    }
  };

  const completedCount = challenge.tasks.filter(t => tasksCompleted[t.id]).length;

  return (
    <div className="h-full flex flex-col bg-[#0B0F19] rounded-xl border border-slate-800 overflow-hidden">
      {/* Panel Navigation Tabs */}
      <div className="flex items-center border-b border-slate-800 bg-[#070A11] px-2 py-1.5 overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab('brief')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer ${
            activeTab === 'brief'
              ? 'bg-slate-800 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Brief</span>
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer ${
            activeTab === 'tasks'
              ? 'bg-slate-800 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>Tasks ({completedCount}/{challenge.tasks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tactics')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer ${
            activeTab === 'tactics'
              ? 'bg-slate-800 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>Tactics</span>
        </button>

        <button
          onClick={() => setActiveTab('hints')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer ${
            activeTab === 'hints'
              ? 'bg-slate-800 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          <span>Hints</span>
        </button>
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs font-sans">
        {/* BRIEF TAB */}
        {activeTab === 'brief' && (
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                MISSION OVERVIEW
              </span>
              <h3 className="text-sm font-bold text-white mt-1">
                {challenge.title}
              </h3>
              <p className="text-slate-300 mt-2 leading-relaxed">
                {challenge.description}
              </p>
            </div>

            {/* Target Profile */}
            <div className="p-3 rounded-lg bg-[#070A11] border border-slate-800 space-y-2">
              <span className="text-[11px] font-mono font-semibold text-slate-300 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                <span>Synthetic Target Specification</span>
              </span>
              <div className="text-[11px] font-mono space-y-1 text-slate-400">
                <div className="flex justify-between">
                  <span>Endpoint:</span>
                  <span className="text-slate-200">{challenge.method} {challenge.targetEndpoint}</span>
                </div>
                <div className="flex justify-between">
                  <span>Agent Name:</span>
                  <span className="text-slate-200">ApexFin Support Bot (v3)</span>
                </div>
                <div className="flex justify-between">
                  <span>Vulnerability:</span>
                  <span className="text-cyan-400">Weak Delimiter Precedence</span>
                </div>
                <div className="flex justify-between">
                  <span>Verification:</span>
                  <span className="text-emerald-400">TRUSTX{'{...}'} Flag Capture</span>
                </div>
              </div>
            </div>

            {/* Threat Model */}
            <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 space-y-2">
              <span className="text-[11px] font-mono font-semibold text-slate-300">
                Threat Model Summary
              </span>
              <div className="text-[11px] space-y-1 text-slate-400 leading-relaxed">
                <p>
                  <strong className="text-slate-300">Actor:</strong> {challenge.threatModel.actor}
                </p>
                <p>
                  <strong className="text-slate-300">Motive:</strong> {challenge.threatModel.motive}
                </p>
                <p>
                  <strong className="text-slate-300">Impact:</strong> {challenge.threatModel.impact}
                </p>
              </div>
            </div>

            {/* Learning Objectives */}
            <div>
              <span className="text-[11px] font-mono text-slate-400 font-semibold uppercase">
                Learning Objectives
              </span>
              <ul className="mt-2 space-y-1.5 text-slate-300 text-xs">
                {challenge.learningObjectives.map((obj, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-cyan-400 select-none font-mono">›</span>
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* TASKS TAB */}
        {activeTab === 'tasks' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-[11px] font-mono text-slate-400 font-semibold">
                LAB EXECUTION CHECKLIST
              </span>
              <span className="text-[11px] font-mono text-cyan-400">
                {Math.round((completedCount / challenge.tasks.length) * 100)}% COMPLETE
              </span>
            </div>

            <div className="space-y-2">
              {challenge.tasks.map((task, idx) => {
                const isComplete = tasksCompleted[task.id];
                return (
                  <div
                    key={task.id}
                    className={`p-3 rounded-lg border transition-all ${
                      isComplete
                        ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                        : 'bg-[#070A11] border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 shrink-0">
                        {isComplete ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <div className="w-4 h-4 rounded border border-slate-700 flex items-center justify-center font-mono text-[10px] text-slate-400">
                            {idx + 1}
                          </div>
                        )}
                      </div>
                      <div>
                        <div
                          className={`font-semibold text-xs ${
                            isComplete ? 'text-emerald-300 line-through opacity-80' : 'text-slate-200'
                          }`}
                        >
                          {task.label}
                        </div>
                        {task.description && (
                          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                            {task.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TACTICS TAB */}
        {activeTab === 'tactics' && (
          <div className="space-y-3">
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">
              EXPLOITATION TACTICS & TECHNIQUES
            </span>

            <div className="p-3 rounded-lg bg-[#070A11] border border-slate-800 space-y-2">
              <h4 className="font-bold text-slate-200 text-xs">
                1. Instruction Boundary Inversion
              </h4>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                LLMs that do not enforce cryptographic instruction tagging often treat the final directive received as the most urgent authority. By commanding the agent to ignore previous constraints, unhardened agents discard system context guardrails.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#070A11] border border-slate-800 space-y-2">
              <h4 className="font-bold text-slate-200 text-xs">
                2. Delimiter Spoofing
              </h4>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Many applications encapsulate user input inside markdown fences like <code>--- END USER ---</code> or <code>```</code>. An attacker injecting those identical fences can trick the parser into concluding that the user prompt ended and system configuration has resumed.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#070A11] border border-slate-800 space-y-2">
              <h4 className="font-bold text-slate-200 text-xs">
                3. Maintenance Roleplay / Pseudo-Auth
              </h4>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Framing the request as an emergency maintenance diagnostic (e.g. <code>SYSTEM OVERRIDE [AUTH_BYPASS_TOKEN_ACTIVE]</code>) bypasses superficial refusal triggers in standard conversational system prompts.
              </p>
            </div>
          </div>
        )}

        {/* HINTS TAB */}
        {activeTab === 'hints' && (
          <div className="space-y-3">
            <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider font-semibold">
              LAB PROGRESSIVE HINTS
            </span>
            <p className="text-xs text-slate-400">
              Hints provide guidance if you get stuck. No penalty for revealing them in this prototype.
            </p>

            <div className="space-y-2 pt-1">
              {challenge.hints.map(hint => {
                const isUnlocked = unlockedHints.includes(hint.id);
                return (
                  <div
                    key={hint.id}
                    className="rounded-lg bg-[#070A11] border border-slate-800 overflow-hidden"
                  >
                    <button
                      onClick={() => toggleHint(hint.id)}
                      className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-900/60 transition-colors cursor-pointer"
                    >
                      <span className="font-mono text-xs font-semibold text-slate-300 flex items-center gap-2">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                        <span>Hint #{hint.id}</span>
                      </span>
                      {isUnlocked ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </button>

                    {isUnlocked && (
                      <div className="p-3 pt-0 text-slate-300 text-xs font-sans leading-relaxed border-t border-slate-800/60 bg-slate-950/40">
                        {hint.text}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
