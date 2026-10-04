
import { escapeHtml, safeJsonForHtml } from "../lib/arabic.js";

const SHARED_STYLES = `
:root {
  --bg: #f8fafc;
  --surface: #ffffff;
  --surface-muted: #f1f5f9;
  --border: #e2e8f0;
  --border-focus: #2563eb;
  
  --primary: #1e3a8a;
  --primary-light: #2563eb;
  --primary-accent: #eff6ff;

  --gold: #b45309;
  --gold-bg: #fef3c7;
  --gold-border: #fde68a;

  --text-main: #0f172a;
  --text-muted: #475569;
  --text-sub: #334155;

  --success: #059669;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
  --shadow-md: 0 4px 16px -2px rgba(15, 23, 42, 0.08);
  --radius-lg: 14px;
  --radius-md: 8px;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  background-color: var(--bg);
  background-image: 
    radial-gradient(at 0% 0%, rgba(37, 99, 235, 0.04) 0px, transparent 50%),
    radial-gradient(at 100% 100%, rgba(180, 83, 9, 0.03) 0px, transparent 50%);
  color: var(--text-main);
  font-family: 'Cairo', system-ui, -apple-system, sans-serif;
  line-height: 1.8;
  -webkit-font-smoothing: antialiased;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.container {
  width: min(1140px, calc(100% - 32px));
  margin: auto;
}

.top-dev-bar {
  background: linear-gradient(90deg, #1e3a8a, #0f172a);
  color: #f8fafc;
  padding: 8px 16px;
  font-size: 0.85rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: var(--shadow-sm);
  text-align: center;
}

.top-dev-bar span.dev-name {
  color: #fde047;
  font-weight: 800;
}

.header {
  padding: 24px 0 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
  text-decoration: none;
  color: inherit;
}

.brand-title {
  font-size: 1.55rem;
  font-weight: 900;
  color: var(--primary);
  margin: 0;
  line-height: 1.2;
}

.brand-subtitle {
  color: var(--text-muted);
  font-size: 0.88rem;
  font-weight: 600;
}

.header-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: white;
  border: 1px solid var(--border);
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--success);
  box-shadow: var(--shadow-sm);
}

.status-dot {
  width: 8px;
  height: 8px;
  background: var(--success);
  border-radius: 50%;
  box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.2);
}

.search-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-md);
  margin-top: 10px;
}

.search-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  border-bottom: 2px solid var(--surface-muted);
  padding-bottom: 12px;
}

.tab-btn {
  background: transparent;
  border: none;
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-muted);
  padding: 8px 16px;
  border-radius: var(--radius-md);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.tab-btn:focus-visible {
  outline: 2px solid var(--primary-light);
}

.tab-btn.active {
  background: var(--primary-accent);
  color: var(--primary-light);
}

.search-form {
  display: grid;
  grid-template-columns: repeat(4, minmax(150px, 1fr));
  gap: 12px;
  align-items: center;
}

.search-form:not(.case-form) .input-group {
  grid-column: span 3;
}

.search-form.case-form {
  grid-template-columns: minmax(240px, 280px) 1fr 1fr auto;
}

.advanced-filters {
  grid-column: 1 / -1;
  border-top: 1px solid var(--border);
  padding-top: 12px;
}

.advanced-filters summary {
  cursor: pointer;
  color: var(--primary);
  font-weight: 800;
}

.advanced-filter-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(140px, 1fr));
  gap: 10px;
  margin-top: 12px;
}

.advanced-filter-grid label {
  color: var(--text-muted);
  font-size: 0.78rem;
  font-weight: 700;
}

.advanced-filter-grid input {
  width: 100%;
  margin-top: 4px;
  padding: 9px 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-main);
  font: inherit;
}

.input-group {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.input-icon {
  position: absolute;
  right: 16px;
  color: var(--text-muted);
  width: 20px;
  height: 20px;
  pointer-events: none;
}

select.form-select, input.form-input {
  width: 100%;
  padding: 13px 16px;
  background: var(--surface-muted);
  border: 1.5px solid transparent;
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-main);
  outline: none;
  transition: all 0.2s;
}

select.form-select {
  cursor: pointer;
  white-space: nowrap;
  text-overflow: ellipsis;
  padding-left: 28px;
}

input.form-input.has-icon {
  padding-right: 48px;
}

select.form-select:focus, input.form-input:focus {
  background: white;
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.submit-btn {
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  color: white;
  border: none;
  border-radius: var(--radius-md);
  padding: 13px 26px;
  font-family: inherit;
  font-size: 0.98rem;
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
  transition: all 0.2s;
  white-space: nowrap;
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.submit-btn:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(37, 99, 235, 0.3);
}

.stats-bar {
  display: none;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin: 20px 0;
}

.stat-item {
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 12px 16px;
  box-shadow: var(--shadow-sm);
}

.stat-title {
  color: var(--text-muted);
  font-size: 0.8rem;
  font-weight: 600;
}

.stat-digit {
  font-size: 1.25rem;
  font-weight: 900;
  color: var(--primary);
}

.loading-box {
  display: none;
  text-align: center;
  padding: 36px;
  color: var(--text-muted);
  font-weight: 700;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border);
  border-top-color: var(--primary-light);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 12px;
}

@keyframes spin { to { transform: rotate(360deg); } }

.results-container {
  margin: 20px 0 50px;
}

.results-header-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 8px;
}

.results-header-info h2 {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--primary);
  margin: 0;
}

.judgment-card {
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease-in-out;
}

.judgment-card:hover {
  border-color: #cbd5e1;
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.badges-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.law-badge {
  font-size: 0.78rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
}

.badge-court {
  background: #1e3a8a;
  color: #f8fafc;
  font-weight: 800;
}

.badge-gold {
  background: var(--gold-bg);
  color: var(--gold);
  border: 1px solid var(--gold-border);
}

.badge-blue {
  background: var(--primary-accent);
  color: var(--primary-light);
  border: 1px solid #dbeafe;
}

.badge-gray {
  background: var(--surface-muted);
  color: var(--text-sub);
}

.card-title {
  font-size: 1.12rem;
  font-weight: 800;
  color: var(--text-main);
  margin: 0 0 12px;
}

.card-title a {
  color: inherit;
  text-decoration: none;
}

.card-title a:hover {
  color: var(--primary-light);
}

.match-snippet-box {
  background: var(--surface-muted);
  border-right: 4px solid var(--primary-light);
  border-radius: 6px;
  padding: 12px 16px;
  margin-top: 10px;
  font-size: 0.94rem;
  color: var(--text-sub);
  line-height: 2;
  text-align: justify;
}

.fakra-type-tag {
  display: inline-block;
  font-size: 0.78rem;
  font-weight: 800;
  color: var(--primary);
  background: #dbeafe;
  padding: 2px 8px;
  border-radius: 4px;
  margin-bottom: 4px;
}

.search-hit {
  background: #fef08a;
  color: #854d0e;
  font-weight: 800;
  padding: 1px 4px;
  border-radius: 3px;
}

.card-actions {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.open-btn {
  background: white;
  border: 1.5px solid var(--primary-light);
  color: var(--primary-light);
  font-family: inherit;
  font-weight: 800;
  font-size: 0.88rem;
  padding: 7px 16px;
  border-radius: var(--radius-md);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  transition: all 0.2s;
}

.open-btn:hover {
  background: var(--primary-light);
  color: white;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin: 30px 0;
  flex-wrap: wrap;
}

.pagination-btn {
  background: white;
  border: 1px solid var(--border);
  color: var(--text-main);
  padding: 8px 16px;
  border-radius: var(--radius-md);
  font-family: inherit;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination-btn:not(:disabled):hover {
  background: var(--primary-accent);
  border-color: var(--primary-light);
  color: var(--primary-light);
}

.pagination-info {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-muted);
}

.full-judgment-view {
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 30px;
  box-shadow: var(--shadow-md);
  margin-bottom: 40px;
}

.full-judgment-header {
  border-bottom: 2px solid var(--surface-muted);
  padding-bottom: 16px;
  margin-bottom: 20px;
}

.full-judgment-header h1 {
  font-size: 1.45rem;
  font-weight: 900;
  color: var(--primary);
  margin: 0 0 10px;
}

.judgment-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 16px 0;
  padding: 12px;
  background: var(--surface-muted);
  border-radius: var(--radius-md);
}

.tool-btn {
  background: white;
  border: 1px solid var(--border);
  color: var(--text-sub);
  padding: 6px 14px;
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.tool-btn:hover {
  border-color: var(--primary-light);
  color: var(--primary-light);
}

.tool-btn.locked-feature {
  background: #f8fafc;
  color: #64748b;
  border-color: #cbd5e1;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
}

.tool-btn.locked-feature:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
  color: #475569;
}

.lock-badge {
  background: #fef3c7;
  color: #b45309;
  border: 1px solid #fde68a;
  font-size: 0.72rem;
  font-weight: 800;
  padding: 1px 6px;
  border-radius: 4px;
  margin-right: 4px;
}

.principles-wrapper {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 14px 0 24px;
}

.principle-box {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-right: 4px solid var(--success);
  border-radius: 8px;
  padding: 10px 16px;
  color: #14532d;
  font-size: 0.94rem;
  font-weight: 700;
  line-height: 1.9;
  text-align: justify;
}

a.principle-box {
  display: block;
  text-decoration: none;
}

a.principle-box:hover, a.principle-box:focus-visible {
  border-color: var(--primary-light);
  outline: none;
}

.fakra-row {
  padding: 18px 0;
  border-bottom: 1px solid var(--border);
  color: var(--text-sub);
  font-size: 0.98rem;
}

.fakra-row:last-child { border-bottom: none; }

.fakra-idx {
  margin-bottom: 8px;
}

.back-btn {
  background: var(--surface-muted);
  border: 1px solid var(--border);
  padding: 8px 16px;
  border-radius: var(--radius-md);
  font-family: inherit;
  font-weight: 700;
  font-size: 0.88rem;
  cursor: pointer;
  margin-bottom: 16px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  color: inherit;
}

.empty-state {
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 40px;
  text-align: center;
  color: var(--text-muted);
  font-weight: 600;
}

.toast-msg {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: #0f172a;
  color: #fff;
  padding: 12px 20px;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
  border-right: 4px solid #ef4444;
  z-index: 9999;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events: none;
}

.toast-msg.show {
  opacity: 1;
  transform: translateY(0);
}

.site-footer {
  margin-top: 70px;
  background: #0b1329;
  color: #94a3b8;
  border-top: 3px solid #2563eb;
  padding: 48px 0 24px;
}

.footer-grid {
  display: grid;
  grid-template-columns: 1.8fr 1.2fr 1.2fr;
  gap: 32px;
  margin-bottom: 36px;
}

.footer-col h3 {
  color: #f8fafc;
  font-size: 1.05rem;
  font-weight: 800;
  margin: 0 0 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.footer-desc {
  line-height: 2;
  font-size: 0.88rem;
  color: #cbd5e1;
  text-align: justify;
}

.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-links li {
  margin-bottom: 12px;
}

.footer-links a {
  color: #cbd5e1;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: color 0.2s, transform 0.2s;
}

.footer-links a:hover {
  color: #60a5fa;
  transform: translateX(-4px);
}

.disclaimer-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-right: 3px solid #ef4444;
  border-radius: 8px;
  padding: 14px 16px;
  font-size: 0.82rem;
  line-height: 1.9;
  color: #94a3b8;
  text-align: justify;
}

.footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
}

.footer-bottom-copy {
  font-size: 0.85rem;
  color: #64748b;
}

@media print {
  .top-dev-bar, .header, .search-card, .judgment-toolbar, .back-btn, .site-footer {
    display: none !important;
  }
  body {
    background: white !important;
    color: black !important;
  }
  .full-judgment-view {
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
  }
}

@media (max-width: 820px) {
  .search-form, .search-form.case-form { grid-template-columns: 1fr; }
  .search-form:not(.case-form) .input-group { grid-column: auto; }
  .advanced-filter-grid { grid-template-columns: 1fr; }
  .stats-bar { grid-template-columns: 1fr; }
  .footer-grid { grid-template-columns: 1fr; gap: 28px; }
  .toast-msg { right: 16px; left: 16px; bottom: 16px; justify-content: center; }
}
`;

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

<div class="top-dev-bar">
  <span>⚖️ إشراف وبناء قاعدة البيانات:</span>
  <span class="dev-name">أ / محمد عاطف محمد</span>
  <span>(محامٍ ومطور برمجيات)</span>
</div>

<div class="container">
  <header class="header">
    <a href="/" class="brand">
      <div style="width: 50px; height: 50px; display:flex; align-items:center; justify-content:center;">
        <img src="/favicon.svg" alt="شعار الموسوعة" width="48" height="48">
      </div>
      <div>
        <h1 class="brand-title">موسوعة الأحكام القضائية المصرية</h1>
        <div class="brand-subtitle">محكمة النقض • الدستورية العليا • مجلس الدولة</div>
      </div>
    </a>
    <div class="header-status" role="status">
      <span class="status-dot"></span>
      <span>قاعدة الأحكام متاحة للبحث</span>
    </div>
  </header>

  ${stats ? `
  <section class="stats-bar" style="display:grid; margin:0 0 18px;" aria-label="إحصاءات قاعدة الأحكام">
    <div class="stat-item"><div class="stat-title">الأحكام المتاحة</div><div class="stat-digit">${escapeHtml(stats.judgments.toLocaleString("ar-EG"))}</div></div>
    <div class="stat-item"><div class="stat-title">المبادئ المستخلصة</div><div class="stat-digit">${escapeHtml(stats.principles.toLocaleString("ar-EG"))}</div></div>
    <div class="stat-item"><div class="stat-title">المحاكم المتاحة</div><div class="stat-digit">${escapeHtml(stats.courts.toLocaleString("ar-EG"))}</div></div>
  </section>` : ""}

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
    </div>

    <!-- Text Search Form -->
    <div id="textSearch" class="search-form" role="tabpanel">
      <label for="textCourtId" class="sr-only">اختر المحكمة أو الدائرة</label>
      <select id="textCourtId" class="form-select">
        <option value="">جميع المحاكم والدوائر القضائية</option>
        <option value="1,29">احكام النقض المدنى</option>
        <option value="2,30">احكام النقض الجنائي</option>
        <option value="4,25">الدستورية العليا</option>
        <option value="3,37">الإدارية العليا</option>
        <option value="31,36,47">القضاء الإداري</option>
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

      <button id="btnTextSearch" class="submit-btn" onclick="executeTextSearch(1)">
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
      <label for="caseCourtId" class="sr-only">اختر الدائرة القضائية</label>
      <select id="caseCourtId" class="form-select">
        <option value="">جميع الدوائر</option>
        <option value="1">النقض المدني</option>
        <option value="2">النقض الجنائي</option>
        <option value="4">المحكمة الدستورية العليا</option>
        <option value="3">المحكمة الإدارية العليا</option>
        <option value="31">أحكام القضاء الإداري</option>
        <option value="21">المحكمة العليا</option>
        <option value="25">سوابق المحكمة الدستورية العليا</option>
        <option value="29">سوابق النقض المدني</option>
        <option value="30">سوابق النقض الجنائي</option>
        <option value="35">أحكام الدعم والإغراق</option>
        <option value="36">سوابق القضاء الإداري</option>
        <option value="37">سوابق المحكمة الإدارية العليا</option>
        <option value="47">أحكام المحكمة الإدارية</option>
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
        <h3>🏛️ النطاق القضائي</h3>
        <ul class="footer-links">
          <li><a href="/" data-court="1,29"><span style="color:#3b82f6;">▪</span> محكمة النقض (الدوائر المدنية + السوابق)</a></li>
          <li><a href="/" data-court="2,30"><span style="color:#3b82f6;">▪</span> محكمة النقض (الدوائر الجنائية + السوابق)</a></li>
          <li><a href="/" data-court="4,25"><span style="color:#3b82f6;">▪</span> المحكمة الدستورية العليا + سوابقها</a></li>
          <li><a href="/" data-court="3,31,36,37,47"><span style="color:#3b82f6;">▪</span> مجلس الدولة (كل المحاكم والسوابق)</a></li>
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
</footer>

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
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06F0));
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
  const tabText = document.getElementById("tabText");
  const tabCase = document.getElementById("tabCase");

  if (mode === "text") {
    textSearch.style.display = "grid";
    caseSearch.style.display = "none";
    tabText.classList.add("active");
    tabText.setAttribute("aria-selected", "true");
    tabCase.classList.remove("active");
    tabCase.setAttribute("aria-selected", "false");
    document.getElementById("query").focus();
  } else {
    textSearch.style.display = "none";
    caseSearch.style.display = "grid";
    tabCase.classList.add("active");
    tabCase.setAttribute("aria-selected", "true");
    tabText.classList.remove("active");
    tabText.setAttribute("aria-selected", "false");
    document.getElementById("caseNo").focus();
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
    options.dateFrom, options.dateTo, options.chamber, options.type, options.category].join("\u001f");
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
}

function sortLabel(sort) {
  return ({ relevance: "الأكثر صلة", newest: "الأحدث", oldest: "الأقدم" })[sort] || "الأكثر صلة";
}

async function executeTextSearch(page = 1, { pushHistory = true, cursor = undefined } = {}) {
  const query = document.getElementById("query").value.trim();
  const searchOptions = selectedSearchOptions();
  const { courtId, scope, mode, sort } = searchOptions;

  if (!query) {
    showToast("يرجى إدخال نص للبحث أولاً");
    document.getElementById("query").focus();
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
    const effectiveCursor = cursor === undefined ? searchCursors.get(stateKey + "\u001f" + page) : cursor;
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

    searchCursors.set(stateKey + "\u001f" + page, effectiveCursor || null);
    if (data.next_cursor) searchCursors.set(stateKey + "\u001f" + (page + 1), data.next_cursor);
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
      <article class="judgment-card">
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
        </div>
      </article>
    \`;
  }

  container.innerHTML = html;
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
  nav.innerHTML = \`
    <button class="pagination-btn" \${data.page <= 1 ? "disabled" : ""} onclick="executeTextSearch(\${data.page - 1})">
      <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>
      <span>الصفحة السابقة</span>
    </button>
    <span class="pagination-info">صفحة \${data.page} من \${totalPages}</span>
    <button class="pagination-btn" \${!data.has_more ? "disabled" : ""} onclick="executeTextSearch(\${data.page + 1})">
      <span>الصفحة التالية</span>
      <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"/></svg>
    </button>
  \`;
}

function copySearchResultLink(masterId) {
  copyToClipboard(new URL("/judgment/" + masterId, window.location.origin).href, "تم نسخ رابط الحكم");
}

async function loadCourtOptions() {
  try {
    const response = await fetch("/api/courts");
    if (!response.ok) return;
    const data = await response.json();
    if (!Array.isArray(data.courts)) return;

    const textSelect = document.getElementById("textCourtId");
    const textValue = textSelect.dataset.selectedCourt || textSelect.value;
    const group = document.createElement("optgroup");
    group.label = "المحاكم المتاحة";
    for (const court of data.courts) {
      const option = document.createElement("option");
      option.value = String(court.Court_ID);
      option.textContent = court.Court_Name;
      group.appendChild(option);
    }
    textSelect.appendChild(group);
    textSelect.value = textValue;

    const caseSelect = document.getElementById("caseCourtId");
    const caseValue = caseSelect.value;
    while (caseSelect.options.length > 1) caseSelect.remove(1);
    for (const court of data.courts) {
      const option = document.createElement("option");
      option.value = String(court.Court_ID);
      option.textContent = court.Court_Name;
      caseSelect.appendChild(option);
    }
    caseSelect.value = caseValue;
  } catch {
    // Static court shortcuts remain available if the optional enhancement fails.
  }
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
  if (!/^\d+$/.test(no) || !/^\d+$/.test(yr)) {
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
        </div>
      </article>
    \`;
  }
  container.innerHTML = html;
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
    if (params.has("q")) {
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
  const params = new URLSearchParams(window.location.search);
  if (params.has("q")) {
    document.getElementById("query").value = params.get("q");
    restoreSearchOptions({
      courtId: params.get("court"), scope: params.get("scope"), mode: params.get("mode"), sort: params.get("sort"),
      caseNo: params.get("case_no"), caseYear: params.get("case_year"), dateFrom: params.get("date_from"), dateTo: params.get("date_to"),
      chamber: params.get("chamber"), type: params.get("type"), category: params.get("category"),
    });
    executeTextSearch(parseInt(params.get("page") || "1", 10), { pushHistory: false });
  }
  document.getElementById("query").addEventListener("keydown", (e) => {
    if (e.key === "Enter") executeTextSearch(1);
  });
  document.getElementById("caseYear").addEventListener("keydown", (e) => {
    if (e.key === "Enter") executeCaseSearch();
  });
  document.getElementById("caseNo").addEventListener("keydown", (e) => {
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

  // Arrow keys switch between the two search tabs.
  document.querySelector(".search-tabs").addEventListener("keydown", (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    setMode(currentMode === "text" ? "case" : "text");
    document.getElementById(currentMode === "text" ? "tabText" : "tabCase").focus();
  });
});
</script>
</body>
</html>`;
}

function toIsoDate(value) {
  const s = String(value ?? "").trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return m[1] + "-" + m[2] + "-" + m[3];
  m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/);
  if (m) return m[3] + "-" + m[2].padStart(2, "0") + "-" + m[1].padStart(2, "0");
  return undefined;
}

export function renderJudgmentPageHtml(data) {
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
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">

<style>${SHARED_STYLES}</style>
</head>
<body>

<div class="top-dev-bar">
  <span>⚖️ إشراف وبناء قاعدة البيانات:</span>
  <span class="dev-name">أ / محمد عاطف محمد</span>
  <span>(محامٍ ومطور برمجيات)</span>
</div>

<div class="container">
  <header class="header">
    <a href="/" class="brand">
      <div style="width: 50px; height: 50px; display:flex; align-items:center; justify-content:center;">
        <img src="/favicon.svg" alt="شعار الموسوعة" width="48" height="48">
      </div>
      <div>
        <div class="brand-title">موسوعة الأحكام القضائية المصرية</div>
        <div class="brand-subtitle">محكمة النقض • الدستورية العليا • مجلس الدولة</div>
      </div>
    </a>
  </header>

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
          <button class="tool-btn" onclick="window.print()">🖨️ طباعة الحكم</button>
        </div>
      </header>

      ${master.Master_Text ? `
      <div style="background:var(--surface-muted); padding:16px 20px; border-radius:8px; margin-bottom:20px; font-weight:600; color:var(--text-sub); text-align:justify;">
        <strong style="color:var(--primary); display:block; margin-bottom:6px;">ملخص / وقائع الدعوى:</strong>
        ${escapeHtml(master.Master_Text)}
      </div>
      ` : ""}

      ${data.principles && data.principles.length ? `
      <h2 style="color:var(--primary); font-size:1.25rem; margin: 24px 0 10px;">المبادئ القانونية المستخلصة</h2>
      <div class="principles-wrapper">
        ${data.principles.map(p => `<div class="principle-box">⚖️ ${escapeHtml(p.Mogz_Text)}</div>`).join("")}
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

      ${data.related && data.related.length ? `
      <section aria-labelledby="related-judgments-heading">
        <h2 id="related-judgments-heading" style="color:var(--primary); font-size:1.25rem; margin:28px 0 12px;">أحكام ذات صلة من المحكمة نفسها</h2>
        <div class="principles-wrapper">
          ${data.related.map(item => `<a class="principle-box" href="/judgment/${escapeHtml(item.Master_ID)}">${escapeHtml(item.Court_Name || "المحكمة")} — الطعن رقم ${escapeHtml(item.Case_No)} لسنة ${escapeHtml(item.Case_Year)}${item.Case_Date ? ` — ${escapeHtml(item.Case_Date)}` : ""}</a>`).join("")}
        </div>
      </section>` : ""}
    </article>
  </main>
</div>

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
    </div>
  </div>
</footer>

<script>
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
</script>
</body>
</html>`;
}
