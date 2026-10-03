import { SECURITY_HEADERS, handleOptions } from "./lib/security.js";
import { handleApiSearch, handleApiJudgment } from "./routes/api.js";
import { handleRobotsTxt, handleSitemap } from "./routes/seo.js";
import { renderHomePageHtml, renderJudgmentPageHtml } from "./ui/templates.js";
import { getJudgmentById } from "./lib/db.js";
import { matchCache, storeInCache } from "./lib/cache.js";

const OFFICIAL_SVG_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 508 508"><circle cx="254" cy="254" r="254" fill="#84DBFF"/><path d="M80 438.8c45.6 42.8 106.8 69.2 174 69.2s128.4-26.4 174-69.2H80z" fill="#54C0EB"/><path d="M436.8 271.6h-64c-8.4 0-15.2-6.8-15.2-15.2V246h94.8v10c.8 8.8-6.4 15.6-14.8 15.6zM135.2 271.6h-64c-8.4 0-15.2-6.8-15.2-15.2V246h94.8v10c.8 8.8-6.4 15.6-14.8 15.6z" fill="#324A5E"/><path d="M282.4 401.6h-54.8c-8 0-14 6.4-14 14v4.4h83.2v-4.4c-.4-8-6.4-14-14.4-14z" fill="#2B3B4E"/><path d="M309.2 420H200.8c-10.4 0-18.8 8.4-18.8 18.8h145.6c0-10.4-8.4-18.8-18.4-18.8z" fill="#324A5E"/><circle cx="254.8" cy="183.6" r="22.4" fill="#E6E9EE"/></svg>`.trim();

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 0. Preflight OPTIONS
    if (request.method === "OPTIONS") {
      return handleOptions(request);
    }

    // 1. Favicon & Touch Icons
    if (
      url.pathname === "/favicon.ico" ||
      url.pathname === "/favicon.svg" ||
      url.pathname.includes("apple-touch-icon")
    ) {
      return new Response(OFFICIAL_SVG_ICON, {
        headers: {
          ...SECURITY_HEADERS,
          "Content-Type": "image/svg+xml; charset=utf-8",
          "Cache-Control": "public, max-age=604800, immutable",
        },
      });
    }

    // 2. SEO Endpoints
    if (url.pathname === "/robots.txt") {
      return handleRobotsTxt();
    }
    if (url.pathname === "/sitemap.xml" || url.pathname.startsWith("/sitemap-")) {
      return handleSitemap(request, env, url);
    }

    // 3. API Endpoints
    if (url.pathname === "/api/search" && request.method === "GET") {
      return handleApiSearch(request, env, url);
    }
    if (url.pathname === "/api/judgment" && request.method === "GET") {
      return handleApiJudgment(request, env, url);
    }

    // 4. Server-Side Rendered (SSR) Judgment Page (/judgment/:id)
    const judgmentMatch = url.pathname.match(/^\/judgment\/(\d+)$/);
    if (judgmentMatch && request.method === "GET") {
      const cached = await matchCache(request);
      if (cached) return cached;

      const masterId = parseInt(judgmentMatch[1], 10);
      try {
        const data = await getJudgmentById(env.DB, masterId);
        if (!data.found) {
          return new Response("الحكم القضائي غير موجود", {
            status: 404,
            headers: { ...SECURITY_HEADERS, "Content-Type": "text/plain; charset=utf-8" },
          });
        }

        const html = renderJudgmentPageHtml(data);
        const resp = new Response(html, {
          status: 200,
          headers: {
            ...SECURITY_HEADERS,
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "public, max-age=86400, s-maxage=86400",
          },
        });
        return await storeInCache(request, resp, 86400);
      } catch (err) {
        console.error("SSR Judgment Render Failure:", err);
        return new Response("حدث خطأ أثناء عرض الحكم", { status: 500 });
      }
    }

    // 5. Home Page
    if (url.pathname === "/" && request.method === "GET") {
      return new Response(renderHomePageHtml(), {
        headers: {
          ...SECURITY_HEADERS,
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=3600, s-maxage=3600",
        },
      });
    }

    // 404 Fallback
    return new Response("الصفحة غير موجودة", {
      status: 404,
      headers: {
        ...SECURITY_HEADERS,
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  },
};