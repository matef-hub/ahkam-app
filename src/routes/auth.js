import {
  createOAuthStateCookie,
  clearOAuthStateCookie,
  createSessionCookie,
  clearSessionCookie,
  createSession,
  validateSession,
  destroySession,
  parseCookies,
  buildGoogleAuthUrl,
  exchangeGoogleCode,
  upsertGoogleUser,
  hasExhaustedTrialByIp,
  getOrCreateAnonymousTrialUser,
  OAUTH_STATE_COOKIE_NAME,
} from "../lib/auth.js";
import {
  getUserSavedJudgments,
  saveUserJudgment,
  removeUserSavedJudgment,
  batchSyncSavedJudgments,
} from "../lib/user-saved.js";
import { SECURITY_HEADERS, sanitizeReturnTo } from "../lib/security.js";

function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...SECURITY_HEADERS,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...extraHeaders,
    },
  });
}

function redirectResponse(targetUrl, cookies = []) {
  const headers = new Headers({
    ...SECURITY_HEADERS,
    Location: targetUrl,
    "Cache-Control": "no-store",
  });
  for (const c of cookies) {
    if (c) headers.append("Set-Cookie", c);
  }
  return new Response(null, { status: 302, headers });
}

export async function handleGoogleLogin(request, env, url) {
  const returnTo = sanitizeReturnTo(url.searchParams.get("return_to"));
  const statePayload = JSON.stringify({
    rnd: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
    ret: returnTo,
  });
  const stateStr = btoa(statePayload);

  const redirectUri = new URL("/auth/google/callback", url.origin).href;
  const authUrl = buildGoogleAuthUrl(env, redirectUri, stateStr);

  if (!authUrl) {
    // Google Client ID is not configured yet in env, redirect to dev login or login page with notice
    return redirectResponse(
      `/login?error=${encodeURIComponent("بيانات Google OAuth غير مهيأة بعد، يمكنك استخدام الدخول التجريبي")}&return_to=${encodeURIComponent(returnTo)}`
    );
  }

  return redirectResponse(authUrl, [createOAuthStateCookie(stateStr)]);
}

export async function handleTrialLogin(request, env, url) {
  const returnTo = sanitizeReturnTo(url.searchParams.get("return_to"));
  const cookies = parseCookies(request);
  const ip = request.headers.get("CF-Connecting-IP") ||
             request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";

  // Server-authoritative check 1: Check existing session in request
  const existingAuth = await validateSession(env.DB, request);
  if (existingAuth && existingAuth.session.isTrial && existingAuth.session.searchCount >= 1) {
    return redirectResponse(
      `/login?error=${encodeURIComponent("عذراً، لقد استنفدت التجربة الفورية المتاحة (بحث واحد فقط). تفضل بتسجيل الدخول بحساب Google للاستمرار.")}&return_to=${encodeURIComponent(returnTo)}`,
      ["ahkam_trial_used=1; Path=/; Max-Age=86400; SameSite=Lax"]
    );
  }

  // Server-authoritative check 2: Check server-side record for this client IP
  if (ip) {
    const exhaustedByIp = await hasExhaustedTrialByIp(env.DB, ip);
    if (exhaustedByIp) {
      return redirectResponse(
        `/login?error=${encodeURIComponent("عذراً، لقد تم استنفاد التجربة الفورية المتاحة (بحث واحد فقط) من هذا الجهاز. تفضل بتسجيل الدخول بحساب Google للاستمرار.")}&return_to=${encodeURIComponent(returnTo)}`,
        ["ahkam_trial_used=1; Path=/; Max-Age=86400; SameSite=Lax"]
      );
    }
  }

  if (cookies["ahkam_trial_used"] === "1") {
    return redirectResponse(
      `/login?error=${encodeURIComponent("عذراً، لقد استنفدت التجربة الفورية المتاحة (بحث واحد فقط). تفضل بتسجيل الدخول بحساب Google للاستمرار.")}&return_to=${encodeURIComponent(returnTo)}`
    );
  }

  // Use single shared anonymous trial user to prevent database clutter
  const userId = await getOrCreateAnonymousTrialUser(env.DB);
  const session = await createSession(env.DB, userId, request, { isTrial: true });

  const trialCookie = "ahkam_trial_used=1; Path=/; Max-Age=86400; SameSite=Lax";
  return redirectResponse(returnTo, [
    createSessionCookie(session.token, 7200),
    trialCookie,
  ]);
}

export async function handleDevLogin(request, env, url) {
  const isProduction = env?.ENVIRONMENT === "production" || url.hostname === "ahkam.app" || url.hostname.endsWith(".ahkam.app");
  const isDev = !isProduction && Boolean(
    env?.ENVIRONMENT === "development" ||
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1"
  );
  if (!isDev) {
    return new Response(JSON.stringify({ error: "dev login is disabled in production" }), {
      status: 404,
      headers: {
        ...SECURITY_HEADERS,
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  }
  return handleTrialLogin(request, env, url);
}

export async function handleGoogleCallback(request, env, url) {
  const cookies = parseCookies(request);
  const savedState = cookies[OAUTH_STATE_COOKIE_NAME];
  const queryState = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  const errorParam = url.searchParams.get("error");

  let returnTo = "/";
  try {
    if (queryState) {
      const parsed = JSON.parse(atob(queryState));
      returnTo = sanitizeReturnTo(parsed.ret);
    }
  } catch {}

  if (errorParam) {
    return redirectResponse(`/login?error=${encodeURIComponent("ألغى المستخدم تسجيل الدخول أو حدث خطأ من Google")}`);
  }

  if (!code || !queryState || !savedState || queryState !== savedState) {
    return redirectResponse(
      `/login?error=${encodeURIComponent("انتهت صلاحية جلسة تسجيل الدخول أو تم رفض الطلب الأمني، يرجى المحاولة مرة أخرى")}`,
      [clearOAuthStateCookie()]
    );
  }

  const redirectUri = new URL("/auth/google/callback", url.origin).href;

  try {
    const googleUser = await exchangeGoogleCode(env, code, redirectUri);
    const user = await upsertGoogleUser(env.DB, googleUser);
    const session = await createSession(env.DB, user.id, request);

    return redirectResponse(returnTo, [
      createSessionCookie(session.token),
      clearOAuthStateCookie(),
    ]);
  } catch (err) {
    console.error("Auth callback failure:", err);
    return redirectResponse(
      `/login?error=${encodeURIComponent(err.message || "حدث خطأ أثناء إتمام الدخول")}`,
      [clearOAuthStateCookie()]
    );
  }
}

export async function handleLogout(request, env) {
  try {
    await destroySession(env.DB, request);
  } catch (e) {
    console.warn("Logout error:", e.message);
  }
  return redirectResponse("/login", [clearSessionCookie()]);
}

export async function handleUserSavedApi(request, env, url, user) {
  if (request.method === "GET") {
    const saved = await getUserSavedJudgments(env.DB, user.id);
    return jsonResponse({ success: true, saved });
  }

  if (request.method === "POST") {
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 65536) {
      return jsonResponse({ error: "حجم الطلب يتجاوز الحد الأقصى المسموح به (64KB)" }, 413);
    }

    if (url.pathname === "/api/user/saved/sync") {
      let body;
      try {
        body = await request.json();
      } catch {
        return jsonResponse({ error: "بيانات JSON غير صالحة" }, 400);
      }
      if (!body || typeof body !== "object" || !Array.isArray(body.items)) {
        return jsonResponse({ error: "قائمة العناصر المراد مزامنتها غير صالحة" }, 400);
      }
      if (body.items.length > 100) {
        return jsonResponse({ error: "يتجاوز عدد العناصر الحد الأقصى للمزامنة دفعة واحدة (100 عنصر)" }, 400);
      }
      const res = await batchSyncSavedJudgments(env.DB, user.id, body.items || []);
      const saved = await getUserSavedJudgments(env.DB, user.id);
      return jsonResponse({ success: true, synced: res.synced, saved });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "بيانات JSON غير صالحة" }, 400);
    }

    if (!body || typeof body !== "object") {
      return jsonResponse({ error: "بيانات غير صالحة" }, 400);
    }

    const mId = Number(body.masterId || body.id);
    if (!Number.isSafeInteger(mId) || mId <= 0) {
      return jsonResponse({ error: "معرف الحكم غير صالح" }, 400);
    }

    try {
      await saveUserJudgment(env.DB, user.id, { masterId: mId });
      const saved = await getUserSavedJudgments(env.DB, user.id);
      return jsonResponse({ success: true, saved });
    } catch (err) {
      return jsonResponse({ error: err.message }, 400);
    }
  }

  if (request.method === "DELETE") {
    let masterId = url.searchParams.get("id");
    if (!masterId) {
      try {
        const body = await request.json();
        masterId = body.id || body.masterId;
      } catch {}
    }

    if (!masterId) {
      return jsonResponse({ error: "يجب تحديد معرف الحكم لحذفه" }, 400);
    }

    await removeUserSavedJudgment(env.DB, user.id, Number(masterId));
    const saved = await getUserSavedJudgments(env.DB, user.id);
    return jsonResponse({ success: true, saved });
  }

  return jsonResponse({ error: "طريقة طلب غير مدعومة" }, 405);
}

export async function handleUserMeApi(request, env, user) {
  return jsonResponse({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      pictureUrl: user.pictureUrl,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionTier: user.subscriptionTier,
      subscriptionExpiresAt: user.subscriptionExpiresAt,
    },
  });
}
