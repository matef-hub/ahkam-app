import { escapeHtml, safeJsonForHtml } from "../lib/arabic.js";
import { SHARED_STYLES } from "./styles.js";
import { renderTopDevBar, renderHeader, renderSiteFooter, toIsoDate, FONT_LINKS } from "./components.js";

export function renderJudgmentPageHtml(data, user = null) {
  const master = data.master;
  const courtName = master.Court_Name || "المحكمة غير محددة";
  const titleRaw = `حكم ${courtName} - الطعن رقم ${master.Case_No} لسنة ${master.Case_Year} قضائية | موسوعة الأحكام القضائية المصرية`;
  const canonical = `https://ahkam.app/judgment/${master.Master_ID}`;
  const sessionPart = master.Case_Date ? ` بجلسة ${master.Case_Date}` : "";
  const descriptionRaw = `حكم قضائي صادر عن ${courtName}${sessionPart} في الطعن رقم ${master.Case_No} لسنة ${master.Case_Year} قضائية. يتضمن أسباب ومنطوق الحكم والمبادئ القانونية المستخلصة.`;
  const title = escapeHtml(titleRaw);
  const description = escapeHtml(descriptionRaw);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": titleRaw,
    "headline": `الطعن رقم ${master.Case_No} لسنة ${master.Case_Year} قضائية`,
    "description": descriptionRaw,
    "url": canonical,
    "datePublished": toIsoDate(master.Case_Date),
    "isPartOf": {
      "@type": "WebSite",
      "name": "موسوعة الأحكام القضائية المصرية",
      "url": "https://ahkam.app/"
    }
  };
  const jsonLdHtml = safeJsonForHtml(jsonLd);

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:type" content="article">
<meta property="og:url" content="${canonical}">
<meta property="og:site_name" content="موسوعة الأحكام القضائية المصرية">
<meta property="og:locale" content="ar_EG">
<meta name="twitter:card" content="summary">
<meta name="theme-color" content="#0f2a4a">

<script type="application/ld+json">
${jsonLdHtml}
</script>

<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="alternate icon" href="/favicon.ico">
${FONT_LINKS}

<style>${SHARED_STYLES}</style>
</head>
<body>

${renderTopDevBar()}

<div class="container">
  ${renderHeader({ badgeId: "detailSavedBadge", isHome: false, showSaved: Boolean(user), user })}

  <main>
    <a href="/" class="back-btn">
      <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>
      <span>الرجوع إلى صفحة البحث الرئيسية</span>
    </a>

    <article class="full-judgment-view">
      <header class="full-judgment-header">
        <h1>الطعن رقم ${escapeHtml(master.Case_No)} لسنة ${escapeHtml(master.Case_Year)} قضائية</h1>
        <div class="badges-row">
          <span class="law-badge badge-court">${escapeHtml(courtName)}</span>
          <span class="law-badge badge-gold">${escapeHtml(master.Case_Date || "تاريخ الجلسة غير مدون")}</span>
          ${master.Office_Year ? `<span class="law-badge badge-gray">سنة المكتب الفني: ${escapeHtml(master.Office_Year)}</span>` : ""}
        </div>

        <div class="judgment-toolbar">
          <button class="tool-btn" onclick="copyJudgmentCitation()">📋 نسخ الاستشهاد القانوني</button>
          <button class="tool-btn" onclick="copyJudgmentLink()">🔗 نسخ الرابط</button>
          ${user ? `<button class="tool-btn" id="btnSaveFull" onclick="toggleSaveFullJudgment()">☆ حفظ في المفضلة</button>` : ""}
          <button class="tool-btn" onclick="window.print()">🖨️ طباعة الحكم</button>
        </div>

        <div style="background:var(--surface-muted); border:1px solid var(--border); padding:10px 16px; border-radius:6px; margin-top:14px; font-size:0.82rem; color:var(--text-muted); display:flex; gap:16px; flex-wrap:wrap;">
          <span>📁 المصدر الرسمي: <strong>المكتب الفني لمحكمة النقض ومجلس الدولة</strong></span>
          <span>🕒 حالة الفهرسة: <strong>نص كامل معتمد ومفهرس</strong></span>
          <span>🔢 المعرف الرقمي: <strong>#${master.Master_ID}</strong></span>
        </div>
      </header>

      ${master.Master_Text ? `
      <div style="background:var(--surface-muted); padding:16px 20px; border-radius:8px; margin-bottom:20px; font-weight:600; color:var(--text-sub); text-align:justify;">
        <strong style="color:var(--primary); display:block; margin-bottom:6px;">ملخص / وقائع الدعوى:</strong>
        ${escapeHtml(master.Master_Text)}
      </div>
      ` : ""}

      ${data.is_preview ? `
      <section class="preview-cta-card" style="background: linear-gradient(135deg, rgba(15,23,42,0.03), rgba(180,83,9,0.06)); border: 1.5px dashed var(--gold); border-radius: 12px; padding: 28px 24px; text-align: center; margin: 32px 0;">
        <div style="font-size: 2.2rem; margin-bottom: 8px;">🔒</div>
        <h3 style="color: var(--primary); font-size: 1.25rem; font-weight: 800; margin-bottom: 8px;">
          محتوى محمي — النص الكامل وأسباب ومنطوق الحكم
        </h3>
        <p style="color: var(--text-muted); font-size: 0.95rem; max-width: 580px; margin: 0 auto 20px; line-height: 1.7;">
          أنت تشاهد المعاينة العامة المعتمدة للأرشفة القانونية. لعرض منطوق الحكم الكامل وحيثياته التفصيلية ومبادئه المستخلصة بالكامل، تفضل بالانضمام أو ترقية حسابك.
        </p>
        <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
          ${user ? `
            <a href="/?upgrade=1" class="search-btn" style="text-decoration: none; padding: 10px 24px; font-weight: 700; border-radius: 8px; display: inline-flex; align-items: center; gap: 6px;">
              <span>⭐ ترقية الحساب لعرض الحكم كاملاً</span>
            </a>
          ` : `
            <a href="/login?return_to=${encodeURIComponent("/judgment/" + master.Master_ID)}" class="search-btn" style="text-decoration: none; padding: 10px 24px; font-weight: 700; border-radius: 8px; display: inline-flex; align-items: center; gap: 6px;">
              <span>🔑 سجل الدخول لعرض الحكم كاملاً</span>
            </a>
          `}
        </div>
      </section>
      ` : `
      ${data.principles && data.principles.length ? `
      <h2 style="color:var(--primary); font-size:1.25rem; margin: 24px 0 10px;">المبادئ القانونية المستخلصة</h2>
      <div class="principles-wrapper">
        ${data.principles.map(p => `
          <div class="principle-box" style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px;">
            <span>⚖️ ${escapeHtml(p.Mogz_Text)}</span>
            <button type="button" class="tool-btn" style="flex-shrink:0; font-size:0.8rem;" onclick="copyPrinciple(this)">نسخ المبدأ</button>
          </div>
        `).join("")}
      </div>
      ` : ""}

      <h2 style="color:var(--primary); font-size:1.25rem; margin: 28px 0 12px;">نص وأسباب ومنطوق الحكم</h2>
      ${data.texts.map(t => {
        let label = `فقرة رقم ${t.Fakra_No}`;
        let badgeClass = "badge-gray";
        if (t.Fakra_No === 0) {
          label = "🏛️ هيئة المحكمة والديباجة";
          badgeClass = "badge-blue";
        } else if (t.Fakra_No === -2) {
          label = "📜 وقائع وأسباب ومنطوق الحكم";
          badgeClass = "badge-gold";
        } else if (t.Fakra_No === -50) {
          label = "⚖️ منطوق الحكم المستخلص";
          badgeClass = "badge-court";
        } else if (t.Fakra_No > 0) {
          label = `📌 المبدأ / الفقرة (${t.Fakra_No})`;
        }
        return `
        <section class="fakra-row">
          <div class="fakra-idx"><span class="law-badge ${badgeClass}">${escapeHtml(label)}</span></div>
          <div style="line-height:2.1; margin-top:8px; text-align: justify;">${escapeHtml(t.Fakra_Text)}</div>
        </section>`;
      }).join("")}
      `}

      ${data.related && data.related.length ? (() => {
        const isVerified = data.relation_mode === "verified_relation" || data.related.some(r => Boolean(r.Relation_Type));
        const headingText = isVerified ? "أحكام وسوابق ذات صلة موثقة" : "أحدث أحكام من المحكمة نفسها";
        const relationLabels = {
          same_case: "الطعن ذاته / مرتبط",
          same_principle: "المبدأ القانوني ذاته",
          cites: "يستشهد به",
          cited_by: "مستشهد به في هذا الحكم",
          editorial: "صلة قانونية وثيقة",
        };

        return `
      <section aria-labelledby="related-judgments-heading">
        <h2 id="related-judgments-heading" style="color:var(--primary); font-size:1.25rem; margin:28px 0 12px;">${escapeHtml(headingText)}</h2>
        <div class="principles-wrapper">
          ${data.related.map(item => {
            const relType = item.Relation_Type ? relationLabels[item.Relation_Type] || item.Relation_Type : null;
            const badgeHtml = relType ? `<span class="law-badge badge-gold" style="margin-inline-end:8px; font-size:0.75rem;">${escapeHtml(relType)}</span>` : "";
            return `<a class="principle-box" href="/judgment/${escapeHtml(item.Master_ID)}">${badgeHtml}${escapeHtml(item.Court_Name || "المحكمة")} — الطعن رقم ${escapeHtml(item.Case_No)} لسنة ${escapeHtml(item.Case_Year)}${item.Case_Date ? ` — ${escapeHtml(item.Case_Date)}` : ""}</a>`;
          }).join("")}
        </div>
      </section>`;
      })() : ""}
    </article>
  </main>
</div>

${renderSiteFooter()}

<script>
const isUserLoggedIn = ${Boolean(user)};
const judgmentData = ${safeJsonForHtml({
  Master_ID: master.Master_ID,
  Case_No: master.Case_No,
  Case_Year: master.Case_Year,
  Case_Date: master.Case_Date || "",
  Court_Name: courtName
})};

function showToast(msg) {
  let toast = document.getElementById("customToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "customToast";
    toast.className = "toast-msg";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3200);
}

async function copyToClipboard(text, message) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(message);
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.focus();
    area.select();
    try { document.execCommand("copy"); showToast(message); }
    catch { showToast("تعذر النسخ التلقائي."); }
    area.remove();
  }
}

function copyJudgmentCitation() {
  const m = judgmentData;
  const citation = m.Court_Name + " - الطعن رقم " + m.Case_No + " لسنة " + m.Case_Year + " قضائية" + (m.Case_Date ? " - جلسة " + m.Case_Date : "");
  copyToClipboard(citation, "تم نسخ الاستشهاد القانوني");
}

function copyJudgmentLink() {
  copyToClipboard(new URL("/judgment/" + judgmentData.Master_ID, window.location.origin).href, "تم نسخ رابط الحكم");
}

function copyPrinciple(btn) {
  const text = btn.previousElementSibling?.textContent?.replace(/^⚖️\\s*/, "") || "";
  copyToClipboard(text, "تم نسخ المبدأ القانوني بنجاح");
}

function updateDetailSavedBadge() {
  try {
    const list = JSON.parse(localStorage.getItem("ahkam_saved_judgments") || "[]");
    const el = document.getElementById("detailSavedBadge");
    if (el) el.textContent = String(Array.isArray(list) ? list.length : 0);
  } catch {}
}

function toggleSaveFullJudgment() {
  if (!isUserLoggedIn) {
    showToast("يرجى تسجيل الدخول بحساب Google لحفظ الأحكام في المفضلة");
    return;
  }
  const m = judgmentData;
  const idNum = Number(m.Master_ID);
  if (!idNum) return;
  let saved = [];
  try { saved = JSON.parse(localStorage.getItem("ahkam_saved_judgments") || "[]"); } catch {}
  if (!Array.isArray(saved)) saved = [];
  const idx = saved.findIndex(item => Number(item.masterId) === idNum);
  const btn = document.getElementById("btnSaveFull");
  if (idx >= 0) {
    saved.splice(idx, 1);
    if (btn) {
      btn.textContent = "☆ حفظ في المفضلة";
      btn.style.color = "";
      btn.style.borderColor = "";
      btn.style.background = "";
      btn.style.fontWeight = "";
    }
    showToast("تم إزالة الحكم من المفضلة");
    fetch("/api/user/saved?id=" + idNum, { method: "DELETE" }).catch(() => {});
  } else {
    const item = {
      masterId: idNum,
      courtName: m.Court_Name || "محكمة النقض",
      caseNo: String(m.Case_No || ""),
      caseYear: String(m.Case_Year || ""),
      caseDate: m.Case_Date || ""
    };
    saved.unshift(item);
    if (btn) {
      btn.textContent = "⭐ محفوظ في المفضلة";
      btn.style.color = "#b45309";
      btn.style.borderColor = "#f59e0b";
      btn.style.background = "#fffbeb";
      btn.style.fontWeight = "700";
    }
    showToast("تم حفظ الحكم في المفضلة ⭐");
    fetch("/api/user/saved", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    }).catch(() => {});
  }
  localStorage.setItem("ahkam_saved_judgments", JSON.stringify(saved));
  updateDetailSavedBadge();
}

document.addEventListener("DOMContentLoaded", () => {
  updateDetailSavedBadge();
  let saved = [];
  try { saved = JSON.parse(localStorage.getItem("ahkam_saved_judgments") || "[]"); } catch {}
  const isSaved = Array.isArray(saved) && saved.some(item => Number(item.masterId) === Number(judgmentData.Master_ID));
  const btn = document.getElementById("btnSaveFull");
  if (btn && isSaved) {
    btn.textContent = "⭐ محفوظ في المفضلة";
    btn.style.color = "#b45309";
    btn.style.borderColor = "#f59e0b";
    btn.style.background = "#fffbeb";
    btn.style.fontWeight = "700";
  }
});
</script>
</body>
</html>`;
}
