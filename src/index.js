import { SECURITY_HEADERS, handleOptions } from "./lib/security.js";
import { handleApiSearch, handleApiJudgment, handleApiCourts, handleApiCourtJudgments } from "./routes/api.js";
import { handleRobotsTxt, handleSitemap } from "./routes/seo.js";
import {
  handleGoogleLogin,
  handleDevLogin,
  handleGoogleCallback,
  handleLogout,
  handleUserSavedApi,
  handleUserMeApi,
} from "./routes/auth.js";
import { validateSession } from "./lib/auth.js";
import {
  renderHomePageHtml,
  renderJudgmentPageHtml,
  renderCourtLandingPageHtml,
  renderLoginPageHtml,
} from "./ui/templates.js";
import { getHomeStats, getJudgmentById, getCourtLandingData } from "./lib/db.js";

const OFFICIAL_SVG_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 508 508"><circle cx="254" cy="254" r="254" fill="#84DBFF"/><path d="M80 438.8c45.6 42.8 106.8 69.2 174 69.2s128.4-26.4 174-69.2H80z" fill="#54C0EB"/><path d="M436.8 271.6h-64c-8.4 0-15.2-6.8-15.2-15.2V246h94.8v10c.8 8.8-6.4 15.6-14.8 15.6zM135.2 271.6h-64c-8.4 0-15.2-6.8-15.2-15.2V246h94.8v10c.8 8.8-6.4 15.6-14.8 15.6z" fill="#324A5E"/><path d="M282.4 401.6h-54.8c-8 0-14 6.4-14 14v4.4h83.2v-4.4c-.4-8-6.4-14.4-14.4-14.4z" fill="#2B3B4E"/><path d="M309.2 420H200.8c-10.4 0-18.8 8.4-18.8 18.8h145.6c0-10.4-8.4-18.8-18.4-18.8z" fill="#324A5E"/><circle cx="254.8" cy="183.6" r="22.4" fill="#E6E9EE"/></svg>`.trim();

function errorResponse(body, status = 500) {
  return new Response(body, {
    status,
    headers: {
      ...SECURITY_HEADERS,
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function withRequestId(response, requestId) {
  const headers = new Headers(response.headers);
  headers.set("X-Request-ID", requestId);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function requestLog(request, url, requestId, startedAt, response) {
  console.log(JSON.stringify({
    request_id: requestId,
    method: request.method,
    endpoint: url.pathname,
    status: response.status,
    duration_ms: Math.round((Date.now() - startedAt) * 100) / 100,
  }));
  return response;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const startedAt = Date.now();
    const requestId = request.headers.get("CF-Ray") || (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
    const finish = (response) => requestLog(request, url, requestId, startedAt, withRequestId(response, requestId));

    if (request.method === "OPTIONS") return finish(handleOptions(request));

    const isRead = request.method === "GET" || request.method === "HEAD";
    const isMutationAllowed = request.method === "POST" || request.method === "DELETE";
    const isMutationPath = url.pathname.startsWith("/api/user/") || url.pathname.startsWith("/auth/");
    if (!isRead && !(isMutationAllowed && isMutationPath)) {
      return finish(new Response("Method Not Allowed", {
        status: 405,
        headers: { ...SECURITY_HEADERS, Allow: "GET, HEAD, POST, DELETE, OPTIONS", "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
      }));
    }

    // Static assets & SEO (public)
    if (url.pathname === "/favicon.ico" || url.pathname === "/favicon.svg") {
      return finish(new Response(OFFICIAL_SVG_ICON, {
        headers: {
          ...SECURITY_HEADERS,
          "Content-Type": "image/svg+xml; charset=utf-8",
          "Cache-Control": "public, max-age=604800, immutable",
        },
      }));
    }

    if (url.pathname === "/robots.txt") return finish(handleRobotsTxt());
    if (/^\/sitemap(?:-\d+)?\.xml$/.test(url.pathname)) {
      return finish(await handleSitemap(request, env, url, ctx));
    }

    // Authentication Routes
    if (url.pathname === "/auth/google/login") {
      return finish(await handleGoogleLogin(request, env, url));
    }
    if (url.pathname === "/auth/dev/login") {
      return finish(await handleDevLogin(request, env, url));
    }
    if (url.pathname === "/auth/google/callback") {
      return finish(await handleGoogleCallback(request, env, url));
    }
    if (url.pathname === "/auth/logout") {
      return finish(await handleLogout(request, env));
    }

    // Check user session
    let auth = null;
    try {
      auth = await validateSession(env.DB, request);
    } catch (e) {
      console.warn("Session check warning:", e.message);
    }

    // Direct Login Route
    if (url.pathname === "/login") {
      if (auth) {
        const returnTo = url.searchParams.get("return_to") || "/";
        return finish(Response.redirect(new URL(returnTo, request.url).href, 302));
      }
      return finish(new Response(renderLoginPageHtml({
        returnTo: url.searchParams.get("return_to") || "/",
        error: url.searchParams.get("error") || "",
      }), {
        status: 200,
        headers: {
          ...SECURITY_HEADERS,
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }));
    }

    // Gatekeeper: Website does NOT open without login!
    if (!auth) {
      if (url.pathname.startsWith("/api/")) {
        return finish(new Response(JSON.stringify({
          error: "unauthorized",
          message: "يجب تسجيل الدخول بحساب Google للوصول إلى قاعدة الأحكام والمحفوظات",
          login_url: `/login?return_to=${encodeURIComponent(url.pathname + url.search)}`,
        }), {
          status: 401,
          headers: {
            ...SECURITY_HEADERS,
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store",
          },
        }));
      }

      // Render the gatekeeper login wall immediately
      return finish(new Response(renderLoginPageHtml({
        returnTo: url.pathname + url.search,
      }), {
        status: 200,
        headers: {
          ...SECURITY_HEADERS,
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }));
    }

    // Authenticated User APIs
    if (url.pathname === "/api/user/me") {
      return finish(await handleUserMeApi(request, env, auth.user));
    }
    if (url.pathname === "/api/user/saved" || url.pathname === "/api/user/saved/sync") {
      return finish(await handleUserSavedApi(request, env, url, auth.user));
    }

    // Authenticated Search & Retrieval APIs
    if (url.pathname === "/api/search") {
      return finish(await handleApiSearch(request, env, url, ctx));
    }
    if (url.pathname === "/api/judgment") {
      return finish(await handleApiJudgment(request, env, url, ctx));
    }
    if (url.pathname === "/api/courts") {
      return finish(await handleApiCourts(request, env, ctx));
    }
    if (url.pathname === "/api/court-judgments") {
      return finish(await handleApiCourtJudgments(request, env, url, ctx));
    }

    if (url.pathname === "/saved" || url.pathname === "/bookmarks") {
      return finish(Response.redirect(new URL("/?tab=saved", request.url).href, 302));
    }

    // Judgment Full Detail View
    const judgmentMatch = url.pathname.match(/^\/judgment\/(\d+)$/);
    if (judgmentMatch) {
      const masterId = Number(judgmentMatch[1]);
      if (!Number.isSafeInteger(masterId) || masterId <= 0) {
        return finish(errorResponse("معرف الحكم غير صالح", 400));
      }

      try {
        const data = await getJudgmentById(env.DB, masterId);
        if (!data.found) return finish(errorResponse("الحكم القضائي غير موجود", 404));

        const html = renderJudgmentPageHtml(data, auth.user);
        return finish(new Response(html, {
          status: 200,
          headers: {
            ...SECURITY_HEADERS,
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        }));
      } catch (err) {
        console.error("SSR Judgment Render Failure:", err);
        return finish(errorResponse("حدث خطأ أثناء عرض الحكم", 500));
      }
    }

    // Court Landing View
    const courtMatch = url.pathname.match(/^\/courts\/([a-z-]+)$/);
    if (courtMatch) {
      const slug = courtMatch[1];
      try {
        const data = await getCourtLandingData(env.DB, slug);
        if (!data) return finish(errorResponse("صفحة المحكمة غير موجودة", 404));

        const html = renderCourtLandingPageHtml(data, auth.user);
        return finish(new Response(html, {
          status: 200,
          headers: {
            ...SECURITY_HEADERS,
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        }));
      } catch (err) {
        console.error("SSR Court Landing Failure:", err);
        return finish(errorResponse("حدث خطأ أثناء عرض صفحة المحكمة", 500));
      }
    }

    // Homepage Search Workspace
    if (url.pathname === "/") {
      let stats = null;
      try { stats = await getHomeStats(env.DB); }
      catch (error) { console.warn("Homepage stats unavailable", error?.message || error); }
      const response = new Response(renderHomePageHtml(stats, auth.user), {
        headers: {
          ...SECURITY_HEADERS,
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      });
      return finish(response);
    }

    return finish(errorResponse("الصفحة غير موجودة", 404));
  },
};
