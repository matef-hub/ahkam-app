export const SESSION_COOKIE_NAME = "ahkam_session";
export const OAUTH_STATE_COOKIE_NAME = "ahkam_oauth_state";
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 3600; // 30 days

export function parseCookies(request) {
  const header = request.headers.get("Cookie") || "";
  const cookies = {};
  for (const pair of header.split(";")) {
    const trimmed = pair.trim();
    if (!trimmed) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const k = trimmed.slice(0, eqIdx).trim();
      const v = trimmed.slice(eqIdx + 1).trim();
      try {
        cookies[k] = decodeURIComponent(v);
      } catch {
        cookies[k] = v;
      }
    }
  }
  return cookies;
}

export async function hashToken(token) {
  const data = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function createSessionCookie(token, maxAgeSeconds = SESSION_MAX_AGE_SECONDS) {
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export function createOAuthStateCookie(state) {
  return `${OAUTH_STATE_COOKIE_NAME}=${encodeURIComponent(state)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`;
}

export function clearOAuthStateCookie() {
  return `${OAUTH_STATE_COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export async function createSession(db, userId, request, { isTrial = false } = {}) {
  const token = (crypto.randomUUID ? crypto.randomUUID().replace(/-/g, "") : Math.random().toString(36).slice(2)) +
                (crypto.randomUUID ? crypto.randomUUID().replace(/-/g, "") : Math.random().toString(36).slice(2));
  const tokenHash = await hashToken(token);
  const now = new Date();
  const createdAt = now.toISOString();
  const maxAge = isTrial ? 2 * 3600 : SESSION_MAX_AGE_SECONDS;
  const expiresAt = new Date(now.getTime() + maxAge * 1000).toISOString();
  const ip = request.headers.get("CF-Connecting-IP") || request.headers.get("x-forwarded-for") || "";
  const userAgent = request.headers.get("User-Agent") || "";

  await db
    .prepare(
      "INSERT INTO sessions (token_hash, user_id, ip_address, user_agent, created_at, expires_at, search_count, is_trial) VALUES (?, ?, ?, ?, ?, ?, 0, ?)"
    )
    .bind(tokenHash, userId, ip, userAgent, createdAt, expiresAt, isTrial ? 1 : 0)
    .run();

  return { token, tokenHash, expiresAt, isTrial: Boolean(isTrial) };
}

export async function validateSession(db, request) {
  const cookies = parseCookies(request);
  const token = cookies[SESSION_COOKIE_NAME];
  if (!token) return null;

  const tokenHash = await hashToken(token);
  const nowIso = new Date().toISOString();

  const session = await db
    .prepare(
      `SELECT s.token_hash, s.user_id, s.expires_at, s.search_count, s.is_trial,
              u.id, u.google_id, u.email, u.name, u.picture_url,
              u.subscription_status, u.subscription_tier, u.subscription_expires_at
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.token_hash = ? AND s.expires_at > ?`
    )
    .bind(tokenHash, nowIso)
    .first();

  if (!session) return null;

  return {
    session: {
      tokenHash: session.token_hash,
      userId: session.user_id,
      expiresAt: session.expires_at,
      searchCount: Number(session.search_count || 0),
      isTrial: Boolean(session.is_trial),
    },
    user: {
      id: session.id,
      googleId: session.google_id,
      email: session.email,
      name: session.name,
      pictureUrl: session.picture_url,
      subscriptionStatus: session.subscription_status,
      subscriptionTier: session.subscription_tier,
      subscriptionExpiresAt: session.subscription_expires_at,
    },
  };
}

export async function incrementSessionSearchCount(db, tokenHash) {
  await db
    .prepare("UPDATE sessions SET search_count = search_count + 1 WHERE token_hash = ?")
    .bind(tokenHash)
    .run();
}

/**
 * Atomically attempts to claim the single trial search allowance.
 * Returns true if the allowance was successfully claimed (transitions search_count 0 -> 1).
 * Returns false if the allowance was already consumed (search_count >= 1).
 * This eliminates the race condition where concurrent requests both pass search_count < 1.
 */
export async function claimTrialSearchAtomic(db, tokenHash) {
  const res = await db
    .prepare(
      "UPDATE sessions SET search_count = search_count + 1 WHERE token_hash = ? AND search_count < 1"
    )
    .bind(tokenHash)
    .run();
  const changes = res?.meta?.changes ?? res?.changes ?? 0;
  return changes > 0;
}

/**
 * Reverts a claimed trial search in case the internal search execution failed with
 * a 500 / database error, ensuring users are not penalized for server faults.
 */
export async function rollbackTrialSearch(db, tokenHash) {
  try {
    await db
      .prepare(
        "UPDATE sessions SET search_count = MAX(0, search_count - 1) WHERE token_hash = ?"
      )
      .bind(tokenHash)
      .run();
  } catch (err) {
    console.warn("Rollback trial search error:", err.message);
  }
}

/**
 * Server-authoritative check: Verifies if a given IP address has already consumed a trial search.
 */
export async function hasExhaustedTrialByIp(db, ip) {
  if (!ip || typeof ip !== "string") return false;
  const cleanIp = ip.trim();
  if (!cleanIp || cleanIp === "127.0.0.1" || cleanIp === "::1") return false;
  const row = await db
    .prepare(
      "SELECT 1 FROM sessions WHERE is_trial = 1 AND search_count >= 1 AND ip_address = ? LIMIT 1"
    )
    .bind(cleanIp)
    .first();
  return Boolean(row);
}

/**
 * Retrieves or creates a single shared anonymous trial user to prevent database clutter
 * with disposable guest rows on every anonymous click.
 */
export async function getOrCreateAnonymousTrialUser(db) {
  const existing = await db
    .prepare("SELECT id FROM users WHERE google_id = 'anonymous-trial-user'")
    .first();
  if (existing) return existing.id;

  const nowIso = new Date().toISOString();
  const res = await db
    .prepare(
      `INSERT INTO users (google_id, email, name, picture_url, created_at, last_login_at, subscription_status, subscription_tier)
       VALUES ('anonymous-trial-user', 'trial@ahkam.app', 'زائر (تجربة فورية)', '', ?, ?, 'trial', 'trial')`
    )
    .bind(nowIso, nowIso)
    .run();
  return res?.meta?.last_row_id ?? res?.lastInsertRowid ?? 1;
}

export async function destroySession(db, request) {
  const cookies = parseCookies(request);
  const token = cookies[SESSION_COOKIE_NAME];
  if (!token) return;
  const tokenHash = await hashToken(token);
  await db.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(tokenHash).run();
}

export async function upsertGoogleUser(db, { googleId, email, name, pictureUrl }) {
  const nowIso = new Date().toISOString();
  const existing = await db
    .prepare(
      "SELECT id, google_id, email, name, picture_url, subscription_status, subscription_tier FROM users WHERE google_id = ? OR email = ?"
    )
    .bind(googleId, email)
    .first();

  if (existing) {
    const finalName = name || existing.name;
    const finalPic = pictureUrl || existing.picture_url;
    await db
      .prepare("UPDATE users SET google_id = ?, name = ?, picture_url = ?, last_login_at = ? WHERE id = ?")
      .bind(googleId, finalName, finalPic, nowIso, existing.id)
      .run();
    return {
      id: existing.id,
      googleId,
      email: existing.email,
      name: finalName,
      pictureUrl: finalPic,
      subscriptionStatus: existing.subscription_status,
      subscriptionTier: existing.subscription_tier,
    };
  }

  const res = await db
    .prepare(
      `INSERT INTO users (google_id, email, name, picture_url, created_at, last_login_at, subscription_status, subscription_tier)
       VALUES (?, ?, ?, ?, ?, ?, 'active_trial', 'standard')`
    )
    .bind(googleId, email, name || "مستخدم قانوني", pictureUrl || "", nowIso, nowIso)
    .run();

  const newId = res.meta?.last_row_id || 1;
  return {
    id: newId,
    googleId,
    email,
    name: name || "مستخدم قانوني",
    pictureUrl: pictureUrl || "",
    subscriptionStatus: "active_trial",
    subscriptionTier: "standard",
  };
}

export function buildGoogleAuthUrl(env, redirectUri, state) {
  const clientId = env.GOOGLE_CLIENT_ID;
  if (!clientId) return null;

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("access_type", "online");
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "select_account");
  return url.toString();
}

export async function exchangeGoogleCode(env, code, redirectUri) {
  const clientId = env.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("بيانات ربط Google OAuth غير مهيأة في متغيرات البيئة");
  }

  const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResp.ok) {
    const errorText = await tokenResp.text();
    console.error("Google token exchange error:", errorText);
    throw new Error("فشل تبادل رمز التفويض مع خوادم Google");
  }

  const tokenData = await tokenResp.json();
  const accessToken = tokenData.access_token;

  const userinfoResp = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!userinfoResp.ok) {
    throw new Error("فشل استدعاء بيانات الحساب من Google");
  }

  const userinfo = await userinfoResp.json();
  return {
    googleId: userinfo.sub,
    email: userinfo.email,
    name: userinfo.name || userinfo.email.split("@")[0],
    pictureUrl: userinfo.picture || "",
  };
}
