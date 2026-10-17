/**
 * labs.chrisdemetriou.com — the Labs home page (static files in public/).
 * This tiny Worker forwards the old address (demo.chrisdemetriou.com) so links
 * people already have keep working, fills in the footer year on each page, and
 * answers /version.json with the build it's running (BUILD_SHA / BUILD_AT, set
 * by `npm run release`).
 */
const OLD_HOST = "demo.chrisdemetriou.com";
const LABS = "https://labs.chrisdemetriou.com";
const GENESIS = "https://genesis.labs.chrisdemetriou.com";

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.hostname === OLD_HOST) {
      // The Genesis write-up and engineering page now live on the project's own address.
      const to = url.pathname.startsWith("/engineering") ? `${GENESIS}/engineering/`
        : url.pathname.startsWith("/stats/") ? `${GENESIS}${url.pathname}`
        : `${LABS}/`;
      return Response.redirect(to, 301);
    }
    if (url.pathname === "/version.json") {
      return Response.json({ app: "labs", sha: env.BUILD_SHA || "dev", at: env.BUILD_AT || null }, { headers: { "cache-control": "no-store" } });
    }
    const res = await env.ASSETS.fetch(req);
    // Footer year: filled in as each page is served, so it's always this year (no script on the page).
    if (!(res.headers.get("content-type") || "").includes("text/html")) return res;
    const year = String(new Date().getUTCFullYear());
    return new HTMLRewriter().on("[data-year]", { element(el) { el.setInnerContent(year); } }).transform(res);
  },
};
