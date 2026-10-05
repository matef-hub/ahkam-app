import { SECURITY_HEADERS, handleOptions } from "./lib/security.js";
import { handleApiSearch, handleApiJudgment, handleApiCourts, handleApiCourtJudgments } from "./routes/api.js";
import { handleRobotsTxt, handleSitemap } from "./routes/seo.js";
import {
  handleGoogleLogin,
  handleDevLogin,
  handleTrialLogin,
  handleGoogleCallback,
  handleLogout,
  handleUserSavedApi,
  handleUserMeApi,
} from "./routes/auth.js";
import { validateSession, incrementSessionSearchCount } from "./lib/auth.js";
import {
  renderHomePageHtml,
  renderJudgmentPageHtml,
  renderCourtLandingPageHtml,
  renderLoginPageHtml,
} from "./ui/templates.js";
import { getHomeStats, getJudgmentById, getCourtLandingData } from "./lib/db.js";

const OFFICIAL_SVG_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="100%" height="100%">
  <!-- Egyptian Judicial Encyclopedia Official Emblem -->
  <defs>
    <style>
      .navy-fill { fill: #0B2545; }
      .gold-fill { fill: #C49A45; }
      .gold-stroke { stroke: #C49A45; stroke-width: 9; stroke-linecap: round; stroke-linejoin: round; }
    </style>
  </defs>

  <!-- Central Column - Top Pediment Bars -->
  <!-- Top Rounded Beam -->
  <rect x="136" y="58" width="328" height="28" rx="14" class="navy-fill" />
  
  <!-- Second Stepped Architrave Bar -->
  <rect x="165" y="98" width="270" height="22" rx="5" class="navy-fill" />

  <!-- Twin Column Shafts (Classical Pillar) -->
  <!-- Left Half -->
  <path d="M 228 140 C 224 152 230 168 244 178 L 244 416 L 292 446 L 292 140 Z" class="navy-fill" />
  
  <!-- Right Half -->
  <path d="M 372 140 C 376 152 370 168 356 178 L 356 416 L 308 446 L 308 140 Z" class="navy-fill" />

  <!-- Left Scale of Justice (Gold) -->
  <circle cx="132" cy="166" r="14" class="gold-fill" />
  <line x1="132" y1="178" x2="54" y2="308" class="gold-stroke" />
  <line x1="132" y1="178" x2="210" y2="308" class="gold-stroke" />
  <path d="M 43 308 C 43 376 221 376 221 308 Z" class="gold-fill" />

  <!-- Right Scale of Justice (Gold) -->
  <circle cx="468" cy="166" r="14" class="gold-fill" />
  <line x1="468" y1="178" x2="390" y2="308" class="gold-stroke" />
  <line x1="468" y1="178" x2="546" y2="308" class="gold-stroke" />
  <path d="M 379 308 C 379 376 557 376 557 308 Z" class="gold-fill" />

  <!-- Open Law Book (Base Foundation) -->
  <!-- Left Page (Navy) -->
  <path d="M 292 496 C 210 418 116 414 45 470 L 74 532 C 144 484 222 490 292 546 Z" class="navy-fill" />

  <!-- Right Page (Navy Top Arc) -->
  <path d="M 308 496 C 390 418 484 414 555 470 L 555 496 C 484 446 390 452 308 528 Z" class="navy-fill" />

  <!-- Right Page (Golden Bottom Arc Swoop) -->
  <path d="M 308 536 C 390 458 484 454 555 510 L 555 522 C 484 474 390 480 308 548 Z" class="gold-fill" />
</svg>`.trim();

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
    if (url.pathname === "/favicon.ico" || url.pathname === "/favicon.svg" || url.pathname === "/logo.svg") {
      return finish(new Response(OFFICIAL_SVG_ICON, {
        headers: {
          ...SECURITY_HEADERS,
          "Content-Type": "image/svg+xml; charset=utf-8",
          "Cache-Control": "public, max-age=604800, immutable",
        },
      }));
    }

    if (url.pathname === "/logo.png") {
      // If a custom PNG base64 is configured, decode and serve it; otherwise fallback to SVG
      if (globalThis.CUSTOM_PNG_BASE64) {
        const binStr = atob(globalThis.CUSTOM_PNG_BASE64);
        const bytes = new Uint8Array(binStr.length);
        for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
        return finish(new Response(bytes, {
          headers: {
            ...SECURITY_HEADERS,
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=604800, immutable",
          },
        }));
      }
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
    if (url.pathname === "/auth/trial/login" || url.pathname === "/auth/dev/login") {
      return finish(await handleTrialLogin(request, env, url));
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
      // Only redirect away if the user is a REAL authenticated user (not a temporary trial user)
      if (auth && !auth.session.isTrial && !url.searchParams.has("force")) {
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

    // Exhausted Trial Enforcement: If a trial user has already used their 1 search, kick them to login
    if (auth.session.isTrial && auth.session.searchCount >= 1) {
      if (url.pathname.startsWith("/api/")) {
        return finish(new Response(JSON.stringify({
          error: "trial_expired",
          message: "لقد استنفدت التجربة الفورية المتاحة (بحث واحد فقط). تفضل بتسجيل الدخول بحساب Google للاستمرار بدون قيود.",
          login_url: `/login?return_to=${encodeURIComponent(url.pathname + url.search)}`,
        }), {
          status: 403,
          headers: {
            ...SECURITY_HEADERS,
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store",
          },
        }));
      }

      // For page requests (such as refreshing / or opening another page), redirect directly to /login
      const loginUrlWithMsg = `/login?error=${encodeURIComponent("لقد استنفدت التجربة الفورية المتاحة (بحث واحد فقط). تفضل بتسجيل الدخول بحساب Google للاستمرار.")}&return_to=${encodeURIComponent(url.pathname + url.search)}`;
      return finish(Response.redirect(new URL(loginUrlWithMsg, request.url).href, 302));
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
      if (auth.session.isTrial) {
        if (auth.session.searchCount >= 1) {
          return finish(new Response(JSON.stringify({
            error: "trial_expired",
            message: "لقد استنفدت التجربة الفورية المتاحة (بحث واحد فقط). تفضل بتسجيل الدخول بحساب Google لمواصلة البحث غير المحدود وحفظ الأحكام.",
            login_url: `/login?return_to=${encodeURIComponent(url.pathname + url.search)}`,
          }), {
            status: 403,
            headers: {
              ...SECURITY_HEADERS,
              "Content-Type": "application/json; charset=utf-8",
              "Cache-Control": "no-store",
            },
          }));
        }
        await incrementSessionSearchCount(env.DB, auth.session.tokenHash);
      }
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
      const response = new Response(renderHomePageHtml(stats, auth.user, auth.session), {
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
