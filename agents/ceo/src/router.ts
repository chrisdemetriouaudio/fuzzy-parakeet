// The CEO's first job: read what Chris typed and pick a pipeline, or say none fits.
import { askClaude, isLive, type ClaudeEnv } from "./claude.ts";
import { pipelines } from "./pipelines.ts";

export interface Pick {
  pipeline: string | null;
  title: string;
  reason: string;
}

const CEO_INSTRUCTIONS = `You are the CEO agent for Chris Demetriou's one-person software studio.
Chris tells you an idea or a client request. Pick the one pipeline that fits, or "none".
Never invent a pipeline. Give the job a short title, verb first, under 8 words.
Explain your pick in one plain sentence.`;

export async function pickPipeline(env: ClaudeEnv, client: string, text: string): Promise<Pick> {
  const ids = pipelines.map((p) => p.id);
  if (!isLive(env)) {
    // Offline: phase 1 has one pipeline, so anything that reads like a problem goes there.
    const title = `Fix for ${client}: ${text.split(/[.\n]/)[0].trim().slice(0, 50)}`;
    return { pipeline: ids[0], title, reason: "Offline mode: phase 1 has one pipeline, Fix-it ticket." };
  }
  const menu = pipelines.map((p) => `- ${p.id}: ${p.whenToUse}`).join("\n");
  const out = (await askClaude(env, {
    system: CEO_INSTRUCTIONS,
    prompt: `Pipelines you can pick:\n${menu}\n\nClient: ${client}\n\nWhat Chris wrote:\n${text}`,
    effort: "low",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        pipeline: { type: "string", enum: [...ids, "none"] },
        title: { type: "string" },
        reason: { type: "string" },
      },
      required: ["pipeline", "title", "reason"],
    },
  })) as { pipeline: string; title: string; reason: string };
  return { pipeline: out.pipeline === "none" ? null : out.pipeline, title: out.title, reason: out.reason };
}
