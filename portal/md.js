// A small, safe Markdown renderer for audits and scopes. Everything is HTML-escaped first,
// so no HTML in the text can run; links must be https, http or mailto.
// Supports: # headings (shown one level down, under the page title), paragraphs, - and 1.
// lists, > quotes, ``` code blocks, ---, **bold**, *italic*, `code`, [links](https://…).
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function inline(text) {
  return esc(text)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*\w])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>")
    .replace(/(^|\W)_([^_\s][^_]*)_(?=\W|$)/g, "$1<em>$2</em>")
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label, url) =>
      /^(https?:\/\/|mailto:)/i.test(url.replace(/&amp;/g, "&")) ? `<a href="${url}" rel="noopener noreferrer" target="_blank">${label}</a>` : label);
}

export function renderMarkdown(src) {
  const lines = String(src ?? "").replace(/\r\n?/g, "\n").split("\n");
  const out = [];
  let para = [], list = null, quote = [];
  const flushPara = () => { if (para.length) out.push(`<p>${inline(para.join(" "))}</p>`); para = []; };
  const flushList = () => { if (list) out.push(`<${list.tag}>${list.items.map((i) => `<li>${inline(i)}</li>`).join("")}</${list.tag}>`); list = null; };
  const flushQuote = () => { if (quote.length) out.push(`<blockquote><p>${inline(quote.join(" "))}</p></blockquote>`); quote = []; };
  const flushAll = () => { flushPara(); flushList(); flushQuote(); };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^```/.test(line)) {
      flushAll();
      const code = [];
      while (++i < lines.length && !/^```/.test(lines[i])) code.push(lines[i]);
      out.push(`<pre><code>${esc(code.join("\n"))}</code></pre>`);
      continue;
    }
    let m;
    if (!line.trim()) { flushAll(); continue; }
    if ((m = line.match(/^(#{1,3})\s+(.*)$/))) { flushAll(); const h = m[1].length + 1; out.push(`<h${h}>${inline(m[2])}</h${h}>`); continue; }
    if (/^(-{3,}|\*{3,})\s*$/.test(line)) { flushAll(); out.push("<hr>"); continue; }
    if ((m = line.match(/^>\s?(.*)$/))) { flushPara(); flushList(); quote.push(m[1]); continue; }
    if ((m = line.match(/^\s*[-*]\s+(.*)$/)) || (m = line.match(/^\s*\d+[.)]\s+(.*)$/))) {
      const tag = /^\s*\d/.test(line) ? "ol" : "ul";
      flushPara(); flushQuote();
      if (list && list.tag !== tag) flushList();
      list ??= { tag, items: [] };
      list.items.push(m[1]);
      continue;
    }
    flushList(); flushQuote();
    para.push(line.trim());
  }
  flushAll();
  return out.join("\n");
}
