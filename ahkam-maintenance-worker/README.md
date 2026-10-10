# Ahkam Standalone Maintenance Worker (`ahkam-maintenance`)

عامل مستقل تمامًا (Standalone Cloudflare Worker) مخصص لخدمة صفحة صيانة لموقع `ahkam.app`.

---

## 🔒 مبادئ العزل والأمان (Isolation & Zero-D1 Architecture)

1. **صفر اتصال بقاعدة البيانات**:
   - لا يحتوي هذا المشروع على أي اتصال، أو استعلام، أو Binding لـ `[[d1_databases]]`.
   - لا يستورد أي كود من تطبيق البحث أو المصادقة أو الجلسات.
   - مستحيل فيزيائياً أن يستهلك أي قراءات أو عمليات على D1.
2. **استجابة الصيانة الرسمية**:
   - يُرجع كود الاستجابة القياسي `HTTP 503 Service Unavailable`.
   - ترويسات أمان كاملة ومشددة (`Content-Security-Policy`, `X-Content-Type-Options`, `HSTS`, `Referrer-Policy`).
   - ترويسة `Retry-After: 3600`.
   - منع التخزين المؤقت للمسارات الديناميكية `Cache-Control: no-store, no-cache, must-revalidate`.
3. **تصميم وهوية أحكام القضائية**:
   - واجهة مستخدم عربية (RTL) متجاوبة بالكامل.
   - أيقونة وشعار المنصة مدمج داخلياً (`SVG`) دون الاعتماد على خوادم خارجية.
   - زر إعادة محاولة يقوم فقط بتحديث المتصفح (`window.location.reload()`) دون أي استعلام خلفي.

---

## 💻 طريقة التشغيل والاختبار محلياً (Local Testing)

داخل مجلد المشروع المستقل:

```bash
cd ahkam-maintenance-worker
npx wrangler dev
```

أو تشغيل اختبار التحقق الآلي في المشروع الرئيسي:

```bash
node --test test/maintenance-standalone.test.js
```

---

## 🚀 كيفية النشر الآمن على `workers.dev` (المرحلة الأولى)

عندما تقرر نشر الـ Worker للاختبار المعزول **دون ربطه بالنطاق الرئيسي**:

1. افتح موجه الأوامر في مجلد `ahkam-maintenance-worker`:
   ```bash
   cd ahkam-maintenance-worker
   ```
2. نفّذ أمر النشر:
   ```bash
   npx wrangler deploy
   ```
3. سيعطيك Cloudflare رابطاً على النطاق الفرعي التجريبي فقط، مثل:
   `https://ahkam-maintenance.<your-subdomain>.workers.dev`
4. يمكنك زيارة الرابط والتأكد من ظهور صفحة الصيانة وعمل زر التحديث والأيقونات بشكل سليم تماماً.

---

## 🌐 خطوات ربطه بالنطاق `ahkam.app` (في مرحلة منفصلة لاحقاً)

إذا أردت تفعيل صفحة الصيانة على النطاق الرسمي `ahkam.app`:

### الخيار (أ) - عبر لوحة تحكم Cloudflare Dashboard (الخيار الموصى به والأكثر أماناً):
1. ادخل إلى [Cloudflare Dashboard](https://dash.cloudflare.com) واختر حسابك.
2. اذهب إلى **Workers & Pages** ثم اختر الـ Worker الجديد: **`ahkam-maintenance`**.
3. انتقل إلى تبويب **Settings** -> **Domains & Routes**.
4. اضغط على **Add** -> **Custom Domain**.
5. أدخل `ahkam.app` وقم بالحفظ.
6. ستقوم Cloudflare بتوجيه الزوار للـ Worker الجديد فوراً.
*(وعند انتهاء الصيانة، يكفي إعادة ربط Custom Domain بالـ Worker الأصلي `legal-api`).*

### الخيار (ب) - عبر تعديل `wrangler.toml` في هذا المجلد:
أضف السطور التالية في نهاية ملف `ahkam-maintenance-worker/wrangler.toml`:
```toml
routes = [
  { pattern = "ahkam.app", custom_domain = true }
]
```
ثم نفّذ:
```bash
npx wrangler deploy
```
*(ملاحظة: لا تنفذ هذه الخطوة إلا بعد اتخاذ قرار تحويل النطاق الفعلي).*
