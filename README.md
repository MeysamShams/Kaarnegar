# کارنگار

برنامهٔ آفلاین ویندوز برای ثبت زمان و محاسبهٔ درآمد، با رابط فارسی، راست‌به‌چپ و فونت آراد.

![نمای اصلی کارنگار](docs/dashboard.png)

- شروع، مکث، ادامه و توقف زمان‌سنج با عنوان فعالیت
- ویجت کوچک همیشه روی پنجره‌ها
- ثبت دستی، ویرایش و حذف زمان با تأیید حذف
- نرخ ساعتی به تومان (IRT)، با حفظ نرخ هر ثبت
- انتخاب تاریخ جلالی؛ بازه‌های امروز، هفته از شنبه، ماه شمسی و بازهٔ دلخواه
- گزارش جزئیات، مجموع زمان و مبلغ، جست‌وجو و نمودار سهم فعالیت‌ها
- خروجی PDF فارسی با فونت جاسازی‌شده و متن قابل انتخاب
- پشتیبان‌گیری و بازیابی فایل JSON

## اجرا

فایل `release/Kaarnegar.exe` را باز کنید؛ نیازی به نصب یا اینترنت نیست. میان‌بر «کارنگار» روی دسکتاپ به این فایل اشاره می‌کند.

در تنظیمات نام و نرخ ساعتی خود را ذخیره کنید، سپس عنوان فعالیت را وارد و زمان‌سنج را شروع کنید. «توقف و ذخیره» فعالیت را وارد گزارش می‌کند. مکث، بستن برنامه و خواب دستگاه، زمان‌سنج را مکث می‌کنند؛ برای ادامه دکمهٔ ادامه را بزنید.

نرخ فعالیت در زمان شروع یا ثبت دستی ذخیره می‌شود. تغییر تنظیمات نرخ، گزارش‌های قبلی یا زمان‌سنج جاری را تغییر نمی‌دهد. نرخ یک ثبت را می‌توانید از دکمهٔ ویرایش همان ثبت تغییر دهید.

زمان‌های عبورکرده از نیمه‌شب، بر اساس روز محلی دستگاه تقسیم می‌شوند. گزارش شامل زمان‌های ذخیره‌شده است. مبالغ از مدت دقیق محاسبه و برای نمایش به نزدیک‌ترین تومان گرد می‌شوند. تمام مقادیر پولی تومان هستند، نه ریال. ثبت دستی حداکثر ۲۴ ساعت است؛ کار چندروزه را در چند ثبت وارد کنید.

اطلاعات در `%APPDATA%/kaarnegar/work-data.json` ذخیره می‌شود. قبل از هر نوشتن نسخهٔ قبلی در `.bak` نگه‌داری می‌شود. مسیر دقیق در تنظیمات نمایش داده می‌شود. برای حفاظت از اطلاعات، فایل پشتیبان را دوره‌ای در محل دیگری ذخیره کنید. بازیابی، اطلاعات فعلی را جایگزین می‌کند.

زمان‌سنج هر ۱۵ ثانیه ذخیره می‌شود. در قطع برق یا بسته‌شدن غیرمنتظره، زمان تا آخرین ذخیره بازیابی می‌شود و فعالیت در حالت مکث باز می‌شود. زمان تأییدنشدهٔ باقی‌مانده را دستی اضافه کنید.

## Development

Node.js 22+ is required for development only.

```powershell
npm ci
npm run build
npm start
npm test
npm run test:app
npm run package
```

`npm run dev` provides a browser preview. Native PDF saving, restore dialogs and always-on-top are desktop features. Production runs in Electron with context isolation, sandboxing and no renderer Node access. User data is local; no server or analytics is used.

Application tests use an isolated temporary data directory. Screenshots and an actual Persian PDF are generated in `test-artifacts`. They never write to your real work history.

Arad font: [official source](https://github.com/MDarvishi5124/Arad), bundled under the SIL Open Font License. License included in `public/fonts/OFL.txt`. PDF rendering uses [Electron printToPDF](https://www.electronjs.org/docs/latest/api/web-contents/#contentsprinttopdfoptions).

The application source is MIT licensed; the bundled font retains its own OFL license. Sample screenshots show fictional test entries.
