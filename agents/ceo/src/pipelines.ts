// Pipelines: the fixed routes a job can take. The CEO picks one; it never makes one up.
import type { Pipeline } from "./types.ts";

export const pipelines: Pipeline[] = [
  {
    id: "fix-it-ticket",
    name: "Fix-it ticket",
    whenToUse: "A client has one clear problem with an existing site or app that needs fixing.",
    steps: [
      { department: "sales", name: "Intake and quote" },
      { department: "engineering", name: "Find the cause and plan the fix" },
      // A QA fail sends the job back to Engineering (step 1).
      { department: "qa", name: "Check the fix", retryFrom: 1 },
      { department: "finance", name: "Draft the invoice" },
    ],
  },
];

export const pipelineById = (id: string): Pipeline | undefined => pipelines.find((p) => p.id === id);
