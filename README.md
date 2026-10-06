# باغ‌یار 🌳

سامانه فارسی و موبایل‌محور مدیریت باغ: ساختار باغ و قطعات، درختان، منابع آب، استخرها، عملیات، برداشت، هزینه و انبار.

## معماری

- **Next.js App Router + TypeScript** برای برنامه اصلی
- **Supabase Postgres + Auth + RLS** برای داده و احراز هویت
- **Vercel** برای استقرار Next.js
- رابط راست‌به‌چپ و سازگار با موبایل، بدون وابستگی UI سنگین

الگوی احراز هویت این پروژه با الگوی فعلی Supabase برای Next.js و `proxy.ts` هماهنگ شده است. در Next.js 16 فایل `proxy.ts` convention اصلی برای این لایه است.

## امکانات نسخه ۱

- ورود و ساخت حساب با ایمیل/رمز
- داشبورد مدیریتی
- ثبت باغ و قطعه
- تقسیم قطعه و حفظ ارتباط تاریخی
- ادغام چند قطعه و حفظ قطعات قبلی به‌عنوان رکورد تاریخی
- ثبت استخر و موجودی آب
- ثبت عملیات باغ
- ثبت برداشت و مقدار تولید
- ثبت هزینه
- ثبت اقلام انبار و هشدار کمبود
- داده نمونه برای شروع سریع
- RLS در سطح کاربر برای جلوگیری از مشاهده/تغییر داده کاربران دیگر
- اسکیمای توسعه‌یافته برای درخت، منابع آب، تانکر/چاه، نیروی انسانی، تجهیزات، آفات، آب‌وهوا و تاریخچه تغییرات

## اجرای محلی

پیش‌نیاز: Node.js 20+.

```bash
npm install
cp .env.example .env.local
npm run dev
```

مقادیر `NEXT_PUBLIC_SUPABASE_URL` و `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` را از بخش Connect پروژه Supabase بردارید.

## راه‌اندازی دیتابیس Supabase

1. در Supabase یک پروژه جدید بسازید.
2. SQL موجود در `supabase/migrations/20261006160000_initial.sql` را در SQL Editor اجرا کنید؛ یا با Supabase CLI به صورت migration اجرا کنید.
3. در Authentication > Providers، Email را فعال کنید.
4. سپس متغیرهای محیطی را در `.env.local` قرار دهید.

تغییرات دیتابیس در فایل migration نگهداری شده‌اند تا نسخه‌بندی و استقرار آن‌ها قابل تکرار باشد.

## استقرار روی GitHub + Vercel

```bash
git init
git add .
git commit -m "Initial BaghYar version"
git branch -M main
git remote add origin https://github.com/YOUR-USER/bagh-yar.git
git push -u origin main
```

سپس Repository را در Vercel Import کنید. Vercel برای Next.js تنظیمات build را به‌طور خودکار تشخیص می‌دهد؛ فقط متغیرهای محیطی زیر را در Vercel اضافه کنید:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

Vercel پروژه Next.js را به صورت خودکار تشخیص می‌دهد و نیازی به تنظیم Build خاصی ندارید.

## نکته مهم درباره ایمیل تأیید

برای راحتی توسعه می‌توانید تأیید ایمیل را در Supabase موقتاً خاموش کنید. برای محیط واقعی بهتر است SMTP و Email Confirmation صحیح تنظیم شوند.

## مسیر توسعه بعدی

هسته دیتابیس از ابتدا برای این موارد جا گذاشته شده است: ردیف/درخت، چاه و تانکر، ورود و خروج آب، سنسورها، آفات و بیماری، نیروی انسانی، ماشین‌آلات، آب‌وهوا، Audit Log و برنامه‌ریزی عملیات.
