import { SHARED_STYLES } from "./styles.js";
import { escapeHtml } from "../lib/arabic.js";

export function renderMaintenancePageHtml({ eta = "قريباً", contactEmail = "support@ahkam.app" } = {}) {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>أحكام — النظام في وضع الصيانة والتحديث المجدول</title>
  <meta name="robots" content="noindex, nofollow">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    ${SHARED_STYLES}
    
    html, body {
      height: 100%;
      overflow: hidden;
    }

    .maintenance-wrapper {
      height: 100vh;
      max-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 16px;
      box-sizing: border-box;
      overflow: hidden;
    }

    .maintenance-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      max-width: 540px;
      width: 100%;
      padding: 24px 28px 20px;
      text-align: center;
      position: relative;
      box-sizing: border-box;
    }

    .maintenance-card::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 5px;
      background: linear-gradient(90deg, var(--gold), var(--primary), var(--gold));
    }

    .brand-emblem {
      width: 58px;
      height: 58px;
      margin: 0 auto 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--surface-muted);
      border: 1px solid var(--border);
      border-radius: 50%;
      box-shadow: var(--shadow-sm);
    }

    .maintenance-status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(179, 135, 40, 0.12);
      color: var(--gold-dark);
      border: 1px solid var(--gold-border);
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 700;
      margin-bottom: 12px;
    }

    .pulsing-dot {
      width: 7px;
      height: 7px;
      background-color: var(--gold);
      border-radius: 50%;
      animation: pulse 1.8s infinite;
    }

    @keyframes pulse {
      0% { transform: scale(0.9); opacity: 0.8; }
      50% { transform: scale(1.4); opacity: 1; }
      100% { transform: scale(0.9); opacity: 0.8; }
    }

    .maintenance-title {
      color: var(--primary);
      font-size: 1.35rem;
      font-weight: 900;
      margin: 0 0 8px 0;
      line-height: 1.3;
    }

    .maintenance-desc {
      color: var(--text-sub);
      font-size: 0.9rem;
      line-height: 1.6;
      margin-bottom: 16px;
    }

    .maintenance-details-box {
      background: var(--surface-muted);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 12px 16px;
      text-align: right;
      margin-bottom: 16px;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      font-size: 0.84rem;
      color: var(--text-muted);
      line-height: 1.4;
    }

    .detail-item:last-child {
      margin-bottom: 0;
    }

    .detail-icon {
      font-size: 1rem;
      flex-shrink: 0;
    }

    .maintenance-footer {
      font-size: 0.78rem;
      color: var(--text-muted);
      border-top: 1px solid var(--border-subtle);
      padding-top: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
    }

    .contact-link {
      color: var(--primary);
      text-decoration: none;
      font-weight: 700;
    }

    .contact-link:hover {
      text-decoration: underline;
    }

    .retry-btn {
      background: var(--primary);
      color: #ffffff;
      border: none;
      padding: 8px 20px;
      border-radius: var(--radius-sm);
      font-family: var(--font-sans);
      font-weight: 700;
      font-size: 0.88rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: background-color 0.2s;
    }

    .retry-btn:hover {
      background: var(--primary-light);
    }
  </style>
</head>
<body>
  <div class="maintenance-wrapper">
    <div class="maintenance-card">
      <div class="brand-emblem">
        <img src="/logo.svg" alt="شعار أحكام" width="36" height="36">
      </div>

      <div class="maintenance-status-badge">
        <span class="pulsing-dot"></span>
        <span>صيانة وتحديث مجدول للنظام</span>
      </div>

      <h1 class="maintenance-title">نعمل على تحسين وتطوير منصة أحكام</h1>
      
      <p class="maintenance-desc">
        تخضع منصة أحكام القضائية حالياً لصيانة دورية للبنية التحتية لضمان أعلى درجات السرعة والأمان ودقة محرك البحث الفقهي.
      </p>

      <div class="maintenance-details-box">
        <div class="detail-item">
          <span class="detail-icon">🛡️</span>
          <span><strong>حماية البيانات:</strong> تم فصل واستقرار قواعد البيانات بأمان كامل أثناء أعمال الترقية.</span>
        </div>
        <div class="detail-item">
          <span class="detail-icon">⚡</span>
          <span><strong>تطوير محرك الفهرسة:</strong> تحديث فهارس البحث المتقدمة واستخلاص المبادئ.</span>
        </div>
        <div class="detail-item">
          <span class="detail-icon">🕒</span>
          <span><strong>الوقت المتوقع:</strong> سنعود للعمل بكامل طاقتنا في أقرب وقت (${escapeHtml(eta)}).</span>
        </div>
      </div>

      <div style="margin-bottom: 14px;">
        <button type="button" class="retry-btn" onclick="window.location.reload()">
          <span>🔄 إعادة المحاولة</span>
        </button>
      </div>

      <div class="maintenance-footer">
        <span>موسوعة الأحكام القضائية المصرية © ${new Date().getFullYear()}</span>
        <span>للاستفسار: <a href="mailto:${escapeHtml(contactEmail)}" class="contact-link">${escapeHtml(contactEmail)}</a></span>
      </div>
    </div>
  </div>
</body>
</html>`;
}
