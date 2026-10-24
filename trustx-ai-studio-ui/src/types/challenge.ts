export type ChallengeCategory = 
  | 'Prompt Injection'
  | 'Gateway & Auth'
  | 'Web & Cross-Domain'
  | 'Business Logic & Agency'
  | 'OWASP LLM Top 10';

export type ChallengeDifficulty = 'Easy' | 'Medium' | 'Hard' | 'Advanced';

export type ChallengeStatus = 'Available' | 'In Progress' | 'Completed';

export interface TaskItem {
  id: string;
  label: string;
  completed: boolean;
  description?: string;
}

export interface HintItem {
  id: number;
  cost: number;
  text: string;
}

export interface ExamplePayload {
  name: string;
  category: 'baseline' | 'adversarial' | 'evasion' | 'probe';
  prompt: string;
  description: string;
  expectedOutcome: 'normal' | 'exploit' | 'blocked';
}

export interface Challenge {
  id: string;
  slug: string;
  title: string;
  category: ChallengeCategory;
  difficulty: ChallengeDifficulty;
  points: number;
  status: ChallengeStatus;
  description: string;
  learningObjectives: string[];
  prerequisites: string[];
  attackSurface: string;
  targetEndpoint: string;
  method: 'POST' | 'GET' | 'PUT';
  flag: string; // Stored server-side/simulation-side; revealed only after evaluation
  isPrimaryInteractive: boolean;
  tasks: TaskItem[];
  hints: HintItem[];
  examplePayloads: ExamplePayload[];
  threatModel: {
    actor: string;
    motive: string;
    impact: string;
  };
  systemContext?: string;
}
