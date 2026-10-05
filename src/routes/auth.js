import {
  createOAuthStateCookie,
  clearOAuthStateCookie,
  createSessionCookie,
  clearSessionCookie,
  createSession,
  destroySession,
  parseCookies,
  buildGoogleAuthUrl,
  exchangeGoogleCode,
  upsertGoogleUser,
  OAUTH_STATE_COOKIE_NAME,
} from "../lib/auth.js";
import {
  getUserSavedJudgments,
  saveUserJudgment,
  removeUserSavedJudgment,
  batchSyncSavedJudgments,
} from "../lib/user-saved.js";
import { SECURITY_HEADERS } from "../lib/security.js";

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
  const returnTo = url.searchParams.get("return_to") || "/";
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

export async function handleDevLogin(request, env, url) {
  const returnTo = url.searchParams.get("return_to") || "/";
  // Demo user for local development and review
  const demoGoogleUser = {
    googleId: "dev-user-master-id-1",
    email: "atefdodo@gmail.com",
    name: "أ / محمد عاطف محمد",
    pictureUrl: "",
  };

  const user = await upsertGoogleUser(env.DB, demoGoogleUser);
  const session = await createSession(env.DB, user.id, request);

  return redirectResponse(returnTo, [createSessionCookie(session.token)]);
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
      if (parsed.ret && typeof parsed.ret === "string" && parsed.ret.startsWith("/")) {
        returnTo = parsed.ret;
      }
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
    if (url.pathname === "/api/user/saved/sync") {
      let body;
      try {
        body = await request.json();
      } catch {
        return jsonResponse({ error: "بيانات JSON غير صالحة" }, 400);
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

    try {
      await saveUserJudgment(env.DB, user.id, body);
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
