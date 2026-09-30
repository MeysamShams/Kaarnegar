# کارنگار

برنامهٔ آفلاین ویندوز برای ثبت زمان و محاسبهٔ درآمد، با رابط فارسی، راست‌به‌چپ و فونت آراد.

![نمای اصلی کارنگار](docs/dashboard.png)

- شروع، مکث، ادامه و توقف زمان‌سنج با عنوان فعالیت
- ویجت کوچک همیشه روی پنجره‌ها
- ادامهٔ زمان‌سنج در سینی سیستم پس از بستن پنجره، با منوی بازکردن و خروج
- کنترل‌های بستن، کوچک‌کردن، بزرگ‌کردن/بازگرداندن اندازه و ویجت به‌صورت آیکون در سربرگ برنامه، بدون نوار عنوان جداگانه یا نوار پیمایش نمایان
- ثبت دستی، ویرایش و حذف زمان با تأیید حذف
- نرخ ساعتی به تومان (IRT)، با حفظ نرخ هر ثبت
- انتخاب تاریخ جلالی؛ بازه‌های امروز، هفته از شنبه، ماه شمسی و بازهٔ دلخواه
- گزارش جزئیات، مجموع زمان و مبلغ، جست‌وجو و نمودار سهم فعالیت‌ها
- خروجی PDF فارسی با فونت جاسازی‌شده و متن قابل انتخاب
- نام پیش‌فرض PDF بر اساس تاریخ شروع و پایان شمسی گزارش؛ مثلاً `۱۴۰۵-۰۷-۰۱_تا_۱۴۰۵-۰۷-۰۸.pdf`
- پشتیبان‌گیری و بازیابی فایل JSON

## نصب و اجرا

برای نصب، `Kaarnegar-Setup-1.0.2.exe` را از بخش Releases گیت‌هاب دانلود و اجرا کنید. نصب‌کننده امکان انتخاب زبان فارسی یا انگلیسی و مسیر نصب را دارد و میان‌بر «کارنگار» را روی دسکتاپ و منوی شروع ایجاد می‌کند. برنامه و فایل اجرایی آن دارای آیکون اختصاصی هستند.

برای اجرای بدون نصب، از نسخهٔ قابل‌حمل `Kaarnegar.exe` استفاده کنید. فایل‌های ساخته‌شده در پوشهٔ `release` قرار می‌گیرند. نیازی به Node.js، اینترنت یا نصب فونت ندارید؛ آراد در برنامه و فایل‌های PDF جاسازی شده است. حذف برنامه، اطلاعات کار را پاک نمی‌کند.

در تنظیمات نام و نرخ ساعتی خود را ذخیره کنید، سپس عنوان فعالیت را وارد و زمان‌سنج را شروع کنید. «توقف و ذخیره» فعالیت را وارد گزارش می‌کند. بستن پنجره یا Alt+F4 برنامه را در سینی سیستم نگه می‌دارد و زمان‌سنج ادامه پیدا می‌کند. روی آیکون کارنگار کنار ساعت ویندوز کلیک کنید یا از منوی راست‌کلیک «باز کردن برنامه» را انتخاب کنید. برای بستن کامل، «خروج از برنامه» را از همان منو بزنید؛ زمان‌سنج پیش از خروج ذخیره و مکث می‌شود. خواب دستگاه نیز زمان‌سنج را مکث می‌کند. با وجود پنهان‌بودن نوار پیمایش، پیمایش با چرخ ماوس، صفحه‌لمسی و صفحه‌کلید امکان‌پذیر است.

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

`npm run package` builds the Windows x64 installer and portable executable. `npm run package:portable` builds only the portable executable. The committed icon assets include seven Windows sizes (16–256 px); regenerate them with `npm run icons` on Windows.

The NSIS build hook corrects electron-builder's `Persian`/`Farsi` language-name mismatch without editing installed dependencies. `build/installer.nsh` supplies the missing Persian user-selection translations. Installer warnings remain errors.

`npm run dev` provides a browser preview. Native PDF saving, restore dialogs and always-on-top are desktop features. Production runs in Electron with context isolation, sandboxing and no renderer Node access. User data is local; no server or analytics is used.

Application tests use an isolated temporary data directory. Screenshots and an actual Persian PDF are generated in `test-artifacts`. They never write to your real work history.

To run the same workflow against a packaged or installed executable, set `KAARNEGAR_TEST_EXECUTABLE` to its absolute path before running `npm run test:app`. The PDF test checks for actual embedded Arad font resources. Version 1.0.0 was also installed into a temporary folder and its installed executable passed the workflow test; the temporary installation was removed afterward.

Arad font: [official source](https://github.com/MDarvishi5124/Arad), bundled under the SIL Open Font License. License included in `public/fonts/OFL.txt`. PDF rendering uses [Electron printToPDF](https://www.electronjs.org/docs/latest/api/web-contents/#contentsprinttopdfoptions).

The application source is MIT licensed; the bundled font retains its own OFL license. Sample screenshots show fictional test entries.

## Publish on GitHub

Create an empty GitHub repository named `kaarnegar`, then run these commands inside this project, replacing `YOUR_USERNAME` with your account:

```powershell
git remote add origin https://github.com/YOUR_USERNAME/kaarnegar.git
git push -u origin main
git tag v1.0.2
git push origin v1.0.2
```

The included GitHub Actions workflow builds and tests on Windows when a version tag is pushed, or when run manually. Download the `Kaarnegar-Windows` artifact from Actions. Create a GitHub Release for `v1.0.2` and attach `Kaarnegar-Setup-1.0.2.exe` and `Kaarnegar.exe`. Build outputs and personal work data are excluded from Git; distribute binaries through Releases.

The generated executables are unsigned. To distribute signed builds, configure your Windows code-signing credentials and enable `build.win.signExecutable`. The source repository contains no signing certificates or account credentials.

![گزارش زمان و درآمد](docs/reports.png)
