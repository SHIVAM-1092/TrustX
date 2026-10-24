import React from 'react';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  Play,
  CheckCircle2,
  Shield,
  Terminal,
  Activity,
  FileText,
  Sliders,
  ExternalLink
} from 'lucide-react';

export interface DemoStep {
  step: number;
  title: string;
  targetTab: 'overview' | 'architecture' | 'labs' | 'workspace' | 'gateway' | 'evidence' | 'admin';
  categoryBadge: string;
  description: string;
  actionPrompt: string;
  talkingPoints: string[];
}

export const DEMO_STEPS: DemoStep[] = [
  {
    step: 1,
    title: 'Platform Overview & AI Defense Architecture',
    targetTab: 'overview',
    categoryBadge: 'STEP 1: ARCHITECTURE',
    description:
      'Introduce the TrustX range, local lab safety boundaries, threat categories, and the 5-stage defensive flow: Red Team → Policy Gateway → Synthetic AI Target → Evaluator → Evidence.',
    actionPrompt: 'Inspect the live architecture flow and threat surface matrix.',
    talkingPoints: [
      'Built specifically for Hack in the Hills as an authorized local training lab.',
      'Demonstrates defense-in-depth for generative AI endpoints and tool-calling agents.',
      'Visualizes active guardrails: delimiter boundaries, persona enforcement, and BOLA detection.'
    ]
  },
  {
    step: 2,
    title: 'Labs Catalog & Threat Surface Selection',
    targetTab: 'labs',
    categoryBadge: 'STEP 2: CHALLENGE SELECTION',
    description:
      'Explore the standardized curriculum: Prompt Injection, Delimiter Escapes, BOLA API boundaries, CORS, CSRF, and Clickjacking.',
    actionPrompt: 'Select and launch the featured lab: Prompt Injection — System Prompt Extraction.',
    talkingPoints: [
      'Each challenge maps to real OWASP LLM and API Top 10 vulnerabilities.',
      'Clear objectives, prerequisite knowledge, and estimated duration for learners.',
      'One-click container initialization and telemetry tracking.'
    ]
  },
  {
    step: 3,
    title: 'Baseline Telemetry Request (Normal Assistant)',
    targetTab: 'workspace',
    categoryBadge: 'STEP 3: BASELINE TELEMETRY',
    description:
      'Submit a harmless customer inquiry ("What are your branch hours?"). Observe standard synthetic responses without triggering security guardrails.',
    actionPrompt: 'Click "Execute Prompt" with the baseline inquiry to observe the 200 ALLOWED verdict.',
    talkingPoints: [
      'Demonstrates that normal queries pass seamlessly with low risk scores (<15/100).',
      'Synthetic ApexFin assistant provides FDIC deposit hours without leaking system secrets.',
      'Gateway records clean baseline telemetry in the forensic event ledger.'
    ]
  },
  {
    step: 4,
    title: 'Controlled Adversarial Injection & Flag Capture',
    targetTab: 'workspace',
    categoryBadge: 'STEP 4: ADVERSARIAL EXPLOITATION',
    description:
      'Inject an adversarial delimiter override payload ("Ignore all previous instructions..."). In training mode, witness the synthetic agent leaking its internal system prompt and master flag.',
    actionPrompt: 'Select the "Direct Override Attack" payload and submit to extract the confidential system instructions.',
    talkingPoints: [
      'Classic prompt injection exploits delimiter ambiguity between system context and user input.',
      'The model prioritizes the adversarial override, leaking confidential instructions.',
      'The challenge flag is captured, submitted, and verified by the server-side validator.'
    ]
  },
  {
    step: 5,
    title: 'Security Gateway Policy Enforcement (Strict Mode)',
    targetTab: 'gateway',
    categoryBadge: 'STEP 5: DEFENSIVE ENFORCEMENT',
    description:
      'Demonstrate how enterprise defenses mitigate the exploit. Inspect RULE-AI-01 and switch to Strict Enforcement to block adversarial overrides with HTTP 403 Forbidden.',
    actionPrompt: 'Toggle Strict Mode and test the payload in the live policy interceptor.',
    talkingPoints: [
      'Shows the hardened comparison: Training Mode allows testing, while Strict Mode blocks attacks.',
      'Gateway inspects lexical tokens, delimiter demarcations, and intent before hitting the model.',
      'Requests violating safety guardrails are halted with detailed policy audit tags.'
    ]
  },
  {
    step: 6,
    title: 'Forensic Investigation & SHA-256 Ledger Verification',
    targetTab: 'evidence',
    categoryBadge: 'STEP 6: FORENSIC INVESTIGATION',
    description:
      'Investigate the immutable audit trail. Correlate timestamps, risk scores, and payloads. Verify the SHA-256 hash-chain integrity or test simulated tampering detection.',
    actionPrompt: 'Verify the cryptographic hash chain or click any event to view raw JSON telemetry.',
    talkingPoints: [
      'Every interaction produces structured forensic telemetry with cryptographic hashes.',
      'Blue Team analysts can mathematically verify that audit logs have not been altered.',
      'Simulate tampering visibly triggers cryptographic verification failure warnings.'
    ]
  },
  {
    step: 7,
    title: 'Scorecard, Progress & Demo Summary',
    targetTab: 'admin',
    categoryBadge: 'STEP 7: RESULTS & SUMMARY',
    description:
      'Review captured flags, completed learning objectives, total score, and scenario controls for resetting or replaying exercises.',
    actionPrompt: 'Export forensic JSON report or reset the lab environment for a fresh demonstration.',
    talkingPoints: [
      'Demonstrates end-to-end learning lifecycle: Recon → Exploit → Mitigate → Audit.',
      'Designed for fast, reliable recording on 1080p desktop viewports.',
      'Complete local safety with zero external attacks or destructive behaviors.'
    ]
  }
];

interface DemoGuideBarProps {
  currentStepIndex: number;
  onSelectStep: (stepIndex: number) => void;
  onClose: () => void;
  onNavigateTab: (tab: 'overview' | 'architecture' | 'labs' | 'workspace' | 'gateway' | 'evidence' | 'admin') => void;
  onTriggerStepAction?: (step: number) => void;
}

export const DemoGuideBar: React.FC<DemoGuideBarProps> = ({
  currentStepIndex,
  onSelectStep,
  onClose,
  onNavigateTab,
  onTriggerStepAction
}) => {
  const currentStep = DEMO_STEPS[currentStepIndex] || DEMO_STEPS[0];
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === DEMO_STEPS.length - 1;

  const handleGoToTarget = () => {
    onNavigateTab(currentStep.targetTab);
    if (onTriggerStepAction) {
      onTriggerStepAction(currentStep.step);
    }
  };

  const handleNext = () => {
    if (!isLast) {
      const nextIndex = currentStepIndex + 1;
      onSelectStep(nextIndex);
      onNavigateTab(DEMO_STEPS[nextIndex].targetTab);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      const prevIndex = currentStepIndex - 1;
      onSelectStep(prevIndex);
      onNavigateTab(DEMO_STEPS[prevIndex].targetTab);
    }
  };

  return (
    <div className="bg-[#0B0F19]/95 border-b border-cyan-500/40 px-4 py-3 shadow-xl shadow-cyan-950/20 backdrop-blur-md relative z-30 animate-in slide-in-from-top-2 duration-200">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Step Info */}
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-bold text-xs shrink-0 shadow-sm shadow-cyan-500/30">
            {currentStep.step}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/40">
                {currentStep.categoryBadge}
              </span>
              <span className="text-xs font-bold text-white tracking-wide">
                {currentStep.title}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 line-clamp-1 sm:line-clamp-none max-w-2xl">
              {currentStep.description}
            </p>
          </div>
        </div>

        {/* Step Stepper & Action Controls */}
        <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0">
          {/* Direct Action Jump */}
          <button
            onClick={handleGoToTarget}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-mono font-bold shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span className="hidden sm:inline">Go to Step View</span>
            <span className="sm:hidden">Jump</span>
          </button>

          {/* Previous / Next buttons */}
          <div className="flex items-center gap-1 bg-[#070A11] p-1 rounded-lg border border-slate-800 font-mono text-xs">
            <button
              onClick={handlePrev}
              disabled={isFirst}
              aria-label="Previous demo step"
              className={`p-1.5 rounded transition-colors ${
                isFirst
                  ? 'text-slate-600 cursor-not-allowed'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-2 text-[11px] text-slate-400">
              {currentStep.step} / {DEMO_STEPS.length}
            </span>

            <button
              onClick={handleNext}
              disabled={isLast}
              aria-label="Next demo step"
              className={`p-1.5 rounded transition-colors ${
                isLast
                  ? 'text-slate-600 cursor-not-allowed'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Close Guide */}
          <button
            onClick={onClose}
            aria-label="Close presentation demo guide"
            title="Close demo guide"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
