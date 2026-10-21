/**
 * chrisdemetriou.com on Cloudflare Workers. Serves the static site (the repo, filtered by
 * .assetsignore) with security headers, and the showreel from R2. The lead chat API and
 * the portal join here in later phases.
 */
import { securityHeaders } from "./headers.js";
import { serveMedia } from "./media.js";

const APEX = "chrisdemetriou.com";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // www and plain http go to https://chrisdemetriou.com for good, as on GitHub Pages.
    if (url.hostname === `www.${APEX}` || (url.hostname === APEX && url.protocol === "http:")) {
      return Response.redirect(`https://${APEX}${url.pathname}${url.search}`, 301);
    }

    let res = url.pathname.startsWith("/video/")
      ? await serveMedia(request, env, url)
      : await env.ASSETS.fetch(request);

    // The asset server adds a missing trailing slash with a temporary (307) redirect.
    // GitHub Pages used a permanent one (301), which is what search engines should keep.
    if (res.status === 307) {
      res = new Response(null, { status: 301, headers: { location: res.headers.get("location") } });
    }

    res = new Response(res.body, res);
    securityHeaders(res.headers, url.pathname, res.status);
    // Any other address (preview.chrisdemetriou.com) is only a preview: keep it out of search.
    if (url.hostname !== APEX) res.headers.set("x-robots-tag", "noindex");
    return res;
  },
};
