import { escapeHtml } from "../lib/arabic.js";

export function renderTopDevBar() {
  return `
<div class="top-dev-bar">
  <span>⚖️ إشراف وبناء قاعدة البيانات:</span>
  <span class="dev-name">أ / محمد عاطف محمد</span>
  <span>(محامٍ ومطور برمجيات)</span>
</div>`;
}

export function renderHeader({ badgeId = "headerSavedBadge", isHome = false, showSaved = true } = {}) {
  const brandTitleTag = isHome ? "h1" : "div";
  return `
  <header class="header">
    <a href="/" class="brand">
      <div style="width: 50px; height: 50px; display:flex; align-items:center; justify-content:center;">
        <img src="/favicon.svg" alt="شعار الموسوعة" width="48" height="48">
      </div>
      <div>
        <${brandTitleTag} class="brand-title">موسوعة الأحكام القضائية المصرية</${brandTitleTag}>
        <div class="brand-subtitle">محكمة النقض • الدستورية العليا • مجلس الدولة</div>
      </div>
    </a>
    <div class="header-actions">
      ${showSaved ? (isHome ? `
      <button type="button" class="header-saved-btn" onclick="openSavedJudgmentsTab()" title="عرض الأحكام المحفوظة">
        <span>⭐ المفضلة</span>
        <span class="saved-count-pill" id="${badgeId}">0</span>
      </button>` : `
      <a href="/?tab=saved" class="header-saved-btn" title="عرض الأحكام المحفوظة">
        <span>⭐ المفضلة</span>
        <span class="saved-count-pill" id="${badgeId}">0</span>
      </a>`) : ""}
      ${isHome ? `
      <div class="header-status" role="status">
        <span class="status-dot"></span>
        <span>قاعدة الأحكام متاحة للبحث</span>
      </div>` : ""}
    </div>
  </header>`;
}

export function renderSiteFooter() {
  return `
<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-col">
        <h3>⚖️ موسوعة الأحكام القضائية المصرية</h3>
        <p class="footer-desc">
          منصة رقمية بحثية مستقلة تهدف إلى إتاحة أحكام وقرارات محكمة النقض، المحكمة الدستورية العليا، ومجلس الدولة لجمهور الباحثين والمشتغلين بالقانون بالاعتماد على أحدث تقنيات الفهرسة السحابية فائقة السرعة.
        </p>
        <div style="font-size: 0.85rem; color: #cbd5e1; margin-top: 8px;">
          تطوير وإشراف: <strong>أ / محمد عاطف محمد</strong> (محامٍ ومطور برمجيات)
        </div>
      </div>

      <div class="footer-col">
        <h3>🏛️ دوائر المحاكم القضائية</h3>
        <ul class="footer-links">
          <li><a href="/courts/cassation-civil"><span style="color:#3b82f6;">▪</span> محكمة النقض - الدائرة المدنية والتجارية</a></li>
          <li><a href="/courts/cassation-criminal"><span style="color:#3b82f6;">▪</span> محكمة النقض - الدائرة الجنائية</a></li>
          <li><a href="/courts/constitutional"><span style="color:#3b82f6;">▪</span> المحكمة الدستورية العليا</a></li>
          <li><a href="/courts/administrative-high"><span style="color:#3b82f6;">▪</span> المحكمة الإدارية العليا (مجلس الدولة)</a></li>
          <li><a href="/courts/administrative"><span style="color:#3b82f6;">▪</span> محكمة القضاء الإداري (مجلس الدولة)</a></li>
        </ul>
      </div>

      <div class="footer-col">
        <h3>📌 إخلاء مسؤولية قانونية</h3>
        <div class="disclaimer-card">
          البيانات المنشورة للأغراض البحثية والاسترشادية في العمل القضائي، وتظل الصورة الرسمية الصادرة من قلم كتاب المحكمة المختصة هي السند الوحيد المعتمد أمام الجهات الرسمية.
        </div>
      </div>
    </div>

    <div class="footer-bottom">
      <div class="footer-bottom-copy">
        جميع الحقوق محفوظة © موسوعة الأحكام القضائية المصرية (ahkam.app)
      </div>
      <button class="tool-btn" onclick="window.scrollTo({top: 0, behavior: 'smooth'});">
        <span>الرجوع لأعلى</span>
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 15l7-7 7 7"/></svg>
      </button>
    </div>
  </div>
</footer>`;
}

export function toIsoDate(value) {
  const s = String(value ?? "").trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return m[1] + "-" + m[2] + "-" + m[3];
  m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/);
  if (m) return m[3] + "-" + m[2].padStart(2, "0") + "-" + m[1].padStart(2, "0");
  return undefined;
}
