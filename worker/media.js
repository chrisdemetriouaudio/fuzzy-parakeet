// The showreel lives in R2 (D16): it's 93 MB, over the 25 MiB limit for one static asset.
// It keeps its old address (/video/...) and answers byte-range requests, so it can seek.
export async function serveMedia(request, env, url) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response(null, { status: 405, headers: { allow: "GET, HEAD" } });
  }
  const key = decodeURIComponent(url.pathname.slice(1));
  const h = request.headers;

  // Honour Range, unless If-Range says the browser's partial copy is out of date.
  let range = h.has("range") ? h : undefined;
  if (range && h.has("if-range")) {
    const meta = await env.MEDIA.head(key);
    if (!meta || h.get("if-range") !== meta.httpEtag) range = undefined;
  }

  let obj;
  if (request.method === "HEAD") {
    obj = await env.MEDIA.head(key);
  } else {
    // A range R2 can't serve (past the end, or several at once): send the whole file,
    // which HTTP allows.
    obj = await env.MEDIA.get(key, { range, onlyIf: h }).catch(() => {
      range = undefined;
      return env.MEDIA.get(key, { onlyIf: h });
    });
  }
  if (!obj) return env.ASSETS.fetch(request); // not in R2: the site's 404 page

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  if (!headers.has("content-type")) headers.set("content-type", "video/mp4");
  headers.set("etag", obj.httpEtag);
  headers.set("accept-ranges", "bytes");
  headers.set("cache-control", "public, max-age=86400");

  if (request.method === "HEAD") {
    headers.set("content-length", String(obj.size));
    return new Response(null, { headers });
  }
  if (!("body" in obj)) {
    // A condition stopped it: the browser's copy is current (304) or a precondition failed.
    const fresh = h.has("if-none-match") || h.has("if-modified-since");
    return new Response(null, { status: fresh ? 304 : 412, headers });
  }
  if (range && obj.range) {
    const { start, end } = span(obj.range, obj.size);
    headers.set("content-range", `bytes ${start}-${end}/${obj.size}`);
    return new Response(obj.body, { status: 206, headers });
  }
  return new Response(obj.body, { headers });
}

// The first and last byte R2 sent, from the range it reports.
export function span(r, size) {
  if (r.suffix !== undefined) return { start: Math.max(0, size - r.suffix), end: size - 1 };
  const start = r.offset || 0;
  const end = r.length !== undefined ? Math.min(start + r.length, size) - 1 : size - 1;
  return { start, end };
}
