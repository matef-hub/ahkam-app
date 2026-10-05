import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import {
  renderHomePageHtml,
  renderJudgmentPageHtml,
  renderCourtLandingPageHtml,
  SHARED_STYLES
} from "../src/ui/templates.js";

function assertValidScripts(html, contextName) {
  const scriptRegex = /<script(?![^>]*ld\+json)[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  let count = 0;
  while ((match = scriptRegex.exec(html)) !== null) {
    count++;
    const code = match[1];
    assert.doesNotThrow(() => {
      new vm.Script(code);
    }, `${contextName} script #${count} must not throw a SyntaxError`);
  }
  assert.ok(count > 0, `${contextName} should contain at least one client script`);
}

test("UI templates modularization and client-side script syntax validity", async (t) => {
  await t.test("SHARED_STYLES is defined and non-empty", () => {
    assert.ok(typeof SHARED_STYLES === "string");
    assert.ok(SHARED_STYLES.includes(":root"));
  });

  await t.test("renderHomePageHtml produces valid HTML and syntactically valid client script", () => {
    const html = renderHomePageHtml({
      judgments: 120,
      civilCount: 50,
      criminalCount: 40,
      constitutionalCount: 20,
      supremeAdminCount: 5,
      adminCourtCount: 5
    });

    assert.ok(html.includes("<!DOCTYPE html>"));
    assert.ok(html.includes("موسوعة الأحكام القضائية المصرية"));
    assert.ok(html.includes("id=\"savedPanel\""));
    assertValidScripts(html, "renderHomePageHtml");
  });

  await t.test("renderJudgmentPageHtml produces valid HTML and script", () => {
    const sampleData = {
      master: {
        Master_ID: 101,
        Case_No: 15,
        Case_Year: 45,
        Case_Date: "2020-05-15",
        Court_Name: "محكمة النقض - الدائرة المدنية",
        Office_Year: "71",
        Master_Text: "وقائع دعوى تجريبية لاختبار العرض"
      },
      principles: [
        { Mogz_Text: "مبدأ قانوني نموذجي يقرر حجية الأوراق العرفية" }
      ],
      texts: [
        { Fakra_No: 0, Fakra_Text: "الهيئة الرئاسية وأسماء السادة المستشارين" },
        { Fakra_No: 1, Fakra_Text: "من حيث إن الطعن استوفى أوضاعه الشكلية" }
      ],
      related: []
    };

    const html = renderJudgmentPageHtml(sampleData);
    assert.ok(html.includes("الطعن رقم 15"));
    assertValidScripts(html, "renderJudgmentPageHtml");
  });

  await t.test("renderCourtLandingPageHtml produces valid HTML and script", () => {
    const sampleCourt = {
      name: "محكمة النقض - الدائرة المدنية",
      shortName: "النقض المدني",
      slug: "cassation-civil",
      description: "أحكام وسوابق الدائرة المدنية والتجارية",
      badge: "أحكام وسوابق",
      totalJudgments: 40,
      totalPrinciples: 80,
      courtIds: [1, 29],
      judgments: [],
      principles: [],
      allCourts: []
    };

    const html = renderCourtLandingPageHtml(sampleCourt);
    assert.ok(html.includes("النقض المدني"));
    assertValidScripts(html, "renderCourtLandingPageHtml");
  });
});
