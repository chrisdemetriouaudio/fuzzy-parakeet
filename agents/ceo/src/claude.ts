// One structured Claude call per step. With no ANTHROPIC_API_KEY the department's offline
// stand-in answers instead, so the prototype runs on this Mac without spending anything.
import Anthropic from "@anthropic-ai/sdk";
import type { Brief, Department } from "./types.ts";

export interface ClaudeEnv {
  ANTHROPIC_API_KEY?: string;
  MODEL?: string;
}

const DEFAULT_MODEL = "claude-opus-5-5";

export const isLive = (env: ClaudeEnv) => Boolean(env.ANTHROPIC_API_KEY);

/** Ask Claude for JSON matching `schema`. Throws with a plain message on refusal or cut-off. */
export async function askClaude(
  env: ClaudeEnv,
  opts: { system: string; prompt: string; schema: Record<string, unknown>; effort: "low" | "medium" | "high" },
): Promise<unknown> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const res = await client.beta.messages.create({
    model: env.MODEL || DEFAULT_MODEL,
    max_tokens: 16000,
    // If a safety check declines, the API retries on its recommended fallback model.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: opts.system,
    output_config: { effort: opts.effort, format: { type: "json_schema", schema: opts.schema } },
    messages: [{ role: "user", content: opts.prompt }],
  });
  if (res.stop_reason === "refusal") throw new Error("Claude declined this step.");
  if (res.stop_reason === "max_tokens") throw new Error("Claude's answer was cut off.");
  const text = res.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") throw new Error("Claude gave no answer.");
  return JSON.parse(text.text);
}

/** Turn a brief into the prompt a department sees. */
export function briefPrompt(b: Brief): string {
  const earlier = b.earlier.length
    ? b.earlier
        .map((e) => `### ${e.department}: ${e.stepName}\n${JSON.stringify(e.result, null, 2)}`)
        .join("\n\n")
    : "(none yet)";
  return `Job: ${b.jobTitle}
Pipeline: ${b.pipeline}
Your step: ${b.stepName} (attempt ${b.attempt})
Fix-it price: ${b.settings.fixItPrice || "not set: write [your Fix-it price]"}

## Client
${b.input.client}

## What they wrote
${b.input.text}

## Earlier steps
${earlier}`;
}

export async function runDepartment(env: ClaudeEnv, dept: Department, brief: Brief): Promise<unknown> {
  if (!isLive(env)) return dept.offline(brief);
  return askClaude(env, {
    system: dept.instructions,
    prompt: briefPrompt(brief),
    schema: dept.outputSchema,
    effort: dept.effort,
  });
}
