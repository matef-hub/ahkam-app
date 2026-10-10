import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import maintenanceWorker from "../ahkam-maintenance-worker/src/index.js";

test("Standalone Maintenance Worker: File and Configuration Auditing", () => {
  const wranglerPath = path.resolve("./ahkam-maintenance-worker/wrangler.toml");
  assert.ok(fs.existsSync(wranglerPath), "wrangler.toml exists in standalone folder");

  const wranglerContent = fs.readFileSync(wranglerPath, "utf8");
  assert.ok(wranglerContent.includes('name = "ahkam-maintenance"'), "Worker name is distinct");
  assert.ok(!wranglerContent.includes("d1_databases"), "CRITICAL: No d1_databases binding exists in wrangler.toml");
  assert.ok(!wranglerContent.includes("ahkam.app"), "CRITICAL: No custom domain route set yet");
  assert.ok(!wranglerContent.includes("ateflaw.com"), "CRITICAL: No reference to ateflaw.com");
  assert.ok(!wranglerContent.includes("legal-api"), "CRITICAL: Does not target or overwrite legal-api");
  assert.ok(!wranglerContent.includes("workers_dev = false"), "workers_dev is enabled for safe staging");
});

test("Standalone Maintenance Worker: Zero-D1 and Zero-Application Dependency Isolation", () => {
  const codePath = path.resolve("./ahkam-maintenance-worker/src/index.js");
  const codeContent = fs.readFileSync(codePath, "utf8");

  // Verify zero imports from existing application or databases
  assert.ok(!codeContent.includes("import"), "Worker does not import external application modules");
  assert.ok(!codeContent.includes(".DB"), "Worker does not touch env.DB");
  assert.ok(!codeContent.includes("d1"), "Worker does not reference d1");
  assert.ok(!codeContent.includes("sqlite"), "Worker does not reference sqlite");
  assert.ok(!codeContent.includes("SELECT"), "Worker has zero SQL queries");
});

test("Standalone Maintenance Worker: Runtime Behavior Verification across routes", async () => {
  // 1. Root route returns 503 and Arabic HTML
  const reqHome = new Request("https://ahkam-maintenance.workers.dev/");
  const resHome = await maintenanceWorker.fetch(reqHome);
  assert.equal(resHome.status, 503, "Home route returns HTTP 503");
  assert.equal(resHome.headers.get("Retry-After"), "3600", "Retry-After header present");
  assert.equal(resHome.headers.get("Cache-Control"), "no-store, no-cache, must-revalidate", "Cache-Control prevents caching");
  assert.ok(resHome.headers.get("Content-Type").includes("text/html"), "HTML content type");
  
  const html = await resHome.text();
  assert.ok(html.includes("صيانة وتحديث مجدول للنظام"), "Arabic maintenance badge rendered");
  assert.ok(html.includes("نعمل على تحسين وتطوير منصة أحكام"), "Arabic heading rendered");
  assert.ok(html.includes("support@ahkam.app"), "Contact email included");
  assert.ok(html.includes("window.location.reload()"), "Reload button performs page refresh only");

  // 2. Arbitrary deep judgment route returns 503 maintenance page
  const reqJudgment = new Request("https://ahkam-maintenance.workers.dev/judgment/298231");
  const resJudgment = await maintenanceWorker.fetch(reqJudgment);
  assert.equal(resJudgment.status, 503, "Judgment route is caught by maintenance 503");
  const judgmentHtml = await resJudgment.text();
  assert.ok(judgmentHtml.includes("صيانة وتحديث مجدول للنظام"));

  // 3. API endpoints return 503 JSON without touching any backend
  const reqApi = new Request("https://ahkam-maintenance.workers.dev/api/search?q=test");
  const resApi = await maintenanceWorker.fetch(reqApi);
  assert.equal(resApi.status, 503, "API route returns HTTP 503");
  assert.equal(resApi.headers.get("Retry-After"), "3600");
  const apiJson = await resApi.json();
  assert.equal(apiJson.error, "service_unavailable");

  // 4. Favicon / Logo assets return 200 SVG for crisp branding
  const reqFavicon = new Request("https://ahkam-maintenance.workers.dev/favicon.svg");
  const resFavicon = await maintenanceWorker.fetch(reqFavicon);
  assert.equal(resFavicon.status, 200, "Favicon returns 200");
  assert.equal(resFavicon.headers.get("Content-Type"), "image/svg+xml; charset=utf-8");
  const svg = await resFavicon.text();
  assert.ok(svg.includes("<svg"), "Valid SVG icon returned");
});
