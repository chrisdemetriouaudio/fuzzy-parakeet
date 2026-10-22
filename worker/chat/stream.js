// Reads Workers AI's streamed reply and turns it into clean text: the [[MAPPED]] control
// token is removed (even when it arrives split across chunks) and recorded instead.

const TOKEN = /\[\[\s*MAPPED\s*\]\]/gi;

// Could this be the start of the token? ("[", "[[MAP", "[[ MAPPED ]" ...)
const couldBeToken = (tail) => tail.length <= 16 && "[[MAPPED]]".startsWith(tail.replace(/\s+/g, "").toUpperCase());

// Text is passed on as it arrives, except a trailing piece that could still turn into the
// token; that waits until it either completes (and is dropped) or can't.
export function createTokenFilter() {
  let held = "";
  let full = "";
  return {
    push(piece) {
      full += piece;
      held = (held + piece).replace(TOKEN, "");
      const start = held.endsWith("[") && !held.endsWith("[[") ? held.length - 1 : held.lastIndexOf("[[");
      if (start === -1 || !couldBeToken(held.slice(start))) { const out = held; held = ""; return out; }
      const out = held.slice(0, start);
      held = held.slice(start);
      return out;
    },
    end() {
      const out = held.replace(TOKEN, "");
      held = "";
      return out;
    },
    get mapped() { TOKEN.lastIndex = 0; return TOKEN.test(full); },
    get text() { return full.replace(TOKEN, "").trim(); },
  };
}

// Workers AI streams server-sent events: `data: {"response":"..."}` lines, then `data: [DONE]`.
export async function* aiText(stream) {
  const reader = stream.getReader();
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let nl;
    while ((nl = buf.indexOf("\n")) !== -1) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (data === "[DONE]") return;
      try {
        const piece = JSON.parse(data).response;
        if (typeof piece === "string" && piece) yield piece;
      } catch { /* a keep-alive or partial line: skip */ }
    }
  }
}

export const sse = (data) => `data: ${JSON.stringify(data)}\n\n`;
