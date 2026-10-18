// Approval gates. Pure functions, no Cloudflare imports, so Node tests can run them.
//
// The rule: a department never does anything outward-facing itself. It can only
// ASK (a ProposedAction). Every ask waits for Chris's yes on the dashboard.
// In phase 1 even a yes does not send anything: carryOut() only records it.

import type { Department, DepartmentResult, OutwardKind, ProposedAction } from "./types.ts";

export const OUTWARD_KINDS: readonly OutwardKind[] = ["send", "deploy", "sign", "spend"];

export const KIND_LABEL: Record<OutwardKind, string> = {
  send: "Send",
  deploy: "Deploy",
  sign: "Sign",
  spend: "Spend",
};

/** The JSON Schema every department's result shares. Departments add their own fields. */
export function resultSchema(
  extra: Record<string, unknown>,
  extraRequired: string[],
): Record<string, unknown> {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      summary: { type: "string", description: "One or two plain sentences for the dashboard." },
      actions: {
        type: "array",
        description: "Outward-facing things you want done. Chris approves each one. Empty if none.",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            kind: { type: "string", enum: [...OUTWARD_KINDS] },
            summary: { type: "string", description: "One line, verb first." },
            detail: { type: "string", description: "The full text Chris will check." },
          },
          required: ["kind", "summary", "detail"],
        },
      },
      blocker: {
        type: "string",
        description: "Empty string when all is well. Otherwise why this step cannot go on.",
      },
      ...extra,
    },
    required: ["summary", "actions", "blocker", ...extraRequired],
  };
}

export type Review =
  | { ok: true; gated: ProposedAction[]; blocker: string }
  | { ok: false; problem: string };

/**
 * Check a department's result before anything is saved as "done".
 * - Badly shaped results fail.
 * - Asking for an outward kind the department is not allowed fails (permissions).
 * - Every allowed ask is returned as gated: it must wait for Chris.
 */
export function reviewResult(dept: Department, raw: unknown): Review {
  if (!raw || typeof raw !== "object") return { ok: false, problem: `${dept.name} gave no result.` };
  const result = raw as Partial<DepartmentResult>;
  if (typeof result.summary !== "string" || !result.summary.trim()) {
    return { ok: false, problem: `${dept.name} gave no summary.` };
  }
  if (!Array.isArray(result.actions)) {
    return { ok: false, problem: `${dept.name} gave no list of actions.` };
  }
  const gated: ProposedAction[] = [];
  for (const a of result.actions as Partial<ProposedAction>[]) {
    if (!a || !OUTWARD_KINDS.includes(a.kind as OutwardKind)) {
      return { ok: false, problem: `${dept.name} asked for an unknown kind of action.` };
    }
    const kind = a.kind as OutwardKind;
    if (!dept.mayPropose.includes(kind)) {
      return {
        ok: false,
        problem: `${dept.name} asked to ${kind}, which it is not allowed to do.`,
      };
    }
    if (typeof a.summary !== "string" || !a.summary.trim() || typeof a.detail !== "string") {
      return { ok: false, problem: `${dept.name} asked to ${kind} without saying what.` };
    }
    gated.push({ kind, summary: a.summary.trim(), detail: a.detail });
  }
  const blocker = typeof result.blocker === "string" ? result.blocker.trim() : "";
  return { ok: true, gated, blocker };
}

export type Decision = "waiting" | "yes" | "no";

/** Where a step stands once Chris has answered some or all of its asks. */
export function stepAfterDecisions(decisions: Decision[]): "waiting" | "go" | "stop" {
  if (decisions.includes("no")) return "stop";
  if (decisions.includes("waiting")) return "waiting";
  return "go";
}

/**
 * Carry out an approved action. Phase 1 is wired to nothing on purpose:
 * nothing is sent, deployed, signed or paid. It returns what Chris should do by hand.
 */
export function carryOut(action: ProposedAction): { done: false; note: string } {
  return {
    done: false,
    note: `Approved. Phase 1 does not ${action.kind} anything: do "${action.summary}" by hand.`,
  };
}
