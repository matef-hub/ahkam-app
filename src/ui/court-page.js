import { escapeHtml, safeJsonForHtml } from "../lib/arabic.js";
import { SHARED_STYLES } from "./styles.js";
import { renderTopDevBar, renderHeader, renderSiteFooter, FONT_LINKS } from "./components.js";

export function renderCourtLandingPageHtml(courtData, user = null) {
  const title = escapeHtml(`${courtData.name} | موسوعة الأحكام القضائية المصرية`);
  const description = escapeHtml(courtData.description);
  const canonical = `https://ahkam.app/courts/${courtData.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": courtData.name,
    "description": courtData.description,
    "url": canonical,
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "الرئيسية", "item": "https://ahkam.app/" },
        { "@type": "ListItem", "position": 2, "name": "المحاكم والدوائر القضائية", "item": "https://ahkam.app/" },
        { "@type": "ListItem", "position": 3, "name": courtData.shortName, "item": canonical }
      ]
    },
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
<meta property="og:type" content="website">
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

<style>${SHARED_STYLES}
.court-hero-card {
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 30px 26px;
  box-shadow: var(--shadow-sm);
  margin-bottom: 24px;
}
.court-hero-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 12px;
}
.court-hero-title {
  font-size: 1.45rem;
  font-weight: 900;
  color: var(--primary);
  margin: 0;
}
.court-hero-desc {
  font-size: 0.95rem;
  line-height: 1.9;
  color: var(--text-sub);
  margin-bottom: 18px;
}
.court-stats-pills {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.court-stat-pill {
  background: var(--surface-muted);
  border: 1px solid var(--border);
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--primary);
}
.court-direct-search {
  margin: 20px 0 6px;
  display: flex;
  gap: 10px;
}
.court-direct-search input {
  flex: 1;
  padding: 12px 16px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: 0.95rem;
}
.court-direct-search button {
  background: var(--primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  padding: 0 22px;
  font-family: inherit;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
}
.court-direct-search button:hover {
  background: var(--primary-light);
}
.other-courts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-top: 14px;
}
.other-court-card {
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 14px 16px;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.other-court-card:hover {
  border-color: var(--primary-light);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(15, 42, 74, 0.08);
}
.other-court-card strong {
  color: var(--primary);
  font-size: 0.95rem;
  margin-bottom: 6px;
}
.other-court-card span {
  font-size: 0.78rem;
  color: var(--text-muted);
}
</style>
</head>
<body>

${renderTopDevBar()}

<div class="container">
  ${renderHeader({ badgeId: "courtSavedBadge", isHome: false, showSaved: Boolean(user), user })}

  <nav class="back-btn-row" style="margin-bottom: 16px;">
    <a href="/" class="back-btn">
      <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>
      <span>الرجوع إلى صفحة البحث العامة</span>
    </a>
  </nav>

  <main>
    <article class="court-hero-card">
      <div class="court-hero-header">
        <span style="font-size: 2rem;">🏛️</span>
        <h1 class="court-hero-title">${escapeHtml(courtData.name)}</h1>
      </div>
      <p class="court-hero-desc">${escapeHtml(courtData.description)}</p>
      
      <div class="court-stats-pills">
        <div class="court-stat-pill">🏛️ إجمالي الأحكام المفهرسة: ${escapeHtml(courtData.totalJudgments.toLocaleString("ar-EG"))}</div>
        <div class="court-stat-pill">📜 المبادئ المستخلصة: ${escapeHtml(courtData.totalPrinciples.toLocaleString("ar-EG"))}</div>
        <div class="court-stat-pill">${escapeHtml(courtData.badge)}</div>
      </div>

      <form action="/" method="GET" class="court-direct-search" role="search" aria-label="بحث في أحكام هذه المحكمة">
        <input type="hidden" name="court" value="${escapeHtml(courtData.courtIds.join(","))}">
        <input type="text" name="q" placeholder="ابحث في أحكام ومبادئ ${escapeHtml(courtData.shortName)}..." required minlength="2">
        <button type="submit">بحث مخصص</button>
      </form>
    </article>

    <section aria-labelledby="judgments-heading" style="margin-bottom: 32px;">
      <h2 id="judgments-heading" style="color:var(--primary); font-size:1.3rem; margin-bottom:14px; font-weight:800;">
        أحدث الأحكام القضائية الصادرة عن ${escapeHtml(courtData.shortName)}
      </h2>
      ${courtData.judgments.length ? courtData.judgments.map(item => `
        <article class="judgment-card">
          <div class="badges-row">
            <span class="law-badge badge-court">${escapeHtml(item.Court_Name || courtData.shortName)}</span>
            <span class="law-badge badge-gold">طعن رقم ${escapeHtml(item.Case_No)}</span>
            <span class="law-badge badge-blue">لسنة ${escapeHtml(item.Case_Year)} قضائية</span>
            ${item.Case_Date ? `<span class="law-badge badge-gray">${escapeHtml(item.Case_Date)}</span>` : ""}
          </div>
          <h3 class="card-title">
            <a href="/judgment/${item.Master_ID}">
              حكم في الطعن رقم ${escapeHtml(item.Case_No)} لسنة ${escapeHtml(item.Case_Year)} قضائية
            </a>
          </h3>
          ${item.Master_Text ? `
          <div class="match-snippet-box">
            <span class="fakra-type-tag">موجز الدعوى / المنطوق</span>
            <div>${escapeHtml(item.Master_Text.slice(0, 260))}${item.Master_Text.length > 260 ? "..." : ""}</div>
          </div>` : ""}
          <div class="card-actions">
            <a href="/judgment/${item.Master_ID}" class="open-btn">
              <span>فتح ملف الحكم كاملاً</span>
              <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"/></svg>
            </a>
          </div>
        </article>
      `).join("") : `<div class="empty-state">لا توجد أحكام مدرجة حالياً لهذه المحكمة.</div>`}
    </section>

    ${courtData.principles.length ? `
    <section aria-labelledby="principles-heading" style="margin-bottom: 32px;">
      <h2 id="principles-heading" style="color:var(--primary); font-size:1.3rem; margin-bottom:14px; font-weight:800;">
        أبرز المبادئ القانونية المستخلصة
      </h2>
      <div class="principles-wrapper">
        ${courtData.principles.map(p => `
          <div class="principle-box" style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px;">
            <span>⚖️ ${escapeHtml(p.Mogz_Text)}</span>
            <button type="button" class="tool-btn" style="flex-shrink:0;" onclick="copyPrincipleDirect(this)">نسخ المبدأ</button>
          </div>
        `).join("")}
      </div>
    </section>` : ""}

    <section aria-labelledby="other-courts-heading" style="margin-top: 36px;">
      <h2 id="other-courts-heading" style="color:var(--primary); font-size:1.15rem; margin-bottom:12px; font-weight:800;">
        تصفح باقي المحاكم والدوائر القضائية المصرية
      </h2>
      <div class="other-courts-grid">
        ${courtData.allCourts.filter(c => c.slug !== courtData.slug).map(c => `
          <a href="/courts/${c.slug}" class="other-court-card">
            <strong>${escapeHtml(c.shortName)}</strong>
            <span>${escapeHtml(c.badge)}</span>
          </a>
        `).join("")}
      </div>
    </section>
  </main>
</div>

${renderSiteFooter()}

<script>
function copyPrincipleDirect(btn) {
  const text = btn.previousElementSibling?.textContent?.replace(/^⚖️\\s*/, "") || "";
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.textContent;
    btn.textContent = "تم النسخ ✓";
    setTimeout(() => btn.textContent = orig, 2000);
  });
}
function updateCourtSavedBadge() {
  try {
    const list = JSON.parse(localStorage.getItem("ahkam_saved_judgments") || "[]");
    const el = document.getElementById("courtSavedBadge");
    if (el) el.textContent = String(Array.isArray(list) ? list.length : 0);
  } catch {}
}
updateCourtSavedBadge();
</script>
</body>
</html>`;
}
