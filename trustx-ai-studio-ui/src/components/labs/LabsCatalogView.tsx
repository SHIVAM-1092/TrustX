import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  Terminal,
  RotateCcw,
  SlidersHorizontal,
  Flame,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Play,
  Clock,
  Award,
  Layers,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Challenge } from '../../types/challenge';

export type TeamCategory = 'all' | 'red' | 'gateway' | 'blue';

interface LabsCatalogViewProps {
  challenges: Challenge[];
  solvedIds: string[];
  activeTeamCategory: TeamCategory;
  onSelectTeamCategory: (cat: TeamCategory) => void;
  onStartLab: (labId: string, category: 'red' | 'gateway' | 'blue', title: string) => void;
}

export const LabsCatalogView: React.FC<LabsCatalogViewProps> = ({
  challenges,
  solvedIds,
  activeTeamCategory,
  onSelectTeamCategory,
  onStartLab
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  const difficulties = ['All', 'Easy', 'Medium', 'Hard'];
  const statuses = ['All', 'Unsolved', 'Solved'];

  // Map each challenge to a team category
  const enrichedLabs = useMemo(() => {
    return challenges.map(c => {
      let teamCategory: 'red' | 'gateway' | 'blue' = 'red';
      let estimatedDuration = '15-20 min';
      let readyToLaunch = true;

      if (c.id === 'lab-prompt-injection' || c.id === 'lab-instruction-boundary') {
        teamCategory = 'red';
        estimatedDuration = c.id === 'lab-prompt-injection' ? '15 min' : '25 min';
        readyToLaunch = true;
      } else if (c.id === 'lab-gateway-policy' || c.id === 'lab-api-authorization-bola' || c.id === 'lab-cors-misconfiguration') {
        teamCategory = 'gateway';
        estimatedDuration = '20 min';
        readyToLaunch = true;
      } else {
        teamCategory = 'blue';
        estimatedDuration = '20 min';
        readyToLaunch = true;
      }

      return {
        ...c,
        teamCategory,
        estimatedDuration,
        readyToLaunch
      };
    });
  }, [challenges]);

  const filteredLabs = useMemo(() => {
    return enrichedLabs.filter(lab => {
      const isSolved = solvedIds.includes(lab.id);

      const matchesTeam = activeTeamCategory === 'all' || lab.teamCategory === activeTeamCategory;

      const matchesSearch =
        lab.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lab.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lab.targetEndpoint.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lab.attackSurface.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDifficulty =
        selectedDifficulty === 'All' || lab.difficulty === selectedDifficulty;

      const matchesStatus =
        selectedStatus === 'All' ||
        (selectedStatus === 'Solved' && isSolved) ||
        (selectedStatus === 'Unsolved' && !isSolved);

      return matchesTeam && matchesSearch && matchesDifficulty && matchesStatus;
    });
  }, [enrichedLabs, solvedIds, activeTeamCategory, searchTerm, selectedDifficulty, selectedStatus]);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedDifficulty('All');
    setSelectedStatus('All');
    onSelectTeamCategory('all');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-wide">
              TrustX Interactive Cyber Range & Labs
            </h1>
            <span className="px-2 py-0.5 rounded bg-cyan-950/80 text-[10px] font-mono text-cyan-400 border border-cyan-800/40 font-semibold">
              {challenges.length} LABS READY
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Hands-on training environments across Red Team penetration testing, Security Gateway policy enforcement, and Blue Team incident forensics.
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-[#0B0F19] border border-slate-800 text-slate-300">
            SOLVED: <span className="text-emerald-400 font-bold">{solvedIds.length}</span> / {challenges.length}
          </div>
        </div>
      </div>

      {/* Primary Category Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => onSelectTeamCategory('all')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
            activeTeamCategory === 'all'
              ? 'bg-slate-800 text-white border border-slate-700 shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>All Labs ({enrichedLabs.length})</span>
        </button>

        <button
          onClick={() => onSelectTeamCategory('red')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
            activeTeamCategory === 'red'
              ? 'bg-rose-950/80 text-rose-300 border border-rose-500/50 shadow-md shadow-rose-950/40'
              : 'text-slate-400 hover:text-rose-400 hover:bg-slate-900'
          }`}
        >
          <Terminal className="w-4 h-4 text-rose-400" />
          <span>Red Team Labs ({enrichedLabs.filter(l => l.teamCategory === 'red').length})</span>
        </button>

        <button
          onClick={() => onSelectTeamCategory('gateway')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
            activeTeamCategory === 'gateway'
              ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/50 shadow-md shadow-cyan-950/40'
              : 'text-slate-400 hover:text-cyan-400 hover:bg-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>Gateway & Policy Labs ({enrichedLabs.filter(l => l.teamCategory === 'gateway').length})</span>
        </button>

        <button
          onClick={() => onSelectTeamCategory('blue')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
            activeTeamCategory === 'blue'
              ? 'bg-blue-950/80 text-blue-300 border border-blue-500/50 shadow-md shadow-blue-950/40'
              : 'text-slate-400 hover:text-blue-400 hover:bg-slate-900'
          }`}
        >
          <Shield className="w-4 h-4 text-blue-400" />
          <span>Blue Team Labs ({enrichedLabs.filter(l => l.teamCategory === 'blue').length})</span>
        </button>
      </div>

      {/* Search and Secondary Filters Bar */}
      <div className="rounded-xl bg-[#0B0F19] border border-slate-800 p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by challenge title, endpoint, surface, or keyword..."
              aria-label="Search labs"
              className="w-full bg-[#070A11] border border-slate-700/80 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div className="flex items-center gap-3 overflow-x-auto text-xs font-mono">
            {/* Difficulty */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px]">DIFFICULTY:</span>
              {difficulties.map(diff => (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors cursor-pointer ${
                    selectedDifficulty === diff
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>

            {/* Status */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px]">STATUS:</span>
              {statuses.map(st => (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors cursor-pointer ${
                    selectedStatus === st
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Labs Cards Grid */}
      {filteredLabs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredLabs.map(lab => {
            const isSolved = solvedIds.includes(lab.id);

            return (
              <div
                key={lab.id}
                className={`rounded-xl bg-[#0B0F19] border transition-all flex flex-col justify-between p-5 ${
                  isSolved
                    ? 'border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                    : lab.teamCategory === 'red'
                    ? 'border-rose-900/40 hover:border-rose-500/50'
                    : lab.teamCategory === 'gateway'
                    ? 'border-cyan-900/40 hover:border-cyan-500/50'
                    : 'border-blue-900/40 hover:border-blue-500/50'
                }`}
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                          lab.teamCategory === 'red'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800/40'
                            : lab.teamCategory === 'gateway'
                            ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/40'
                            : 'bg-blue-950 text-blue-400 border border-blue-800/40'
                        }`}
                      >
                        {lab.teamCategory.toUpperCase()} TEAM
                      </span>

                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase ${
                          lab.difficulty === 'Easy'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                            : lab.difficulty === 'Medium'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800/40'
                            : 'bg-rose-950 text-rose-400 border border-rose-800/40'
                        }`}
                      >
                        {lab.difficulty}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-400 font-bold">
                      <Award className="w-3.5 h-3.5" />
                      <span>{lab.points} PTS</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-white tracking-wide">
                    {lab.title}
                  </h3>

                  {/* Objective & Description */}
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {lab.description}
                  </p>

                  {/* Target and Duration */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5 text-[11px] font-mono">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>DURATION:</span>
                      <span className="text-slate-300 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        <span>{lab.estimatedDuration}</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>ENVIRONMENT:</span>
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Ready to Launch</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  {isSolved ? (
                    <span className="flex items-center gap-1 text-xs font-mono font-bold text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>SOLVED</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-mono text-slate-400">
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      <span>READY</span>
                    </span>
                  )}

                  <button
                    onClick={() => onStartLab(lab.id, lab.teamCategory, lab.title)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                      lab.teamCategory === 'red'
                        ? 'bg-rose-500 hover:bg-rose-400 text-slate-950 shadow-md shadow-rose-500/20'
                        : lab.teamCategory === 'gateway'
                        ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20'
                        : 'bg-blue-500 hover:bg-blue-400 text-white shadow-md shadow-blue-500/20'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start Lab</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl bg-[#0B0F19] border border-slate-800 p-12 text-center space-y-3">
          <SlidersHorizontal className="w-8 h-8 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">No challenges match your filter</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search terms or category filter.
          </p>
          <button
            onClick={resetFilters}
            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 hover:bg-cyan-900/60 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        </div>
      )}
    </div>
  );
};
