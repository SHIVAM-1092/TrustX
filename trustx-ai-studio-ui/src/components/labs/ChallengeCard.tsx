import React from 'react';
import {
  Terminal,
  Shield,
  CheckCircle,
  ArrowRight,
  Flame,
  Award,
  Lock,
  Sparkles
} from 'lucide-react';
import { Challenge } from '../../types/challenge';

interface ChallengeCardProps {
  challenge: Challenge;
  isSolved: boolean;
  onLaunch: (id: string) => void;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challenge,
  isSolved,
  onLaunch
}) => {
  return (
    <div
      className={`rounded-xl bg-[#0B0F19] border transition-all flex flex-col justify-between ${
        isSolved
          ? 'border-emerald-500/40 shadow-lg shadow-emerald-950/20'
          : challenge.isPrimaryInteractive
          ? 'border-cyan-500/50 shadow-xl shadow-cyan-950/30 ring-1 ring-cyan-500/40'
          : 'border-slate-800/80 hover:border-slate-700'
      } p-5`}
    >
      <div>
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                challenge.difficulty === 'Easy'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                  : challenge.difficulty === 'Medium'
                  ? 'bg-amber-950 text-amber-400 border border-amber-800/40'
                  : 'bg-rose-950 text-rose-400 border border-rose-800/40'
              }`}
            >
              {challenge.difficulty}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {challenge.category}
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="flex items-center gap-1 text-cyan-400 font-bold">
              <Award className="w-3.5 h-3.5" />
              <span>{challenge.points} PTS</span>
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="flex items-start gap-2.5">
          {challenge.isPrimaryInteractive ? (
            <div className="p-2 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800/40 shrink-0 mt-0.5">
              <Terminal className="w-4 h-4" />
            </div>
          ) : (
            <div className="p-2 rounded-lg bg-slate-900 text-slate-400 border border-slate-800 shrink-0 mt-0.5">
              <Shield className="w-4 h-4" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-wide">
                {challenge.title}
              </h3>
            </div>
            {challenge.isPrimaryInteractive && (
              <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-mono text-cyan-400 font-semibold bg-cyan-950/60 px-1.5 py-0.2 rounded border border-cyan-800/40">
                <Sparkles className="w-3 h-3" /> FULL INTERACTIVE LAB
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-400 mt-3 leading-relaxed">
          {challenge.description}
        </p>

        {/* Attack surface and endpoint */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5 text-[11px] font-mono">
          <div className="flex items-center justify-between text-slate-400">
            <span>TARGET:</span>
            <span className="text-slate-300 truncate max-w-[200px]">
              {challenge.method} {challenge.targetEndpoint}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>SURFACE:</span>
            <span className="text-slate-400 truncate max-w-[200px]">
              {challenge.attackSurface}
            </span>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
        {isSolved ? (
          <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400">
            <CheckCircle className="w-4 h-4" />
            <span>SOLVED</span>
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>READY</span>
          </span>
        )}

        <button
          onClick={() => onLaunch(challenge.id)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
            challenge.isPrimaryInteractive
              ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-sm shadow-cyan-500/25'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
          }`}
        >
          <span>{challenge.isPrimaryInteractive ? 'Launch Workspace' : 'Test Scenario'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
