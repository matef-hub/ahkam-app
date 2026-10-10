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
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
      position: relative;
    }

    .ambient-glow {
      position: absolute;
      border-radius: 50%;
      filter: blur(65px);
      pointer-events: none;
      z-index: 0;
      opacity: 0.65;
    }

    .ambient-gold {
      width: 340px;
      height: 340px;
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
      padding: 12px 16px;
      box-sizing: border-box;
      overflow: hidden;
      position: relative;
      z-index: 1;
    }

    .maintenance-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      box-shadow: 0 16px 40px -8px rgba(10, 25, 47, 0.08), 0 0 0 1px rgba(179, 135, 40, 0.18);
      max-width: 660px;
      width: 100%;
      padding: 18px 22px 14px;
      text-align: center;
      position: relative;
      box-sizing: border-box;
      animation: cardEntrance 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    @keyframes cardEntrance {
      0% {
        opacity: 0;
        transform: translateY(18px) scale(0.98);
      }
      100% {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .brand-header-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-bottom: 8px;
    }

    .brand-emblem {
      width: 42px;
      height: 42px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--surface-muted);
      border: 1px solid var(--border);
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(10, 25, 47, 0.06);
      animation: emblemFloat 4s ease-in-out infinite;
    }

    @keyframes emblemFloat {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-3px); }
    }

    .maintenance-status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(179, 135, 40, 0.12);
      color: var(--gold-dark);
      border: 1px solid var(--gold-border);
      padding: 3px 12px;
      border-radius: 9999px;
      font-size: 0.76rem;
      font-weight: 700;
    }

    .pulsing-dot {
      width: 6px;
      height: 6px;
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
      font-size: 1.25rem;
      font-weight: 900;
      margin: 0 0 4px 0;
      line-height: 1.3;
    }

    .maintenance-desc {
      color: var(--text-sub);
      font-size: 0.82rem;
      line-height: 1.5;
      margin-bottom: 12px;
    }

    /* كروت إحصائيات الترقية الكبرى */
    .upgrade-stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 10px;
    }

    .stat-pill-card {
      background: linear-gradient(145deg, var(--surface) 0%, var(--surface-muted) 100%);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 8px 6px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      box-shadow: 0 2px 6px rgba(10, 25, 47, 0.04);
      transition: all 0.2s ease;
    }

    .stat-pill-card:hover {
      transform: translateY(-2px);
      border-color: var(--gold-border);
      box-shadow: 0 4px 12px rgba(179, 135, 40, 0.15);
    }

    .stat-icon {
      font-size: 1.1rem;
      line-height: 1;
      margin-bottom: 3px;
    }

    .stat-num {
      color: var(--gold-dark);
      font-size: 1.05rem;
      font-weight: 900;
      letter-spacing: -0.3px;
      line-height: 1.2;
    }

    .stat-label {
      color: var(--primary);
      font-size: 0.72rem;
      font-weight: 700;
      margin-top: 1px;
    }

    /* حاوية المحاور الثلاثة للترقية */
    .upgrade-pillars-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 10px;
      text-align: right;
    }

    .pillar-box {
      background: var(--surface-muted);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 7px 10px;
      box-sizing: border-box;
      transition: border-color 0.2s ease;
    }

    .pillar-box:hover {
      border-color: var(--gold-border);
    }

    .pillar-box-full {
      grid-column: 1 / -1;
    }

    .pillar-header {
      display: flex;
      align-items: center;
      gap: 5px;
      color: var(--primary);
      font-size: 0.78rem;
      font-weight: 800;
      margin-bottom: 3px;
    }

    .pillar-text {
      color: var(--text-muted);
      font-size: 0.72rem;
      line-height: 1.45;
      margin: 0;
    }

    .badge-highlight {
      display: inline-block;
      background: #ffffff;
      border: 1px solid var(--border);
      color: var(--primary);
      padding: 1px 5px;
      border-radius: 4px;
      font-size: 0.68rem;
      font-weight: 700;
      margin-left: 2px;
    }

    .safe-offline-note {
      background: rgba(21, 128, 61, 0.07);
      border: 1px solid rgba(21, 128, 61, 0.2);
      border-radius: 6px;
      padding: 4px 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-size: 0.72rem;
      color: #14532d;
      font-weight: 600;
      margin-bottom: 10px;
    }

    .action-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-bottom: 8px;
    }

    .retry-btn {
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.15);
      padding: 6px 18px;
      border-radius: var(--radius-sm);
      font-family: var(--font-sans);
      font-weight: 700;
      font-size: 0.82rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 3px 10px rgba(10, 25, 47, 0.15);
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .retry-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 14px rgba(10, 25, 47, 0.22);
      background: linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%);
    }

    .retry-icon {
      display: inline-block;
      transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .retry-btn:hover .retry-icon {
      transform: rotate(180deg);
    }

    .maintenance-footer {
      font-size: 0.73rem;
      color: var(--text-muted);
      border-top: 1px solid var(--border-subtle);
      padding-top: 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 6px;
    }

    .contact-link {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      color: var(--primary);
      text-decoration: none;
      font-weight: 700;
      background: var(--surface-muted);
      border: 1px solid var(--border);
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 0.72rem;
      transition: all 0.2s ease;
    }

    .contact-link:hover {
      color: #0a66c2;
      border-color: #0a66c2;
      background: rgba(10, 102, 194, 0.08);
      transform: translateY(-1px);
    }
  </style>
</head>
<body>
  <div class="ambient-glow ambient-gold"></div>
  <div class="ambient-glow ambient-navy"></div>

  <div class="maintenance-wrapper">
    <div class="maintenance-card">
      <div class="brand-header-row">
        <div class="brand-emblem">
          <img src="/logo.svg" alt="شعار أحكام" width="28" height="28">
        </div>
        <div class="maintenance-status-badge">
          <span class="pulsing-dot"></span>
          <span>صيانة وتحديث مجدول للنظام</span>
        </div>
      </div>

      <h1 class="maintenance-title">ترقية وتطوير شامل لمنصة أحكام</h1>
      
      <p class="maintenance-desc">
        نعمل على دمج أضخم قاعدة بيانات قضائية وتشريعية في مصر وربط النصوص بالأحكام التفسيرية الصادرة من المحاكم العليا.
      </p>

      <!-- كروت الإحصائيات بعدد الأحكام والتشريعات والفتاوى -->
      <div class="upgrade-stats-grid">
        <div class="stat-pill-card">
          <span class="stat-icon">⚖️</span>
          <span class="stat-num">67,405</span>
          <span class="stat-label">حكم قضائي معتمد</span>
        </div>
        <div class="stat-pill-card">
          <span class="stat-icon">📜</span>
          <span class="stat-num">164,731</span>
          <span class="stat-label">تشريع وقانون سارٍ</span>
        </div>
        <div class="stat-pill-card">
          <span class="stat-icon">🏛️</span>
          <span class="stat-num">6,572</span>
          <span class="stat-label">فتوى لمجلس الدولة</span>
        </div>
      </div>

      <!-- محاور الترقية الكبرى -->
      <div class="upgrade-pillars-grid">
        <div class="pillar-box">
          <div class="pillar-header">
            <span>🔗</span>
            <span>ربط أنظمة القوانين الرئيسية</span>
          </div>
          <p class="pillar-text">
            ربط قوانين <span class="badge-highlight">المرافعات</span> <span class="badge-highlight">الإثبات</span> <span class="badge-highlight">العقوبات</span> <span class="badge-highlight">الإجراءات</span> <span class="badge-highlight">المدني</span> معلقاً على كل مادة بأحكام المحاكم العليا المفسرة لها.
          </p>
        </div>

        <div class="pillar-box">
          <div class="pillar-header">
            <span>🌍</span>
            <span>التحكيم العربي والدولي</span>
          </div>
          <p class="pillar-text">
            أحكام التحكيم في مجال البترول، وأحكام مركز القاهرة الإقليمي (CRCICA)، وقضاء محكمة استئناف القاهرة (الدائرة 91 تجاري).
          </p>
        </div>

        <div class="pillar-box pillar-box-full">
          <div class="pillar-header">
            <span>🛡️</span>
            <span>فهرس الجرائم الجنائية المتقدم (+3000 جريمة)</span>
          </div>
          <p class="pillar-text">
            فهرسة تفصيلية تشتمل على أكثر من 3000 جريمة، مع القيود والأوصاف المستقاة من قضاء محكمة النقض، والنص التشريعي وتعديلاته وتطبيقاته القضائية.
          </p>
        </div>
      </div>

      <div class="safe-offline-note">
        <span>🛡️</span>
        <span>تم فصل واستقرار قواعد البيانات بأمان كامل أثناء أعمال الترقية. الوقت المتوقع: (${escapeHtml(eta)})</span>
      </div>

      <div class="action-row">
        <button type="button" class="retry-btn" onclick="window.location.reload()">
          <span class="retry-icon">🔄</span>
          <span>إعادة المحاولة</span>
        </button>
      </div>

      <div class="maintenance-footer">
        <span>موسوعة الأحكام القضائية المصرية © ${new Date().getFullYear()}</span>
        <span>للتواصل والمتابعة: 
          <a href="https://www.linkedin.com/in/moateflawyer/" target="_blank" rel="noopener noreferrer" class="contact-link" aria-label="LinkedIn Profile">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
            </svg>
            <span>LinkedIn</span>
          </a>
        </span>
      </div>
    </div>
  </div>
</body>
</html>`;
}
