// Shared shapes for the CEO agent and every department agent (agents/<role>/agent.ts).
// Type-only file: safe to import from the Worker, the department folders and the Node tests.

/** Anything that leaves the building. A department may only ASK for these; Chris says yes or no. */
export type OutwardKind = "send" | "deploy" | "sign" | "spend";

export type DepartmentId =
  | "sales"
  | "copy"
  | "engineering"
  | "qa"
  | "devops"
  | "finance";

/** Something a department wants done outside: a reply to a client, an invoice, a deploy. */
export interface ProposedAction {
  kind: OutwardKind;
  /** One line for the "Needs you" list, e.g. "Send the quote to Jo at Acme". */
  summary: string;
  /** The full text Chris will check: the e-mail body, the invoice, the deploy plan. */
  detail: string;
}

/** What every department hands back. Extra fields depend on the department. */
export interface DepartmentResult {
  /** One or two plain sentences for the dashboard. */
  summary: string;
  /** Outward actions it asks Chris for. Empty when there are none. */
  actions: ProposedAction[];
  /** Empty when all is well. Otherwise why the step can't go on (e.g. QA failed). */
  blocker: string;
  [field: string]: unknown;
}

/** What a department is given for one step. */
export interface Brief {
  jobTitle: string;
  pipeline: string;
  stepName: string;
  /** 1 on the first try, 2 after a retry, and so on. */
  attempt: number;
  /** What came in: the client's ticket and anything Chris added. */
  input: { client: string; text: string };
  /** What earlier steps produced, oldest first (latest attempt of each). */
  earlier: { department: DepartmentId; stepName: string; result: DepartmentResult }[];
  /** Business settings kept out of the public repo (.dev.vars). */
  settings: { fixItPrice: string };
}

/** A department agent. One folder each under agents/<role>/. */
export interface Department {
  id: DepartmentId;
  name: string;
  emoji: string;
  /** The system prompt: who it is, what it does, what it must never do. */
  instructions: string;
  /** How hard Claude thinks on this department's steps. */
  effort: "low" | "medium" | "high";
  /**
   * Tools it is allowed to use. Phase 1 wires none: each step is one structured
   * Claude call over the job board. Listed so permissions are written down from day one.
   */
  tools: string[];
  /** The only outward kinds it may ask Chris for. Asking for any other kind fails the step. */
  mayPropose: OutwardKind[];
  /** JSON Schema for its result (structured outputs). Must include summary, actions, blocker. */
  outputSchema: Record<string, unknown>;
  /** A stand-in answer for running with no API key, so the prototype works offline. */
  offline(brief: Brief): DepartmentResult;
}

export interface PipelineStep {
  department: DepartmentId;
  name: string;
  /** When this step is blocked, "Send back" restarts from this step position (0-based). */
  retryFrom?: number;
}

export interface Pipeline {
  id: string;
  name: string;
  /** One line the CEO uses to pick it. */
  whenToUse: string;
  steps: PipelineStep[];
}
