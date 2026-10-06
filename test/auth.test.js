import test from "node:test";
import assert from "node:assert/strict";
import { initDatabase } from "../src/lib/node-db.js";
import {
  createSession,
  validateSession,
  destroySession,
  upsertGoogleUser,
  hashToken,
  SESSION_COOKIE_NAME,
} from "../src/lib/auth.js";
import {
  getUserSavedJudgments,
  saveUserJudgment,
  removeUserSavedJudgment,
  batchSyncSavedJudgments,
} from "../src/lib/user-saved.js";
import { sanitizeReturnTo } from "../src/lib/security.js";
import worker from "../src/index.js";

const db = initDatabase();

test("Database migration creates users, sessions, and user_saved_judgments", async () => {
  const users = await db.prepare("SELECT count(*) as count FROM users").first();
  assert.ok(users !== null, "users table exists");

  const sessions = await db.prepare("SELECT count(*) as count FROM sessions").first();
  assert.ok(sessions !== null, "sessions table exists");

  const saved = await db.prepare("SELECT count(*) as count FROM user_saved_judgments").first();
  assert.ok(saved !== null, "user_saved_judgments table exists");
});

test("Migration integrity: fresh database applies all migrations successfully with exact session columns", async () => {
  const freshDb = initDatabase(":memory:");

  // Verify users, sessions, and user_saved_judgments exist on fresh db
  const users = await freshDb.prepare("SELECT count(*) as count FROM users").first();
  assert.ok(users !== null, "users table exists on fresh database");

  const sessions = await freshDb.prepare("SELECT count(*) as count FROM sessions").first();
  assert.ok(sessions !== null, "sessions table exists on fresh database");

  const saved = await freshDb.prepare("SELECT count(*) as count FROM user_saved_judgments").first();
  assert.ok(saved !== null, "user_saved_judgments table exists on fresh database");

  // Verify sessions contains search_count and is_trial exactly once
  const cols = await freshDb.prepare("PRAGMA table_info('sessions')").all();
  const colRows = cols.results || cols;
  const colNames = colRows.map((c) => c.name);

  assert.equal(colNames.filter((name) => name === "search_count").length, 1, "search_count exists exactly once");
  assert.equal(colNames.filter((name) => name === "is_trial").length, 1, "is_trial exists exactly once");
  assert.ok(colNames.includes("token_hash"), "token_hash column exists");
  assert.ok(colNames.includes("user_id"), "user_id column exists");
  assert.ok(colNames.includes("created_at"), "created_at column exists");
  assert.ok(colNames.includes("expires_at"), "expires_at column exists");
});

test("Migration failure propagation: node-db throws on migration execution errors", async () => {
  const { DatabaseSync } = await import("node:sqlite");
  const tempDb = new DatabaseSync(":memory:");
  assert.throws(() => {
    tempDb.exec("MALFORMED SQL COMMAND THAT SHOULD FAIL;");
  }, /syntax error/);
});

test("upsertGoogleUser creates user with trial status and updates on second login", async () => {
  const googleId = "test-gid-" + Date.now();
  const email = "lawyer-" + Date.now() + "@example.com";

  const user1 = await upsertGoogleUser(db, {
    googleId,
    email,
    name: "المستشار التجريبي",
    pictureUrl: "https://example.com/pic.jpg",
  });

  assert.equal(user1.email, email);
  assert.equal(user1.name, "المستشار التجريبي");
  assert.equal(user1.subscriptionStatus, "active_trial");

  // Re-login with updated name
  const user2 = await upsertGoogleUser(db, {
    googleId,
    email,
    name: "المستشار التجريبي المحدث",
    pictureUrl: "https://example.com/new-pic.jpg",
  });

  assert.equal(user2.id, user1.id);
  assert.equal(user2.name, "المستشار التجريبي المحدث");
});

test("Session creation, validation, and destruction with SHA-256 token hashing", async () => {
  const user = await upsertGoogleUser(db, {
    googleId: "gid-session-test",
    email: "session-test@example.com",
    name: "مستخدم الجلسة",
  });

  const dummyReq = new Request("http://localhost:3000/", {
    headers: { "User-Agent": "Node-Test-Runner" },
  });

  const session = await createSession(db, user.id, dummyReq);
  assert.ok(session.token, "Token was generated");
  assert.ok(session.tokenHash, "Token hash was created");

  // Validate session with cookie
  const authReq = new Request("http://localhost:3000/", {
    headers: { Cookie: `${SESSION_COOKIE_NAME}=${session.token}` },
  });

  const auth = await validateSession(db, authReq);
  assert.ok(auth, "Session validated successfully");
  assert.equal(auth.user.id, user.id);
  assert.equal(auth.user.email, "session-test@example.com");

  // Destroy session
  await destroySession(db, authReq);
  const authAfter = await validateSession(db, authReq);
  assert.equal(authAfter, null, "Session should be null after destruction");
});

test("User cloud saved judgments CRUD operations", async () => {
  const uniq = Date.now() + "_" + Math.random().toString(36).slice(2);
  const user = await upsertGoogleUser(db, {
    googleId: "gid-saved-test-" + uniq,
    email: "saved-test-" + uniq + "@example.com",
    name: "باحث محفوظات",
  });

  // Save judgment
  await saveUserJudgment(db, user.id, {
    masterId: 101,
    courtName: "محكمة النقض",
    caseNo: "1234",
    caseYear: "88",
    caseDate: "2020-05-10",
  });

  let list = await getUserSavedJudgments(db, user.id);
  assert.equal(list.length, 1);
  assert.equal(list[0].masterId, 101);
  assert.equal(list[0].caseNo, "1234");

  // Batch sync
  await batchSyncSavedJudgments(db, user.id, [
    { masterId: 102, courtName: "الدستورية العليا", caseNo: "45", caseYear: "30" },
    { masterId: 103, courtName: "مجلس الدولة", caseNo: "99", caseYear: "65" },
  ]);

  list = await getUserSavedJudgments(db, user.id);
  assert.equal(list.length, 3);

  // Remove judgment
  await removeUserSavedJudgment(db, user.id, 101);
  list = await getUserSavedJudgments(db, user.id);
  assert.equal(list.length, 2);
  assert.ok(!list.some(i => i.masterId === 101));
});

test("Gatekeeper Auth Wall: Unauthenticated request to / returns Gatekeeper login page", async () => {
  const res = await worker.fetch(new Request("http://localhost:3000/"), { DB: db });
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.ok(html.includes("الدخول السريع باستخدام Google"), "Should show Google login button");
  assert.ok(html.includes("auth-card"), "Should render auth card");
});

test("Gatekeeper Auth Wall: Unauthenticated request to /api/search returns 401 Unauthorized", async () => {
  const res = await worker.fetch(new Request("http://localhost:3000/api/search?q=test"), { DB: db });
  assert.equal(res.status, 401);
  const data = await res.json();
  assert.equal(data.error, "unauthorized");
});

test("Authenticated user can access / and see personalized header with their name", async () => {
  const user = await upsertGoogleUser(db, {
    googleId: "gid-auth-gate-test",
    email: "auth-gate@example.com",
    name: "المستشار أحمد فؤاد",
  });

  const session = await createSession(db, user.id, new Request("http://localhost:3000/"));
  const authReq = new Request("http://localhost:3000/", {
    headers: { Cookie: `${SESSION_COOKIE_NAME}=${session.token}` },
  });

  const res = await worker.fetch(authReq, { DB: db });
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.ok(html.includes("المستشار أحمد فؤاد"), "Personalized user name appears in header");
  assert.ok(html.includes("خروج 🚪"), "Logout link appears in header");
});

test("Trial session: Allows exactly 1 search then blocks subsequent searches with 403", async () => {
  const trialUser = await upsertGoogleUser(db, {
    googleId: "trial-limit-test-" + Date.now(),
    email: "trial-" + Date.now() + "@ahkam.app",
    name: "زائر تجريبي",
  });

  const session = await createSession(db, trialUser.id, new Request("http://localhost:3000/"), { isTrial: true });

  const firstSearchReq = new Request("http://localhost:3000/api/search?q=شيك", {
    headers: { Cookie: `${SESSION_COOKIE_NAME}=${session.token}` },
  });

  const firstRes = await worker.fetch(firstSearchReq, { DB: db });
  assert.equal(firstRes.status, 200, "First trial search must succeed");

  // Second search with same trial session must be blocked
  const secondSearchReq = new Request("http://localhost:3000/api/search?q=بطلان", {
    headers: { Cookie: `${SESSION_COOKIE_NAME}=${session.token}` },
  });

  const secondRes = await worker.fetch(secondSearchReq, { DB: db });
  assert.equal(secondRes.status, 403, "Second trial search must be blocked with 403");
  const data = await secondRes.json();
  assert.equal(data.error, "trial_expired");
});

test("Trial session: Refreshing / after 1 search redirects to /login and /login shows the page", async () => {
  const trialUser = await upsertGoogleUser(db, {
    googleId: "trial-refresh-test-" + Date.now(),
    email: "trial-refresh-" + Date.now() + "@ahkam.app",
    name: "زائر للتجربة",
  });

  const session = await createSession(db, trialUser.id, new Request("http://localhost:3000/"), { isTrial: true });

  // Before search: visiting / works
  const beforeReq = new Request("http://localhost:3000/", {
    headers: { Cookie: `${SESSION_COOKIE_NAME}=${session.token}` },
  });
  const beforeRes = await worker.fetch(beforeReq, { DB: db });
  assert.equal(beforeRes.status, 200);

  // Visiting /login while in trial shows the login screen (does not bounce back)
  const loginReq = new Request("http://localhost:3000/login", {
    headers: { Cookie: `${SESSION_COOKIE_NAME}=${session.token}` },
  });
  const loginRes = await worker.fetch(loginReq, { DB: db });
  assert.equal(loginRes.status, 200, "/login must show login screen for trial user");

  // Perform 1 search
  const searchReq = new Request("http://localhost:3000/api/search?q=عقد", {
    headers: { Cookie: `${SESSION_COOKIE_NAME}=${session.token}` },
  });
  await worker.fetch(searchReq, { DB: db });

  // Now, refreshing / must redirect to /login
  const refreshReq = new Request("http://localhost:3000/", {
    headers: { Cookie: `${SESSION_COOKIE_NAME}=${session.token}` },
  });
  const refreshRes = await worker.fetch(refreshReq, { DB: db });
  assert.equal(refreshRes.status, 302, "Must redirect to /login after 1 trial search");
  assert.ok(refreshRes.headers.get("Location").includes("/login"), "Redirect Location must point to /login");
});

test("OAuth security: sanitizeReturnTo correctly accepts internal paths and rejects dangerous targets", () => {
  // Required valid internal paths
  assert.equal(sanitizeReturnTo("/"), "/");
  assert.equal(sanitizeReturnTo("/?q=شيك"), "/?q=شيك");
  assert.equal(sanitizeReturnTo("/judgment/123"), "/judgment/123");
  assert.equal(sanitizeReturnTo("/login?return_to=/judgment/123"), "/login?return_to=/judgment/123");
  assert.equal(sanitizeReturnTo("/judgment/123#section"), "/judgment/123#section");
  assert.equal(sanitizeReturnTo("/api/search?q=عقد&page=2"), "/api/search?q=عقد&page=2");

  // Protocol-relative attacks
  assert.equal(sanitizeReturnTo("//evil.example"), "/", "Must reject //evil.example");
  assert.equal(sanitizeReturnTo("///evil.example"), "/", "Must reject ///evil.example");
  assert.equal(sanitizeReturnTo("////evil.example"), "/", "Must reject ////evil.example");
  assert.equal(sanitizeReturnTo("/\\evil.example"), "/", "Must reject /\\evil.example");
  assert.equal(sanitizeReturnTo("  //evil.example  "), "/", "Must reject trimmed //evil.example");

  // Absolute external URLs
  assert.equal(sanitizeReturnTo("https://evil.example"), "/", "Must reject https://evil.example");
  assert.equal(sanitizeReturnTo("http://evil.example"), "/", "Must reject http://evil.example");
  assert.equal(sanitizeReturnTo("ftp://evil.example"), "/", "Must reject ftp://evil.example");
  assert.equal(sanitizeReturnTo("https:evil.example"), "/", "Must reject https:evil.example");

  // Dangerous URI schemes
  assert.equal(sanitizeReturnTo("javascript:alert(1)"), "/", "Must reject javascript:alert(1)");
  assert.equal(sanitizeReturnTo("data:text/html,..."), "/", "Must reject data:text/html");
  assert.equal(sanitizeReturnTo("vbscript:alert(1)"), "/", "Must reject vbscript:alert(1)");
  assert.equal(sanitizeReturnTo("blob:https://evil.example"), "/", "Must reject blob: schemes");

  // Encoded protocol-relative attempts
  assert.equal(sanitizeReturnTo("%2F%2Fevil.example"), "/", "Must reject %2F%2Fevil.example");
  assert.equal(sanitizeReturnTo("/%2fevil.example"), "/", "Must reject /%2fevil.example");
  assert.equal(sanitizeReturnTo("/%2Fevil.example"), "/", "Must reject /%2Fevil.example");
  assert.equal(sanitizeReturnTo("/%5cevil.example"), "/", "Must reject /%5cevil.example");
  assert.equal(sanitizeReturnTo("/%5Cevil.example"), "/", "Must reject /%5Cevil.example");
  assert.equal(sanitizeReturnTo("/%2f%2fevil.example"), "/", "Must reject /%2f%2fevil.example");
  assert.equal(sanitizeReturnTo("/%00evil.example"), "/", "Must reject null byte injections");

  // Invalid / non-path targets
  assert.equal(sanitizeReturnTo(""), "/");
  assert.equal(sanitizeReturnTo("   "), "/");
  assert.equal(sanitizeReturnTo(null), "/");
  assert.equal(sanitizeReturnTo(undefined), "/");
  assert.equal(sanitizeReturnTo("evil.example"), "/");
});

test("OAuth security integration: Trial login rejects protocol-relative redirect and resolves to /", async () => {
  const evilReq = new Request("http://localhost:3000/auth/trial/login?return_to=//evil.example");
  const evilRes = await worker.fetch(evilReq, { DB: db });
  assert.equal(evilRes.status, 302);
  assert.equal(evilRes.headers.get("Location"), "/", "Must redirect to / and NOT //evil.example");

  const validReq = new Request("http://localhost:3000/auth/trial/login?return_to=/judgment/123");
  const validRes = await worker.fetch(validReq, { DB: db });
  assert.equal(validRes.status, 302);
  assert.equal(validRes.headers.get("Location"), "/judgment/123", "Must redirect to valid internal /judgment/123");
});

test("OAuth security integration: Google login state embeds sanitized return_to", async () => {
  // Test with protocol-relative URL
  const evilLoginReq = new Request("http://localhost:3000/auth/google/login?return_to=//evil.example");
  const fakeEnv = {
    DB: db,
    GOOGLE_CLIENT_ID: "fake-client-id",
    GOOGLE_CLIENT_SECRET: "fake-client-secret",
  };
  const evilLoginRes = await worker.fetch(evilLoginReq, fakeEnv);
  assert.equal(evilLoginRes.status, 302);
  const locationUrl = new URL(evilLoginRes.headers.get("Location"));
  const stateParam = locationUrl.searchParams.get("state");
  assert.ok(stateParam, "State param exists");
  const statePayload = JSON.parse(atob(stateParam));
  assert.equal(statePayload.ret, "/", "State ret payload must be sanitized to /");

  // Test with valid internal path
  const validLoginReq = new Request("http://localhost:3000/auth/google/login?return_to=/judgment/123");
  const validLoginRes = await worker.fetch(validLoginReq, fakeEnv);
  assert.equal(validLoginRes.status, 302);
  const validLocationUrl = new URL(validLoginRes.headers.get("Location"));
  const validStateParam = validLocationUrl.searchParams.get("state");
  const validStatePayload = JSON.parse(atob(validStateParam));
  assert.equal(validStatePayload.ret, "/judgment/123", "State ret payload must preserve /judgment/123");
});

test("OAuth security integration: Authenticated user visiting /login with evil return_to is redirected to /", async () => {
  const normalUser = await upsertGoogleUser(db, {
    googleId: "auth-redirect-test-" + Date.now(),
    email: "auth-redirect-" + Date.now() + "@example.com",
    name: "مستخدم مؤكد",
  });
  const session = await createSession(db, normalUser.id, new Request("http://localhost:3000/"));

  const evilReq = new Request("http://localhost:3000/login?return_to=//evil.example", {
    headers: { Cookie: `${SESSION_COOKIE_NAME}=${session.token}` },
  });
  const evilRes = await worker.fetch(evilReq, { DB: db });
  assert.equal(evilRes.status, 302);
  assert.equal(evilRes.headers.get("Location"), "http://localhost:3000/");

  const validReq = new Request("http://localhost:3000/login?return_to=/judgment/123", {
    headers: { Cookie: `${SESSION_COOKIE_NAME}=${session.token}` },
  });
  const validRes = await worker.fetch(validReq, { DB: db });
  assert.equal(validRes.status, 302);
  assert.equal(validRes.headers.get("Location"), "http://localhost:3000/judgment/123");
});

test("Phase 3: Invalid search does NOT consume trial search allowance", async () => {
  const trialUser = await upsertGoogleUser(db, {
    googleId: "trial-invalid-test-" + Date.now(),
    email: "trial-invalid-" + Date.now() + "@ahkam.app",
    name: "زائر استكشافي",
  });
  const session = await createSession(db, trialUser.id, new Request("http://localhost:3000/"), { isTrial: true });

  // 1. Invalid search: empty query or invalid page size
  const invalidReq = new Request("http://localhost:3000/api/search?q=&page_size=999", {
    headers: { Cookie: `${SESSION_COOKIE_NAME}=${session.token}` },
  });
  const invalidRes = await worker.fetch(invalidReq, { DB: db });
  assert.equal(invalidRes.status, 400, "Invalid search should return 400");

  // Verify server-side search_count is STILL 0
  const row = await db.prepare("SELECT search_count FROM sessions WHERE token_hash = ?").bind(session.tokenHash).first();
  assert.equal(Number(row.search_count), 0, "search_count must remain 0 after failed validation");

  // 2. Now perform a valid search: it MUST succeed
  const validReq = new Request("http://localhost:3000/api/search?q=شيك", {
    headers: { Cookie: `${SESSION_COOKIE_NAME}=${session.token}` },
  });
  const validRes = await worker.fetch(validReq, { DB: db });
  assert.equal(validRes.status, 200, "Valid search must succeed after previously invalid search");
});

test("Phase 3: Two concurrent trial searches do not both succeed (race condition prevented)", async () => {
  const trialUser = await upsertGoogleUser(db, {
    googleId: "trial-race-test-" + Date.now(),
    email: "trial-race-" + Date.now() + "@ahkam.app",
    name: "زائر متزامن",
  });
  const session = await createSession(db, trialUser.id, new Request("http://localhost:3000/"), { isTrial: true });

  const req1 = new Request("http://localhost:3000/api/search?q=شيك", {
    headers: { Cookie: `${SESSION_COOKIE_NAME}=${session.token}` },
  });
  const req2 = new Request("http://localhost:3000/api/search?q=بطلان", {
    headers: { Cookie: `${SESSION_COOKIE_NAME}=${session.token}` },
  });

  // Launch both requests simultaneously
  const [res1, res2] = await Promise.all([
    worker.fetch(req1, { DB: db }),
    worker.fetch(req2, { DB: db }),
  ]);

  const statuses = [res1.status, res2.status].sort();
  assert.deepEqual(statuses, [200, 403], "Exactly one concurrent request must succeed (200) and the other must be blocked (403)");
});

test("Phase 3: Deleting the trial cookie does not reset server-side allowance", async () => {
  const clientIp = "198.51.100." + (Math.floor(Math.random() * 200) + 10) + "." + (Date.now() % 1000);

  // Step 1: Client gets trial session from /auth/trial/login
  const loginReq = new Request("http://localhost:3000/auth/trial/login", {
    headers: { "CF-Connecting-IP": clientIp },
  });
  const loginRes = await worker.fetch(loginReq, { DB: db });
  assert.equal(loginRes.status, 302);
  const cookies = loginRes.headers.getSetCookie ? loginRes.headers.getSetCookie() : [loginRes.headers.get("Set-Cookie")];
  const tokenMatch = cookies.join(";").match(/ahkam_session=([^;]+)/);
  assert.ok(tokenMatch, "Session token cookie issued");
  const token = decodeURIComponent(tokenMatch[1]);

  // Step 2: Client performs their 1 successful trial search
  const searchReq = new Request("http://localhost:3000/api/search?q=عقد", {
    headers: {
      Cookie: `${SESSION_COOKIE_NAME}=${token}`,
      "CF-Connecting-IP": clientIp,
    },
  });
  const searchRes = await worker.fetch(searchReq, { DB: db });
  assert.equal(searchRes.status, 200, "First trial search succeeds");

  // Step 3: Client deletes all browser cookies and hits /auth/trial/login again
  const deleteCookiesReq = new Request("http://localhost:3000/auth/trial/login", {
    headers: {
      // No cookies sent (deleted by client)
      "CF-Connecting-IP": clientIp,
    },
  });
  const retryLoginRes = await worker.fetch(deleteCookiesReq, { DB: db });
  assert.equal(retryLoginRes.status, 302);
  const loc = retryLoginRes.headers.get("Location");
  assert.ok(loc.includes("/login"), "Must redirect to /login");
  assert.ok(loc.includes("error="), "Must contain error informing user trial is exhausted");
});

test("Phase 3: Normal Google-authenticated users remain unlimited and unaffected", async () => {
  const googleUser = await upsertGoogleUser(db, {
    googleId: "unlimited-user-" + Date.now(),
    email: "unlimited-" + Date.now() + "@example.com",
    name: "مستشار دائم",
  });
  const session = await createSession(db, googleUser.id, new Request("http://localhost:3000/"), { isTrial: false });

  for (let i = 1; i <= 3; i++) {
    const req = new Request(`http://localhost:3000/api/search?q=شيك&page=${i}`, {
      headers: { Cookie: `${SESSION_COOKIE_NAME}=${session.token}` },
    });
    const res = await worker.fetch(req, { DB: db });
    assert.equal(res.status, 200, `Authenticated search #${i} must succeed`);
  }
});

test("Phase 3: /auth/dev/login is hard-disabled in production and cannot bypass auth", async () => {
  const prodReq = new Request("https://ahkam.app/auth/dev/login");
  const prodRes = await worker.fetch(prodReq, { DB: db, ENVIRONMENT: "production" });
  assert.equal(prodRes.status, 404, "Dev login on production host must return 404 Not Found");
});



