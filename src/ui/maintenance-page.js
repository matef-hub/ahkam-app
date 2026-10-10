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

    body {
      margin: 0;
      background-color: var(--bg);
      background-image: 
        radial-gradient(at 0% 0%, rgba(197, 155, 39, 0.08) 0px, transparent 40%),
        radial-gradient(at 100% 100%, rgba(10, 25, 47, 0.06) 0px, transparent 50%),
        var(--bg-pattern);
      background-size: 100% 100%, 100% 100%, 28px 28px;
      color: var(--text-main);
      font-family: var(--font-sans);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
      position: relative;
    }

    /* خلفيات متحركة دقيقة وناعمة Ambient Floating Orbs */
    .ambient-glow {
      position: absolute;
      border-radius: 50%;
      filter: blur(65px);
      pointer-events: none;
      z-index: 0;
      opacity: 0.65;
    }

    .ambient-gold {
      width: 320px;
      height: 320px;
      background: radial-gradient(circle, rgba(197, 155, 39, 0.22) 0%, rgba(197, 155, 39, 0.02) 70%);
      top: -60px;
      right: -60px;
      animation: floatSlow 12s ease-in-out infinite alternate;
    }

    .ambient-navy {
      width: 380px;
      height: 380px;
      background: radial-gradient(circle, rgba(10, 25, 47, 0.14) 0%, rgba(10, 25, 47, 0.01) 70%);
      bottom: -80px;
      left: -80px;
      animation: floatSlowReverse 14s ease-in-out infinite alternate;
    }

    @keyframes floatSlow {
      0% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(-30px, 40px) scale(1.08); }
      100% { transform: translate(20px, 60px) scale(0.95); }
    }

    @keyframes floatSlowReverse {
      0% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(35px, -35px) scale(1.1); }
      100% { transform: translate(-20px, -50px) scale(0.92); }
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
      position: relative;
      z-index: 1;
    }

    .maintenance-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      box-shadow: 0 20px 45px -10px rgba(10, 25, 47, 0.12), 0 0 0 1px rgba(179, 135, 40, 0.16);
      max-width: 540px;
      width: 100%;
      padding: 24px 28px 20px;
      text-align: center;
      position: relative;
      box-sizing: border-box;
      animation: cardEntrance 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    @keyframes cardEntrance {
      0% {
        opacity: 0;
        transform: translateY(22px) scale(0.97);
      }
      100% {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .maintenance-card::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 5px;
      background: linear-gradient(90deg, var(--gold), var(--primary), var(--gold), var(--primary));
      background-size: 300% 100%;
      animation: shimmerBar 4s linear infinite;
    }

    @keyframes shimmerBar {
      0% { background-position: 0% 50%; }
      100% { background-position: 100% 50%; }
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
      box-shadow: 0 4px 14px rgba(10, 25, 47, 0.08);
      position: relative;
      animation: emblemFloat 4s ease-in-out infinite;
    }

    @keyframes emblemFloat {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-4px); }
    }

    .brand-emblem img {
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .brand-emblem:hover img {
      transform: scale(1.1) rotate(5deg);
    }

    .maintenance-status-badge {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      background: rgba(179, 135, 40, 0.12);
      color: var(--gold-dark);
      border: 1px solid var(--gold-border);
      padding: 4px 14px;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 700;
      margin-bottom: 12px;
      box-shadow: 0 2px 8px rgba(179, 135, 40, 0.12);
    }

    .pulsing-dot {
      width: 7px;
      height: 7px;
      background-color: var(--gold);
      border-radius: 50%;
      position: relative;
    }

    .pulsing-dot::after {
      content: "";
      position: absolute;
      top: -3px;
      left: -3px;
      right: -3px;
      bottom: -3px;
      border-radius: 50%;
      background: var(--gold);
      opacity: 0.6;
      animation: ripple 1.8s ease-out infinite;
    }

    @keyframes ripple {
      0% { transform: scale(0.8); opacity: 0.8; }
      100% { transform: scale(2.2); opacity: 0; }
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
      box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.02);
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      font-size: 0.84rem;
      color: var(--text-muted);
      line-height: 1.4;
      transition: transform 0.2s ease, color 0.2s ease;
    }

    .detail-item:hover {
      transform: translateX(-3px);
      color: var(--text-main);
    }

    .detail-item:last-child {
      margin-bottom: 0;
    }

    .detail-icon {
      font-size: 1rem;
      flex-shrink: 0;
      display: inline-block;
      transition: transform 0.3s ease;
    }

    .detail-item:hover .detail-icon {
      transform: scale(1.2);
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
      transition: color 0.2s;
    }

    .contact-link:hover {
      color: var(--gold-dark);
      text-decoration: underline;
    }

    .retry-btn {
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.15);
      padding: 8px 22px;
      border-radius: var(--radius-sm);
      font-family: var(--font-sans);
      font-weight: 700;
      font-size: 0.88rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 7px;
      box-shadow: 0 4px 12px rgba(10, 25, 47, 0.18);
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .retry-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(10, 25, 47, 0.26);
      background: linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%);
    }

    .retry-btn:active {
      transform: translateY(0);
      box-shadow: 0 2px 6px rgba(10, 25, 47, 0.18);
    }

    .retry-icon {
      display: inline-block;
      transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .retry-btn:hover .retry-icon {
      transform: rotate(180deg);
    }
  </style>
</head>
<body>
  <div class="ambient-glow ambient-gold"></div>
  <div class="ambient-glow ambient-navy"></div>

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
          <span class="retry-icon">🔄</span>
          <span>إعادة المحاولة</span>
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
