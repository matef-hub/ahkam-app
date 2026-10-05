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

