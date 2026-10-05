export const SHARED_STYLES = `
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.header-saved-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: white;
  border: 1.5px solid #fde68a;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 700;
  color: #b45309;
  text-decoration: none;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
}

.header-saved-btn:hover {
  background: #fffbeb;
  border-color: #f59e0b;
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.saved-count-pill {
  background: #f59e0b;
  color: white;
  border-radius: 999px;
  padding: 1px 7px;
  font-size: 0.76rem;
  font-weight: 800;
  min-width: 18px;
  text-align: center;
  display: inline-block;
  line-height: 1.4;
}

.saved-panel {
  display: none;
  animation: fadeIn 0.2s ease;
}

.saved-card-item {
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-md);
  padding: 14px 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  transition: all 0.2s ease;
}

.saved-card-item:hover {
  border-color: var(--primary-accent);
  box-shadow: var(--shadow-sm);
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
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 10px;
  margin: 18px 0;
}

.stat-item {
  background: white;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-md);
  padding: 12px 14px;
  box-shadow: var(--shadow-sm);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: right;
  position: relative;
}

.stat-item.interactive {
  cursor: pointer;
  user-select: none;
  font-family: inherit;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border: 1.5px solid var(--border);
  outline: none;
  background: #ffffff;
}

.stat-item.interactive:hover {
  transform: translateY(-2px);
  border-color: var(--primary-light);
  box-shadow: 0 4px 14px rgba(15, 42, 74, 0.08);
}

.stat-item.interactive:focus-visible {
  outline: 2px solid var(--primary-light);
  outline-offset: 2px;
}

.stat-item.interactive.active {
  border-color: var(--primary);
  background: #f0f7ff;
  box-shadow: 0 0 0 2px rgba(15, 42, 74, 0.12), 0 4px 12px rgba(15, 42, 74, 0.06);
}

.stat-item.interactive.active .stat-title {
  color: var(--primary);
  font-weight: 700;
}

.stat-item.interactive.active .stat-digit {
  color: var(--primary);
}

.stat-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-muted);
  margin-top: 4px;
}

.stat-item.interactive.active .stat-badge {
  color: var(--primary-light);
  font-weight: 700;
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
