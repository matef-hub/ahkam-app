import { escapeHtml, safeJsonForHtml } from "../lib/arabic.js";
import { SHARED_STYLES } from "./styles.js";
import { renderTopDevBar, renderHeader, renderSiteFooter } from "./components.js";

export function renderHomePageHtml(stats = null) {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>موسوعة الأحكام القضائية المصرية | بحث في أحكام النقض والدستورية ومجلس الدولة</title>
<meta name="description" content="محرك بحث قانوني متخصص وسريع في أحكام ومبادئ محكمة النقض المصرية، المحكمة الدستورية العليا، ومجلس الدولة برقم الطعن والموضوع.">
<link rel="canonical" href="https://ahkam.app/">
<meta property="og:title" content="موسوعة الأحكام القضائية المصرية">
<meta property="og:description" content="محرك بحث قانوني فائق السرعة في أحكام النقض والدستورية العليا ومجلس الدولة.">
<meta property="og:type" content="website">
<meta property="og:url" content="https://ahkam.app/">
<meta property="og:site_name" content="موسوعة الأحكام القضائية المصرية">
<meta property="og:locale" content="ar_EG">
<meta name="twitter:card" content="summary">
<meta name="theme-color" content="#0f2a4a">
<script type="application/ld+json">
${safeJsonForHtml({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "موسوعة الأحكام القضائية المصرية",
  "url": "https://ahkam.app/",
  "description": "محرك بحث قانوني متخصص في الأحكام والمبادئ القضائية المصرية.",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://ahkam.app/?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
})}
</script>

<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="alternate icon" href="/favicon.ico">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">

<style>${SHARED_STYLES}</style>
</head>
<body>

${renderTopDevBar()}

<div class="container">
  ${renderHeader({ badgeId: "headerSavedBadge", isHome: true, showSaved: true })}

  ${stats ? `
  <div style="margin: 0 0 18px;">
    <div style="font-size: 0.82rem; font-weight: 700; color: var(--text-muted); margin-bottom: 8px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:6px;">
      <span>📊 إحصاءات وتصفية الأحكام حسب المحكمة:</span>
      <span style="font-size:0.75rem; font-weight:600; color:var(--primary-light);">اضغط على أي محكمة للتصفية الفورية</span>
    </div>
    <section class="stats-bar court-stats-grid" id="courtStatsBar" style="display:grid;" aria-label="إحصاءات وتصفية المحاكم">
      <button type="button" class="stat-item interactive active" data-court="" onclick="handleStatItemClick('')" title="عرض وتصفية جميع الأحكام القضائية">
        <div class="stat-title">جميع المحاكم والدوائر</div>
        <div class="stat-digit">${escapeHtml(stats.judgments.toLocaleString("ar-EG"))}</div>
        <div class="stat-badge"><span>🏛️</span><span>عرض الكل</span></div>
      </button>
      <button type="button" class="stat-item interactive" data-court="1,29" onclick="handleStatItemClick('1,29')" title="تصفية أحكام وسوابق النقض المدني">
        <div class="stat-title">النقض المدني</div>
        <div class="stat-digit">${escapeHtml((stats.civilCount ?? 3).toLocaleString("ar-EG"))}</div>
        <div class="stat-badge"><span>⚖️</span><span>أحكام وسوابق</span></div>
      </button>
      <button type="button" class="stat-item interactive" data-court="2,30" onclick="handleStatItemClick('2,30')" title="تصفية أحكام وسوابق النقض الجنائي">
        <div class="stat-title">النقض الجنائي</div>
        <div class="stat-digit">${escapeHtml((stats.criminalCount ?? 2).toLocaleString("ar-EG"))}</div>
        <div class="stat-badge"><span>📜</span><span>أحكام وسوابق</span></div>
      </button>
      <button type="button" class="stat-item interactive" data-court="4,21,25" onclick="handleStatItemClick('4,21,25')" title="تصفية أحكام المحكمة الدستورية العليا">
        <div class="stat-title">الدستورية العليا</div>
        <div class="stat-digit">${escapeHtml((stats.constitutionalCount ?? 1).toLocaleString("ar-EG"))}</div>
        <div class="stat-badge"><span>⚖️</span><span>رقابة دستورية</span></div>
      </button>
      <button type="button" class="stat-item interactive" data-court="3,37" onclick="handleStatItemClick('3,37')" title="تصفية أحكام المحكمة الإدارية العليا">
        <div class="stat-title">الإدارية العليا</div>
        <div class="stat-digit">${escapeHtml((stats.supremeAdminCount ?? 1).toLocaleString("ar-EG"))}</div>
        <div class="stat-badge"><span>🏛️</span><span>مجلس الدولة</span></div>
      </button>
      <button type="button" class="stat-item interactive" data-court="31,36,47" onclick="handleStatItemClick('31,36,47')" title="تصفية أحكام محكمة القضاء الإداري">
        <div class="stat-title">القضاء الإداري</div>
        <div class="stat-digit">${escapeHtml((stats.adminCourtCount ?? 1).toLocaleString("ar-EG"))}</div>
        <div class="stat-badge"><span>⚖️</span><span>مجلس الدولة</span></div>
      </button>
    </section>
  </div>` : ""}

  <section class="search-card" aria-label="أدوات البحث في الأحكام">
    <div class="search-tabs" role="tablist">
      <button id="tabText" class="tab-btn active" role="tab" aria-selected="true" aria-controls="textSearch" onclick="setMode('text')">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        البحث النصي والموضوعي
      </button>
      <button id="tabCase" class="tab-btn" role="tab" aria-selected="false" aria-controls="caseSearch" onclick="setMode('case')">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
        الاستعلام برقم الطعن
      </button>
      <button id="tabSaved" class="tab-btn" role="tab" aria-selected="false" aria-controls="savedPanel" onclick="setMode('saved')">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>
        الأحكام المحفوظة (<span id="savedCountBadge">0</span>)
      </button>
    </div>

    <!-- Text Search Form -->
    <div id="textSearch" class="search-form" role="tabpanel">
      <label for="textCourtId" class="sr-only">اختر المحكمة أو الدائرة</label>
      <select id="textCourtId" class="form-select">
        <option value="">جميع المحاكم والدوائر القضائية</option>
        <option value="1,29">أحكام النقض المدني (الأحكام والسوابق)</option>
        <option value="2,30">أحكام النقض الجنائي (الأحكام والسوابق)</option>
        <option value="4,21,25">المحكمة الدستورية العليا (الأحكام والسوابق)</option>
        <option value="3,37">المحكمة الإدارية العليا (الأحكام والسوابق)</option>
        <option value="31,36,47">محكمة القضاء الإداري ومجلس الدولة</option>
      </select>

      <select id="searchScope" class="form-select" aria-label="نطاق البحث">
        <option value="full">كامل الحكم</option>
        <option value="principles">المبادئ فقط</option>
        <option value="reasons">الأسباب والمنطوق</option>
      </select>

      <select id="searchMode" class="form-select" aria-label="نمط البحث">
        <option value="normal">كل الكلمات</option>
        <option value="or">أي كلمة</option>
        <option value="exact">عبارة مطابقة تمامًا</option>
      </select>

      <select id="searchSort" class="form-select" aria-label="ترتيب النتائج">
        <option value="relevance">الأكثر صلة</option>
        <option value="newest">الأحدث</option>
        <option value="oldest">الأقدم</option>
      </select>

      <div class="input-group">
        <label for="query" class="sr-only">نص البحث القانوني</label>
        <svg class="input-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        <input id="query" class="form-input has-icon" type="text" autocomplete="off" placeholder="اكتب عبارة أو بحثاً مركباً... (مثال: شيك مسئولية أو بطلان إعلان)">
      </div>

      <button id="btnTextSearch" class="submit-btn" onclick="clearTimeout(debounceTimer); lastSearchedQuery = document.getElementById('query').value.trim(); executeTextSearch(1);">
        <span>بحث في الأحكام</span>
      </button>

      <details class="advanced-filters">
        <summary>فلاتر متقدمة</summary>
        <div class="advanced-filter-grid">
          <label>رقم الطعن<input id="filterCaseNo" inputmode="numeric" maxlength="7" autocomplete="off"></label>
          <label>السنة القضائية<input id="filterCaseYear" inputmode="numeric" maxlength="4" autocomplete="off"></label>
          <label>من تاريخ<input id="filterDateFrom" type="date"></label>
          <label>إلى تاريخ<input id="filterDateTo" type="date"></label>
          <label>الدائرة<input id="filterChamber" maxlength="120" autocomplete="off"></label>
          <label>النوع<input id="filterType" maxlength="120" autocomplete="off"></label>
          <label>المجال / التصنيف<input id="filterCategory" maxlength="120" autocomplete="off"></label>
        </div>
      </details>
    </div>

    <!-- Case Search Form -->
    <div id="caseSearch" class="search-form case-form" role="tabpanel" style="display:none;">
      <label for="caseCourtId" class="sr-only">اختر المحكمة أو الدائرة القضائية</label>
      <select id="caseCourtId" class="form-select">
        <option value="">جميع المحاكم والدوائر</option>
        <option value="1,29">أحكام النقض المدني (الأحكام والسوابق)</option>
        <option value="2,30">أحكام النقض الجنائي (الأحكام والسوابق)</option>
        <option value="4,21,25">المحكمة الدستورية العليا (الأحكام والسوابق)</option>
        <option value="3,37">المحكمة الإدارية العليا (الأحكام والسوابق)</option>
        <option value="31,36,47">محكمة القضاء الإداري ومجلس الدولة</option>
      </select>

      <div class="input-group">
        <label for="caseNo" class="sr-only">رقم الطعن</label>
        <input id="caseNo" class="form-input" type="text" inputmode="numeric" pattern="[0-9٠-٩]*" maxlength="7" autocomplete="off" placeholder="رقم الطعن (مثال: 95)">
      </div>
      <div class="input-group">
        <label for="caseYear" class="sr-only">السنة القضائية</label>
        <input id="caseYear" class="form-input" type="text" inputmode="numeric" pattern="[0-9٠-٩]*" maxlength="4" autocomplete="off" placeholder="السنة القضائية (مثال: 18)">
      </div>
      <button id="btnCaseSearch" class="submit-btn" onclick="executeCaseSearch()">
        <span>استدعاء الحكم</span>
      </button>
    </div>

    <!-- Saved Judgments Panel -->
    <div id="savedPanel" class="saved-panel" role="tabpanel">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; padding-bottom:14px; border-bottom:1.5px solid var(--border);">
        <div>
          <div style="display:flex; align-items:center; gap:8px;">
            <strong style="color:var(--primary); font-size:1.1rem;">⭐ مكتبة الأحكام المحفوظة (المفضلة القضائية)</strong>
            <span class="saved-count-pill" id="savedPanelBadge">0</span>
          </div>
          <p style="margin:4px 0 0; color:var(--text-muted); font-size:0.88rem;">الأحكام التي قمت بحفظها أثناء أبحاثك القانونية على هذا الجهاز للرجوع السريع والاستشهاد.</p>
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button type="button" class="tool-btn" onclick="exportSavedCitations()">📋 نسخ كل الاستشهادات</button>
          <button type="button" class="tool-btn" onclick="clearAllSavedJudgments()" style="color:#ef4444; border-color:#fecaca;">🗑️ تفريغ المحفوظات</button>
        </div>
      </div>
      <div id="savedListContainer" style="margin-top:16px;"></div>
    </div>
  </section>

  <!-- Loading State -->
  <div id="loading" class="loading-box" role="status" aria-live="polite">
    <div class="spinner"></div>
    <span id="loadingText">جاري فحص واستخراج البيانات من الفهرس السحابي...</span>
  </div>

  <!-- Search Stats -->
  <div id="stats" class="stats-bar">
    <div class="stat-item">
      <div class="stat-title">الأحكام المطابقة</div>
      <div id="statJudgments" class="stat-digit">0</div>
    </div>
    <div class="stat-item">
      <div class="stat-title">مواضع الفقرات المطابقة</div>
      <div id="statMatches" class="stat-digit">0</div>
    </div>
    <div class="stat-item">
      <div class="stat-title">معيار الترتيب</div>
      <div id="statType" class="stat-digit" style="font-size:1.05rem; padding-top:4px;">ترتيب حسب صلة النتائج</div>
    </div>
  </div>

  <!-- Results Main Container -->
  <main id="results" class="results-container"></main>

  <!-- Pagination Controls Container -->
  <nav id="pagination" class="pagination-wrapper" aria-label="تنقل الصفحات" style="display:none;"></nav>
</div>

${renderSiteFooter()}

<script>
let currentMode = "text";
let activeController = null;
let activeRequestId = 0;
let currentSearchState = null;
let currentJudgment = null;
const searchCursors = new Map();

// Arabic-Indic (٠-٩) and Persian (۰-۹) digits -> ASCII, so "٩٥" works as 95.
function toAsciiDigits(value) {
  return String(value ?? "")
    .replace(/[\\u0660-\\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\\u06F0-\\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06F0));
}

// Every network request goes through here, so only the newest one can ever
// update the page (search, judgment view and case lookup share one guard).
function beginRequest() {
  if (activeController) activeController.abort();
  activeController = new AbortController();
  return { signal: activeController.signal, reqId: ++activeRequestId };
}

function cancelActiveRequest() {
  if (activeController) activeController.abort();
  activeRequestId++;
  setLoading(false);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showToast(msg) {
  let toast = document.getElementById("customToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "customToast";
    toast.className = "toast-msg";
    document.body.appendChild(toast);
  }
  toast.innerHTML = "<span>⚠️</span> <span>" + escapeHtml(msg) + "</span>";
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3200);
}

function setMode(mode) {
  currentMode = mode;
  const textSearch = document.getElementById("textSearch");
  const caseSearch = document.getElementById("caseSearch");
  const savedPanel = document.getElementById("savedPanel");
  const tabText = document.getElementById("tabText");
  const tabCase = document.getElementById("tabCase");
  const tabSaved = document.getElementById("tabSaved");
  const stats = document.getElementById("stats");
  const pagination = document.getElementById("pagination");
  const results = document.getElementById("results");

  [tabText, tabCase, tabSaved].forEach((tab) => {
    if (tab) {
      tab.classList.remove("active");
      tab.setAttribute("aria-selected", "false");
    }
  });
  if (textSearch) textSearch.style.display = "none";
  if (caseSearch) caseSearch.style.display = "none";
  if (savedPanel) savedPanel.style.display = "none";

  if (mode === "text") {
    if (textSearch) textSearch.style.display = "grid";
    if (tabText) {
      tabText.classList.add("active");
      tabText.setAttribute("aria-selected", "true");
    }
    document.getElementById("query")?.focus();
    if (stats && currentSearchState) stats.style.display = "grid";
    if (pagination && currentSearchState) pagination.style.display = "flex";
  } else if (mode === "case") {
    if (caseSearch) caseSearch.style.display = "grid";
    if (tabCase) {
      tabCase.classList.add("active");
      tabCase.setAttribute("aria-selected", "true");
    }
    document.getElementById("caseNo")?.focus();
    if (stats && currentSearchState) stats.style.display = "grid";
    if (pagination && currentSearchState) pagination.style.display = "flex";
  } else if (mode === "saved") {
    if (savedPanel) savedPanel.style.display = "block";
    if (tabSaved) {
      tabSaved.classList.add("active");
      tabSaved.setAttribute("aria-selected", "true");
    }
    if (stats) stats.style.display = "none";
    if (pagination) pagination.style.display = "none";
    if (results) results.innerHTML = "";
    renderSavedJudgments();
  }
}

function openSavedJudgmentsTab() {
  setMode("saved");
  const panel = document.getElementById("savedPanel") || document.getElementById("tabSaved");
  if (panel) {
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function setLoading(isLoading, text = "جاري فحص واستخراج البيانات من الفهرس السحابي...") {
  const box = document.getElementById("loading");
  const btnText = document.getElementById("btnTextSearch");
  const btnCase = document.getElementById("btnCaseSearch");
  document.getElementById("loadingText").textContent = text;
  box.style.display = isLoading ? "block" : "none";
  if (btnText) btnText.disabled = isLoading;
  if (btnCase) btnCase.disabled = isLoading;
}

function showStats(judgments, matches, rankLabel) {
  const stats = document.getElementById("stats");
  stats.style.display = "grid";
  document.getElementById("statJudgments").textContent = Number(judgments).toLocaleString("ar-EG");
  document.getElementById("statMatches").textContent = Number(matches).toLocaleString("ar-EG");
  document.getElementById("statType").textContent = rankLabel;
}

function hideStats() {
  document.getElementById("stats").style.display = "none";
}

function showMessage(msg) {
  document.getElementById("results").innerHTML = \`<div class="empty-state">\${escapeHtml(msg)}</div>\`;
  document.getElementById("pagination").style.display = "none";
  hideStats();
}

function searchStateKey(query, options) {
  return [query, options.courtId, options.scope, options.mode, options.sort, options.caseNo, options.caseYear,
    options.dateFrom, options.dateTo, options.chamber, options.type, options.category].join("\\u001f");
}

function selectedSearchOptions() {
  return {
    courtId: document.getElementById("textCourtId").value,
    scope: document.getElementById("searchScope").value,
    mode: document.getElementById("searchMode").value,
    sort: document.getElementById("searchSort").value,
    caseNo: document.getElementById("filterCaseNo").value.trim(),
    caseYear: document.getElementById("filterCaseYear").value.trim(),
    dateFrom: document.getElementById("filterDateFrom").value,
    dateTo: document.getElementById("filterDateTo").value,
    chamber: document.getElementById("filterChamber").value.trim(),
    type: document.getElementById("filterType").value.trim(),
    category: document.getElementById("filterCategory").value.trim(),
  };
}

function restoreSearchOptions(options) {
  const courtSelect = document.getElementById("textCourtId");
  courtSelect.dataset.selectedCourt = options.courtId || "";
  courtSelect.value = options.courtId || "";
  document.getElementById("searchScope").value = options.scope || "full";
  document.getElementById("searchMode").value = options.mode || "normal";
  document.getElementById("searchSort").value = options.sort || "relevance";
  document.getElementById("filterCaseNo").value = options.caseNo || "";
  document.getElementById("filterCaseYear").value = options.caseYear || "";
  document.getElementById("filterDateFrom").value = options.dateFrom || "";
  document.getElementById("filterDateTo").value = options.dateTo || "";
  document.getElementById("filterChamber").value = options.chamber || "";
  document.getElementById("filterType").value = options.type || "";
  document.getElementById("filterCategory").value = options.category || "";
  if (options.caseNo || options.caseYear || options.dateFrom || options.dateTo || options.chamber || options.type || options.category) {
    document.querySelector(".advanced-filters").open = true;
  }
  syncStatButtons(options.courtId || "");
}

function sortLabel(sort) {
  return ({ relevance: "الأكثر صلة", newest: "الأحدث", oldest: "الأقدم" })[sort] || "الأكثر صلة";
}

async function executeTextSearch(page = 1, { pushHistory = true, cursor = undefined, silent = false } = {}) {
  const query = document.getElementById("query").value.trim();
  const searchOptions = selectedSearchOptions();
  const { courtId, scope, mode, sort } = searchOptions;
  syncStatButtons(courtId || "");

  if (!query) {
    if (!silent) {
      showToast("يرجى إدخال نص للبحث أولاً");
      document.getElementById("query").focus();
    }
    return;
  }

  const { signal, reqId } = beginRequest();

  setLoading(true);
  const slowTimer = setTimeout(() => {
    if (activeRequestId === reqId) {
      setLoading(true, "البحث مركب... جاري استكمال تجميع نتائج الفهرس السحابي");
    }
  }, 2200);

  try {
    const stateKey = searchStateKey(query, searchOptions);
    const effectiveCursor = cursor === undefined ? searchCursors.get(stateKey + "\\u001f" + page) : cursor;
    let endpoint = "/api/search?q=" + encodeURIComponent(query) + "&page=" + page + "&page_size=20" +
      "&sort=" + encodeURIComponent(sort) + "&mode=" + encodeURIComponent(mode) + "&scope=" + encodeURIComponent(scope);
    if (courtId) endpoint += "&court=" + encodeURIComponent(courtId);
    if (effectiveCursor) endpoint += "&cursor=" + encodeURIComponent(effectiveCursor);
    for (const [key, value] of Object.entries({
      case_no: searchOptions.caseNo,
      case_year: searchOptions.caseYear,
      date_from: searchOptions.dateFrom,
      date_to: searchOptions.dateTo,
      chamber: searchOptions.chamber,
      type: searchOptions.type,
      category: searchOptions.category,
    })) {
      if (value) endpoint += "&" + key + "=" + encodeURIComponent(value);
    }

    const res = await fetch(endpoint, { signal });
    const data = await res.json();
    clearTimeout(slowTimer);

    if (reqId !== activeRequestId) return;
    setLoading(false);

    if (!res.ok) {
      return showMessage(data.error || "تعذر إتمام البحث القضائي.");
    }

    searchCursors.set(stateKey + "\\u001f" + page, effectiveCursor || null);
    if (data.next_cursor) searchCursors.set(stateKey + "\\u001f" + (page + 1), data.next_cursor);
    currentSearchState = { query, ...searchOptions, page, data };
    const params = new URLSearchParams({ q: query, page: String(page), sort, mode, scope });
    if (courtId) params.set("court", courtId);
    for (const [key, value] of Object.entries({
      case_no: searchOptions.caseNo,
      case_year: searchOptions.caseYear,
      date_from: searchOptions.dateFrom,
      date_to: searchOptions.dateTo,
      chamber: searchOptions.chamber,
      type: searchOptions.type,
      category: searchOptions.category,
    })) if (value) params.set(key, value);
    const urlState = "/?" + params.toString();
    const state = { type: "search", query, ...searchOptions, page };

    // Never stack duplicate history entries for the exact same URL.
    if (pushHistory && urlState !== location.pathname + location.search) {
      history.pushState(state, "", urlState);
    } else {
      history.replaceState(state, "", urlState);
    }

    renderSearchResults(data, sort);
  } catch (err) {
    clearTimeout(slowTimer);
    if (err.name === "AbortError" || reqId !== activeRequestId) return;
    setLoading(false);
    showMessage("حدث خطأ أثناء الاتصال بالخادم. يرجى التحقق من اتصالك والمحاولة مجدداً.");
  }
}

function renderSearchResults(data, sort = selectedSearchOptions().sort) {
  const container = document.getElementById("results");
  if (!data.results || !data.results.length) {
    return showMessage("لم يتم العثور على أحكام قضائية مطابقة للبحث المطلوب.");
  }

  showStats(data.total_judgments, data.total_matches, sortLabel(sort));

  let html = \`
    <div class="results-header-info">
      <h2>الأحكام القضائية المستخلصة (صفحة \${data.page} من \${Math.max(1, Math.ceil(data.total_judgments / data.page_size))})</h2>
      <span style="font-weight:700; color:var(--text-muted); font-size:0.88rem;">
        إجمالي: \${data.total_judgments.toLocaleString("ar-EG")} حكماً (\${data.total_matches.toLocaleString("ar-EG")} موضع تطابق)
      </span>
    </div>
  \`;

  for (const item of data.results) {
    html += \`
      <article class="judgment-card" data-court-id="\${item.Court_ID || ''}">
        <div class="badges-row">
          <span class="law-badge badge-court">\${escapeHtml(item.Court_Name || "محكمة النقض")}</span>
          <span class="law-badge badge-gold">طعن رقم \${escapeHtml(item.Case_No)}</span>
          <span class="law-badge badge-blue">لسنة \${escapeHtml(item.Case_Year)} قضائية</span>
          \${item.Case_Date ? \`<span class="law-badge badge-gray">\${escapeHtml(item.Case_Date)}</span>\` : ""}
          \${item.Office_Year ? \`<span class="law-badge badge-gray">مكتب فني: \${escapeHtml(item.Office_Year)}</span>\` : ""}
        </div>
        
        <h3 class="card-title">
          <a href="/judgment/\${item.Master_ID}" onclick="navigateToJudgment(event, \${item.Master_ID})">
            حكم \${escapeHtml(item.Court_Name)} في الطعن رقم \${escapeHtml(item.Case_No)} لسنة \${escapeHtml(item.Case_Year)} ق
          </a>
        </h3>
    \`;

    for (const match of item.matches) {
      html += \`
        <div class="match-snippet-box">
          <span class="fakra-type-tag">\${escapeHtml(match.fakraLabel)}</span>
          <div>\${match.snippet}</div>
        </div>
      \`;
    }

    html += \`
        <div class="card-actions">
          <a href="/judgment/\${item.Master_ID}" class="open-btn" onclick="navigateToJudgment(event, \${item.Master_ID})">
            <span>فتح ملف الحكم كاملاً</span>
            <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"/></svg>
          </a>
          <button type="button" class="tool-btn" onclick="copySearchResultLink(\${item.Master_ID})">نسخ الرابط</button>
          <button type="button" class="tool-btn" data-save-id="\${item.Master_ID}" onclick="toggleSaveFromCard(event, \${item.Master_ID}, '\${escapeHtml(item.Court_Name || 'محكمة النقض')}', \${item.Case_No}, \${item.Case_Year}, '\${escapeHtml(item.Case_Date || '')}')">☆ حفظ</button>
        </div>
      </article>
    \`;
  }

  container.innerHTML = html;
  updateSaveButtons();
  renderPagination(data);
}

function renderPagination(data) {
  const nav = document.getElementById("pagination");
  const totalPages = Math.max(1, Math.ceil(data.total_judgments / data.page_size));

  if (totalPages <= 1) {
    nav.style.display = "none";
    return;
  }

  nav.style.display = "flex";
  const isCourtBrowse = !currentSearchState?.query;
  const prevAction = isCourtBrowse ? ("loadJudgmentsByCourt('" + (currentSearchState?.courtId || "") + "', " + (data.page - 1) + ")") : ("executeTextSearch(" + (data.page - 1) + ")");
  const nextAction = isCourtBrowse ? ("loadJudgmentsByCourt('" + (currentSearchState?.courtId || "") + "', " + (data.page + 1) + ")") : ("executeTextSearch(" + (data.page + 1) + ")");

  nav.innerHTML = \`
    <button class="pagination-btn" \${data.page <= 1 ? "disabled" : ""} onclick="\${prevAction}">
      <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>
      <span>الصفحة السابقة</span>
    </button>
    <span class="pagination-info">صفحة \${data.page} من \${totalPages}</span>
    <button class="pagination-btn" \${!data.has_more ? "disabled" : ""} onclick="\${nextAction}">
      <span>الصفحة التالية</span>
      <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"/></svg>
    </button>
  \`;
}

let currentCourtFilter = "";
let debounceTimer = null;
let lastSearchedQuery = "";

function onQueryInput() {
  clearTimeout(debounceTimer);
  const input = document.getElementById("query");
  if (!input) return;
  const query = input.value.trim();

  // If input was cleared by user
  if (!query) {
    lastSearchedQuery = "";
    cancelActiveRequest();
    if (currentCourtFilter) {
      loadJudgmentsByCourt(currentCourtFilter, 1);
    } else {
      document.getElementById("results").innerHTML = "";
      document.getElementById("pagination").style.display = "none";
      hideStats();
    }
    return;
  }

  // Need at least 2 characters for valid search
  if (query.length < 2) return;
  if (query === lastSearchedQuery) return;

  // Debounced search: 350ms delay
  debounceTimer = setTimeout(() => {
    lastSearchedQuery = query;
    executeTextSearch(1, { pushHistory: false, silent: true });
  }, 350);
}

function syncStatButtons(courtId = "") {
  currentCourtFilter = courtId || "";
  document.querySelectorAll(".stat-item.interactive").forEach((btn) => {
    btn.classList.toggle("active", (btn.dataset.court || "") === (courtId || ""));
  });
}

async function handleStatItemClick(courtId) {
  if (currentCourtFilter === courtId && courtId !== "") {
    courtId = "";
  }
  syncStatButtons(courtId);

  const textSelect = document.getElementById("textCourtId");
  if (textSelect) textSelect.value = courtId;
  const caseSelect = document.getElementById("caseCourtId");
  if (caseSelect) caseSelect.value = courtId;

  const query = document.getElementById("query").value.trim();

  if (query) {
    executeTextSearch(1);
    return;
  }

  const existingCards = document.querySelectorAll(".judgment-card");
  if (existingCards.length > 0 && currentSearchState?.query) {
    filterVisibleCards(courtId);
    return;
  }

  await loadJudgmentsByCourt(courtId, 1);
}

function filterVisibleCards(courtId) {
  const container = document.getElementById("results");
  if (!container) return;
  const cards = container.querySelectorAll(".judgment-card");
  if (!cards.length) return;

  const validCourtIds = courtId ? courtId.split(",").map(Number) : [];
  let visibleCount = 0;
  cards.forEach((card) => {
    const cardCourtId = Number(card.dataset.courtId);
    const matches = !courtId || validCourtIds.includes(cardCourtId);
    card.style.display = matches ? "block" : "none";
    if (matches) visibleCount++;
  });

  let filterPill = document.getElementById("activeCourtFilterNotice");
  if (!filterPill) {
    filterPill = document.createElement("div");
    filterPill.id = "activeCourtFilterNotice";
    filterPill.style.cssText = "background:#eff6ff; color:#1e40af; border:1px solid #bfdbfe; padding:10px 16px; border-radius:8px; margin-bottom:16px; font-size:0.9rem; font-weight:600; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;";
    const headerInfo = container.querySelector(".results-header-info");
    if (headerInfo) headerInfo.after(filterPill);
    else container.prepend(filterPill);
  }

  if (courtId) {
    const activeBtn = document.querySelector(\`.stat-item.interactive[data-court="\${courtId}"]\`);
    const courtTitle = activeBtn ? activeBtn.querySelector(".stat-title")?.textContent : "المحكمة المحددة";
    filterPill.style.display = "flex";
    filterPill.innerHTML = \`<span>⚖️ تصفية النتائج: تم عرض أحكام <strong>\${escapeHtml(courtTitle)}</strong> (\${visibleCount} حكماً)</span><button type="button" onclick="handleStatItemClick('')" style="background:#dbeafe; border:none; padding:4px 10px; border-radius:4px; color:#1e40af; cursor:pointer; font-weight:700; font-family:inherit;">عرض جميع المحاكم ✕</button>\`;
  } else {
    filterPill.style.display = "none";
  }
}

async function loadJudgmentsByCourt(courtId = "", page = 1) {
  const { signal, reqId } = beginRequest();
  setLoading(true, "جاري استدعاء الأحكام القضائية...");

  try {
    let endpoint = "/api/court-judgments?page=" + page + "&page_size=20";
    if (courtId) endpoint += "&court=" + encodeURIComponent(courtId);

    const res = await fetch(endpoint, { signal });
    const data = await res.json();

    if (reqId !== activeRequestId) return;
    setLoading(false);

    if (!res.ok || !data.results || !data.results.length) {
      return showMessage(data.error || "لا توجد أحكام قضائية مسجلة لهذه المحكمة حالياً.");
    }

    currentSearchState = { query: "", courtId, page, data };
    const courtBtn = document.querySelector(\`.stat-item.interactive[data-court="\${courtId}"]\`);
    const courtName = courtBtn ? courtBtn.querySelector(".stat-title")?.textContent : "جميع المحاكم";
    showStats(data.total_judgments, data.total_matches, "عرض أحكام: " + courtName);
    renderSearchResults(data, "الأحدث");
    const resultsContainer = document.getElementById("results");
    if (resultsContainer) {
      resultsContainer.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  } catch (err) {
    if (err.name === "AbortError" || reqId !== activeRequestId) return;
    setLoading(false);
    showMessage("حدث خطأ أثناء استدعاء أحكام المحكمة. يرجى إعادة المحاولة.");
  }
}

function copySearchResultLink(masterId) {
  copyToClipboard(new URL("/judgment/" + masterId, window.location.origin).href, "تم نسخ رابط الحكم");
}

function getSavedJudgments() {
  try {
    const raw = localStorage.getItem("ahkam_saved_judgments");
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return list.filter(item => item && (item.masterId != null || item.id != null)).map(item => ({
      masterId: Number(item.masterId != null ? item.masterId : item.id),
      courtName: String(item.courtName || "محكمة النقض"),
      caseNo: item.caseNo != null ? String(item.caseNo) : "",
      caseYear: item.caseYear != null ? String(item.caseYear) : "",
      caseDate: item.caseDate ? String(item.caseDate) : ""
    }));
  } catch (e) {
    console.error("Error reading saved judgments:", e);
    return [];
  }
}

function updateSavedBadge() {
  const count = getSavedJudgments().length;
  const str = String(count);
  ["savedCountBadge", "savedPanelBadge", "headerSavedBadge", "detailSavedBadge", "courtSavedBadge"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = str;
  });
}

function toggleSaveFromCard(event, masterId, courtName, caseNo, caseYear, caseDate) {
  if (event) event.stopPropagation();
  const idNum = Number(masterId);
  if (!idNum) return;
  let list = getSavedJudgments();
  const idx = list.findIndex(item => Number(item.masterId) === idNum);
  if (idx >= 0) {
    list.splice(idx, 1);
    showToast("تم إزالة الحكم من المفضلة");
  } else {
    list.unshift({
      masterId: idNum,
      courtName: courtName || "محكمة النقض",
      caseNo: caseNo != null ? String(caseNo) : "",
      caseYear: caseYear != null ? String(caseYear) : "",
      caseDate: caseDate ? String(caseDate) : ""
    });
    showToast("تم حفظ الحكم في المفضلة ⭐");
  }
  localStorage.setItem("ahkam_saved_judgments", JSON.stringify(list));
  updateSavedBadge();
  updateSaveButtons();
  if (currentMode === "saved") renderSavedJudgments();
}

function removeSavedJudgment(masterId) {
  const idNum = Number(masterId);
  let list = getSavedJudgments();
  list = list.filter(item => Number(item.masterId) !== idNum);
  localStorage.setItem("ahkam_saved_judgments", JSON.stringify(list));
  updateSavedBadge();
  updateSaveButtons();
  if (currentMode === "saved") renderSavedJudgments();
  showToast("تم إزالة الحكم من المفضلة");
}

function updateSaveButtons() {
  const list = getSavedJudgments();
  const ids = new Set(list.map(i => Number(i.masterId)));
  document.querySelectorAll("[data-save-id]").forEach(btn => {
    const id = Number(btn.dataset.saveId);
    const isSaved = ids.has(id);
    btn.textContent = isSaved ? "⭐ محفوظ" : "☆ حفظ";
    btn.classList.toggle("saved-active", isSaved);
    btn.style.color = isSaved ? "#b45309" : "";
    btn.style.fontWeight = isSaved ? "700" : "";
    btn.style.borderColor = isSaved ? "#f59e0b" : "";
    btn.style.background = isSaved ? "#fffbeb" : "";
  });
}

function renderSavedJudgments() {
  const container = document.getElementById("savedListContainer");
  if (!container) return;
  const list = getSavedJudgments();
  const panelBadge = document.getElementById("savedPanelBadge");
  if (panelBadge) panelBadge.textContent = String(list.length);

  if (!list.length) {
    container.innerHTML = '<div class="empty-state" style="padding:36px 20px; text-align:center;">' +
      '<div style="font-size:2.8rem; margin-bottom:10px;">📑 ⭐</div>' +
      '<h3 style="font-size:1.15rem; color:var(--primary); margin:0 0 8px;">لا توجد أحكام في المفضلة حالياً</h3>' +
      '<p style="color:var(--text-muted); font-size:0.92rem; max-width:480px; margin:0 auto 18px; line-height:1.6;">' +
        'يمكنك حفظ أي حكم قضائي للرجوع إليه لاحقاً بمجرد الضغط على زر <strong>«☆ حفظ»</strong> الموجود في بطاقات نتائج البحث أو داخل صفحة أي حكم.' +
      '</p>' +
      '<button type="button" class="tool-btn" style="background:var(--primary); color:white; border-color:var(--primary); padding:8px 20px;" onclick="setMode(\\'text\\')">' +
        '🔍 ابدأ البحث في الأحكام' +
      '</button>' +
    '</div>';
    return;
  }

  let html = '<div style="display:flex; flex-direction:column; gap:12px;">';
  for (const item of list) {
    const masterId = Number(item.masterId);
    const courtName = escapeHtml(item.courtName || "محكمة النقض");
    const caseNo = escapeHtml(String(item.caseNo || ""));
    const caseYear = escapeHtml(String(item.caseYear || ""));
    const caseDate = escapeHtml(String(item.caseDate || ""));

    html += '<div class="saved-card-item">' +
      '<div>' +
        '<div style="display:flex; align-items:center; gap:8px; margin-bottom:6px; flex-wrap:wrap;">' +
          '<span class="law-badge badge-court">' + courtName + '</span>' +
          (caseDate ? '<span class="law-badge badge-gold">جلسة ' + caseDate + '</span>' : '') +
        '</div>' +
        '<div style="font-size:1rem; font-weight:800; color:var(--primary-dark);">' +
          'الطعن رقم ' + (caseNo || "غير محدد") + ' لسنة ' + (caseYear || "غير محدد") + ' قضائية' +
        '</div>' +
      '</div>' +
      '<div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">' +
        '<a href="/judgment/' + masterId + '" class="open-btn" style="padding:7px 14px; font-size:0.88rem;" onclick="navigateToJudgment(event, ' + masterId + ')">' +
          '<span>فتح الحكم</span>' +
          '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"/></svg>' +
        '</a>' +
        '<button type="button" class="tool-btn" style="padding:7px 12px; font-size:0.85rem;" onclick="copySavedItemCitation(\\'' + courtName + '\\', \\'' + caseNo + '\\', \\'' + caseYear + '\\', \\'' + caseDate + '\\')">📋 نسخ الاستشهاد</button>' +
        '<button type="button" class="tool-btn" style="padding:7px 12px; font-size:0.85rem; color:#dc2626; border-color:#fecaca;" onclick="removeSavedJudgment(' + masterId + ')" title="إزالة من المفضلة">حذف ✕</button>' +
      '</div>' +
    '</div>';
  }
  html += '</div>';
  container.innerHTML = html;
}

function copySavedItemCitation(court, no, yr, date) {
  const cit = court + " - الطعن رقم " + no + " لسنة " + yr + " قضائية" + (date ? " - جلسة " + date : "");
  copyToClipboard(cit, "تم نسخ الاستشهاد القانوني");
}

function exportSavedCitations() {
  const list = getSavedJudgments();
  if (!list.length) return showToast("لا توجد أحكام محفوظة لنسخها");
  const text = list.map((item, idx) => (idx + 1) + ". " + item.courtName + " - الطعن رقم " + item.caseNo + " لسنة " + item.caseYear + " قضائية" + (item.caseDate ? " - جلسة " + item.caseDate : "")).join("\\n");
  copyToClipboard(text, "تم نسخ استشهادات جميع الأحكام المحفوظة");
}

function clearAllSavedJudgments() {
  if (confirm("هل أنت متأكد من تفريغ قائمة الأحكام المحفوظة؟")) {
    localStorage.removeItem("ahkam_saved_judgments");
    updateSavedBadge();
    renderSavedJudgments();
    updateSaveButtons();
    showToast("تم تفريغ المحفوظات");
  }
}

function copyPrincipleDirect(btn) {
  const text = btn.previousElementSibling?.textContent?.replace(/^⚖️\\s*/, "") || "";
  copyToClipboard(text, "تم نسخ المبدأ القانوني بنجاح");
}

async function loadCourtOptions() {
  // Court options are unified into consolidated judicial jurisdictions
  // (Civil Cassation, Criminal Cassation, Constitutional, and State Council).
}

async function navigateToJudgment(event, masterId) {
  if (event) event.preventDefault();
  history.pushState({ type: "judgment", masterId }, "", \`/judgment/\${masterId}\`);
  await loadAndRenderJudgment(masterId);
}

async function loadAndRenderJudgment(masterId) {
  hideStats();
  document.getElementById("pagination").style.display = "none";
  const { signal, reqId } = beginRequest();
  setLoading(true);

  try {
    const res = await fetch("/api/judgment?id=" + encodeURIComponent(masterId), { signal });
    const data = await res.json();
    if (reqId !== activeRequestId) return;
    setLoading(false);

    if (!res.ok || !data.found) {
      return showMessage(data.error || "تعذر العثور على ملف الحكم المطلوب.");
    }
    renderFullJudgmentView(data);
  } catch (err) {
    if (err.name === "AbortError" || reqId !== activeRequestId) return;
    setLoading(false);
    showMessage("تعذر تحميل ملف الحكم. يرجى إعادة المحاولة.");
  }
}

function renderFullJudgmentView(data) {
  const master = data.master;
  currentJudgment = master;
  const container = document.getElementById("results");

  let html = \`
    <button class="back-btn" onclick="handleBackButton()">
      <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>
      <span>العودة لنتائج البحث</span>
    </button>

    <article class="full-judgment-view">
      <div class="full-judgment-header">
        <h1>الطعن رقم \${escapeHtml(master.Case_No)} لسنة \${escapeHtml(master.Case_Year)} قضائية</h1>
        <div class="badges-row">
          <span class="law-badge badge-court">\${escapeHtml(master.Court_Name || "محكمة النقض")}</span>
          <span class="law-badge badge-gold">\${escapeHtml(master.Case_Date || "تاريخ الجلسة غير مدون")}</span>
          \${master.Office_Year ? \`<span class="law-badge badge-gray">سنة المكتب الفني: \${escapeHtml(master.Office_Year)}</span>\` : ""}
        </div>

        <div class="judgment-toolbar">
          <button class="tool-btn" onclick="copyJudgmentCitation()">📋 نسخ الاستشهاد القانوني</button>
          <button class="tool-btn" onclick="copyJudgmentLink()">🔗 نسخ الرابط</button>
          <button class="tool-btn" id="btnSaveSpa" onclick="toggleSaveCurrentJudgment()">☆ حفظ في المفضلة</button>
          <button class="tool-btn" onclick="window.print()">🖨️ طباعة الحكم</button>
        </div>
      </div>
  \`;

  if (master.Master_Text) {
    html += \`
      <div style="background:var(--surface-muted); padding:16px 20px; border-radius:8px; margin-bottom:20px; font-weight:600; color:var(--text-sub); text-align:justify;">
        <strong style="color:var(--primary); display:block; margin-bottom:6px;">ملخص / وقائع الدعوى:</strong>
        \${escapeHtml(master.Master_Text)}
      </div>
    \`;
  }

  if (data.principles && data.principles.length) {
    html += \`<h2 style="color:var(--primary); font-size:1.2rem; margin: 24px 0 10px;">المبادئ القانونية المستخلصة</h2>\`;
    html += \`<div class="principles-wrapper">\`;
    for (const p of data.principles) {
      html += \`<div class="principle-box">⚖️ \${escapeHtml(p.Mogz_Text)}</div>\`;
    }
    html += \`</div>\`;
  }

  html += \`<h2 style="color:var(--primary); font-size:1.2rem; margin: 28px 0 12px;">نص وأسباب ومنطوق الحكم</h2>\`;
  for (const t of data.texts) {
    let label = \`فقرة رقم \${t.Fakra_No}\`;
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
      label = \`📌 المبدأ / الفقرة (\${t.Fakra_No})\`;
    }

    html += \`
      <section class="fakra-row">
        <div class="fakra-idx"><span class="law-badge \${badgeClass}">\${escapeHtml(label)}</span></div>
        <div style="line-height:2.1; margin-top:8px; text-align: justify;">\${escapeHtml(t.Fakra_Text)}</div>
      </section>
    \`;
  }

  if (data.related && data.related.length) {
    html += '<section aria-labelledby="related-judgments-heading"><h2 id="related-judgments-heading" style="color:var(--primary); font-size:1.2rem; margin:28px 0 12px;">أحكام ذات صلة من المحكمة نفسها</h2><div class="principles-wrapper">';
    for (const item of data.related) {
      html += '<a class="principle-box" href="/judgment/' + encodeURIComponent(item.Master_ID) + '" onclick="navigateToJudgment(event, ' + Number(item.Master_ID) + ')">' +
        escapeHtml(item.Court_Name || "المحكمة") + ' — الطعن رقم ' + escapeHtml(item.Case_No) + ' لسنة ' + escapeHtml(item.Case_Year) +
        (item.Case_Date ? ' — ' + escapeHtml(item.Case_Date) : '') + '</a>';
    }
    html += "</div></section>";
  }
  html += \`</article>\`;
  container.innerHTML = html;
  updateFullJudgmentSaveButton();
}

function toggleSaveCurrentJudgment() {
  if (!currentJudgment) return;
  const m = currentJudgment;
  toggleSaveFromCard(null, m.Master_ID, m.Court_Name, m.Case_No, m.Case_Year, m.Case_Date);
  updateFullJudgmentSaveButton();
}

function updateFullJudgmentSaveButton() {
  if (!currentJudgment) return;
  const btn = document.getElementById("btnSaveSpa");
  if (!btn) return;
  const list = getSavedJudgments();
  const isSaved = list.some(i => Number(i.masterId) === Number(currentJudgment.Master_ID));
  btn.textContent = isSaved ? "⭐ محفوظ في المفضلة" : "☆ حفظ في المفضلة";
  btn.style.color = isSaved ? "#b45309" : "";
  btn.style.fontWeight = isSaved ? "700" : "";
  btn.style.borderColor = isSaved ? "#f59e0b" : "";
  btn.style.background = isSaved ? "#fffbeb" : "";
}

function handleBackButton() {
  if (currentSearchState && history.length > 1) {
    history.back();
    return;
  }
  window.location.href = "/";
}

async function copyToClipboard(text, successMessage) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(successMessage);
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.focus();
    area.select();
    try {
      document.execCommand("copy");
      showToast(successMessage);
    } catch {
      showToast("تعذر النسخ تلقائياً؛ يمكنك تحديد النص ونسخه يدوياً.");
    }
    area.remove();
  }
}

function copyJudgmentCitation() {
  if (!currentJudgment) return;
  const m = currentJudgment;
  const citation = (m.Court_Name || "المحكمة غير محددة") + " - الطعن رقم " + m.Case_No + " لسنة " + m.Case_Year + " قضائية" + (m.Case_Date ? " - جلسة " + m.Case_Date : "");
  copyToClipboard(citation, "تم نسخ الاستشهاد القانوني");
}

function copyJudgmentLink() {
  if (!currentJudgment) return;
  copyToClipboard(new URL("/judgment/" + currentJudgment.Master_ID, window.location.origin).href, "تم نسخ رابط الحكم");
}

async function executeCaseSearch() {
  const no = toAsciiDigits(document.getElementById("caseNo").value.trim());
  const yr = toAsciiDigits(document.getElementById("caseYear").value.trim());
  const courtId = document.getElementById("caseCourtId").value;

  if (!no || !yr) {
    showToast("يرجى إدخال رقم وسنة الطعن");
    return;
  }
  if (!/^\\d+$/.test(no) || !/^\\d+$/.test(yr)) {
    showToast("رقم الطعن والسنة يجب أن يكونا أرقاماً فقط");
    return;
  }

  const { signal, reqId } = beginRequest();
  setLoading(true);
  try {
    let endpoint = "/api/judgment?no=" + encodeURIComponent(no) + "&yr=" + encodeURIComponent(yr);
    if (courtId) endpoint += "&court=" + encodeURIComponent(courtId);

    const res = await fetch(endpoint, { signal });
    const data = await res.json();
    if (reqId !== activeRequestId) return;
    setLoading(false);

    if (!res.ok || !data.found) {
      return showMessage(data.error || "لم يتم العثور على حكم مطابق لرقم وسنة الطعن.");
    }

    if (data.multiple) {
      showStats(data.judgments.length, data.judgments.length, "تعدد دوائر قضائية");
      renderMultipleJudgments(data.judgments);
      return;
    }

    const judgmentUrl = "/judgment/" + data.master.Master_ID;
    if (location.pathname !== judgmentUrl) {
      history.pushState({ type: "judgment", masterId: data.master.Master_ID }, "", judgmentUrl);
    }
    renderFullJudgmentView(data);
  } catch (err) {
    if (err.name === "AbortError" || reqId !== activeRequestId) return;
    setLoading(false);
    showMessage("تعذر استدعاء ملف الحكم. يرجى المحاولة لاحقاً.");
  }
}

function renderMultipleJudgments(judgments) {
  const container = document.getElementById("results");
  let html = \`
    <div class="results-header-info">
      <h2>تم العثور على أكثر من طعن مطابق في دوائر مختلفة:</h2>
    </div>
  \`;

  for (const item of judgments) {
    html += \`
      <article class="judgment-card">
        <div class="badges-row">
          <span class="law-badge badge-court">\${escapeHtml(item.Court_Name || "محكمة النقض")}</span>
          <span class="law-badge badge-gold">طعن رقم \${escapeHtml(item.Case_No)}</span>
          <span class="law-badge badge-blue">لسنة \${escapeHtml(item.Case_Year)} قضائية</span>
          \${item.Case_Date ? \`<span class="law-badge badge-gray">\${escapeHtml(item.Case_Date)}</span>\` : ""}
        </div>
        <h3 class="card-title">حكم \${escapeHtml(item.Court_Name)} - طعن رقم \${escapeHtml(item.Case_No)} لسنة \${escapeHtml(item.Case_Year)} ق</h3>
        <div class="card-actions">
          <a href="/judgment/\${item.Master_ID}" class="open-btn" onclick="navigateToJudgment(event, \${item.Master_ID})">
            <span>فتح هذا الحكم</span>
          </a>
          <button type="button" class="tool-btn" data-save-id="\${item.Master_ID}" onclick="toggleSaveFromCard(event, \${item.Master_ID}, '\${escapeHtml(item.Court_Name || 'محكمة النقض')}', \${item.Case_No}, \${item.Case_Year}, '\${escapeHtml(item.Case_Date || '')}')">☆ حفظ</button>
        </div>
      </article>
    \`;
  }
  container.innerHTML = html;
  updateSaveButtons();
}

window.addEventListener("popstate", (e) => {
  if (e.state && e.state.type === "judgment") {
    loadAndRenderJudgment(e.state.masterId);
  } else if (e.state && e.state.type === "search") {
    document.getElementById("query").value = e.state.query;
    restoreSearchOptions(e.state);
    executeTextSearch(e.state.page, { pushHistory: false });
  } else {
    const params = new URLSearchParams(window.location.search);
    if (params.get("tab") === "saved" || window.location.hash === "#saved") {
      setMode("saved");
    } else if (params.has("q")) {
      document.getElementById("query").value = params.get("q");
      restoreSearchOptions({
        courtId: params.get("court"), scope: params.get("scope"), mode: params.get("mode"), sort: params.get("sort"),
        caseNo: params.get("case_no"), caseYear: params.get("case_year"), dateFrom: params.get("date_from"), dateTo: params.get("date_to"),
        chamber: params.get("chamber"), type: params.get("type"), category: params.get("category"),
      });
      executeTextSearch(parseInt(params.get("page") || "1", 10), { pushHistory: false });
    } else {
      cancelActiveRequest();
      document.getElementById("results").innerHTML = "";
      document.getElementById("pagination").style.display = "none";
      hideStats();
    }
  }
});

document.addEventListener("DOMContentLoaded", () => {
  loadCourtOptions();
  updateSavedBadge();
  const params = new URLSearchParams(window.location.search);
  if (params.get("tab") === "saved" || window.location.hash === "#saved") {
    setMode("saved");
  } else if (params.has("q")) {
    document.getElementById("query").value = params.get("q");
    restoreSearchOptions({
      courtId: params.get("court"), scope: params.get("scope"), mode: params.get("mode"), sort: params.get("sort"),
      caseNo: params.get("case_no"), caseYear: params.get("case_year"), dateFrom: params.get("date_from"), dateTo: params.get("date_to"),
      chamber: params.get("chamber"), type: params.get("type"), category: params.get("category"),
    });
    executeTextSearch(parseInt(params.get("page") || "1", 10), { pushHistory: false });
  }
  const queryInput = document.getElementById("query");
  if (queryInput) {
    queryInput.addEventListener("input", onQueryInput);
    queryInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        clearTimeout(debounceTimer);
        lastSearchedQuery = queryInput.value.trim();
        executeTextSearch(1, { pushHistory: true, silent: false });
      }
    });
  }
  document.getElementById("caseYear")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") executeCaseSearch();
  });
  document.getElementById("caseNo")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") executeCaseSearch();
  });

  // Footer court shortcuts (real links, no javascript: URLs).
  document.querySelectorAll("a[data-court]").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      setMode("text");
      document.getElementById("textCourtId").value = link.dataset.court;
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  // Arrow keys switch between the search tabs.
  document.querySelector(".search-tabs")?.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    setMode(currentMode === "text" ? "case" : "text");
    document.getElementById(currentMode === "text" ? "tabText" : "tabCase")?.focus();
  });
});
</script>
</body>
</html>`;
}
