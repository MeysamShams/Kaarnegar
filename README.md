<p align="center">
  <img src="public/icon.png" width="88" alt="Kaarnegar icon" />
</p>

<h1 align="center">Kaarnegar</h1>
<p align="center">Make your time count.</p>
<p align="center">An offline Windows time tracker for organizations and projects, with Persian and English interfaces, local reports, and multiple currencies.</p>
<p align="center"><a href="../../releases">Download for Windows</a> &middot; <a href="#getting-started">Getting started</a> &middot; <a href="#development">Development</a></p>

![Kaarnegar dashboard](docs/dashboard.png)

Kaarnegar keeps everyday time tracking simple: name your task, start the timer, and turn your saved work into a clear report. Everything stays on your computer. No account, server, or internet connection is required to use the app.

## Features

| Feature | What you can do |
| --- | --- |
| Time tracking | Start, pause, resume, and save a task; add or edit time manually. |
| Organizations & projects | Define organizations, add optional projects, and assign every task to an organization. |
| Rates & currencies | Set organization rates and optional project overrides. Track IRT, IRR, USD, EUR, GBP, CAD, AUD, AED, CHF, JPY, and TRY. Each task keeps its recorded rate and currency. |
| Languages | Switch between Persian (RTL, Jalali calendar) and English (LTR, Gregorian calendar). The interface, tray, and PDF reports follow your language. |
| Compact widget | Keep a small, always-on-top timer nearby. Your last window mode and size return on the next launch. |
| Themes | Choose Light, Dark, or System. Dark mode uses charcoal surfaces and soft teal accents; System follows Windows automatically. |
| Windows startup | Enable the startup checkbox in Settings to open Kaarnegar when you sign in to Windows. |
| System tray | Close the window while your timer keeps running. Reopen or quit from the tray menu. |
| Reports | Filter by date, organization, and project. Search tasks, compare tracked time, and see separate totals for each currency. |
| PDF export | Export the filtered report in Persian or English, with embedded Arad fonts and selectable text. |
| Backup and restore | Export your work history to JSON and restore it on another computer. |

English is the default language. The application also supports Persian. Change the language in Settings; your selection is saved for the next launch.

## Getting started

Download a Windows x64 build from [Releases](../../releases):

- **Installer:** `Kaarnegar-Setup-<version>.exe` lets you choose an installation folder and creates desktop and Start menu shortcuts. The installer supports English and Persian.
- **Portable:** `Kaarnegar.exe` runs without installation. Keep it in a stable location if you enable Windows startup, since Windows launches that executable path.

You do not need Node.js or a separate font installation to run either build.

1. Open **Settings** and choose your language and theme. Optionally enable **Launch at Windows startup**. These preferences save immediately.
2. Add an **organization**, its hourly rate, and its currency. Add projects when you want to track work separately.
3. On the timer page, enter a task title, select the required organization and an optional project, then start tracking.
4. Use **Pause** for a break, or **Stop and save** to add the task to your reports. Manual entries also require an organization.
5. Open **Reports**, choose a date range and organization/project filters, and export the matching entries to PDF.

Use the widget button in the window header to switch between the full dashboard and compact mode. Kaarnegar remembers both sizes, the window position, and whether the full window was maximized.

### Dark theme and compact mode

Choose **Dark** in Settings for a calmer workspace, or **System** to follow Windows. The same theme carries through the dashboard, reports, calendar, dialogs, and compact timer.

![Kaarnegar dark theme](docs/dark-dashboard.png)

<p align="center"><img src="docs/widget-dark.png" width="380" alt="Dark compact timer" /></p>

### Closing and quitting

Closing the window or pressing Alt+F4 hides Kaarnegar in the Windows system tray. An active timer continues running and saving checkpoints. Click the tray icon or choose **Open app** from its menu to return.

Choose **Quit app** from the tray menu to exit completely. The timer is saved and paused before exit. Putting the computer to sleep also pauses the timer.

### How time and earnings work

- Each organization has a currency. Projects use that currency and can set an hourly rate override; leaving the project rate blank inherits the organization rate. A zero rate is allowed for unpaid work.
- Entries keep their recorded rate and currency, including when organization/project settings change. A manual entry can override the inherited rate.
- Earnings use the exact tracked duration. IRT, IRR, and JPY display whole units; other supported currencies display up to two decimal places. **Reports total each currency separately and never perform currency conversion.**
- The profile default rate is a starting value for new organizations. It does not change existing organization or project rates.
- Tasks crossing midnight are split by the computer's local date. Reports include saved entries; stop and save the current task to include it.
- A manual entry can contain up to 24 hours. Add separate entries for work spanning multiple days.

## Reports

![English report filtered by organization and project](docs/english-reports.png)

![Time and earnings reports](docs/reports.png)

Reports combine saved task details, organization/project assignments, total time, currency totals, and a chart of time spent per task. Date, search, organization, and project filters also apply to the exported PDF. Filenames use Jalali dates in Persian and Gregorian dates in English. The bundled Arad font is embedded in exported PDFs, so text renders without installing fonts on the recipient's computer.

## Your data

Work history is stored locally in `work-data.json` inside the app's user-data folder, normally `%APPDATA%\kaarnegar`. Settings shows the exact location. The previous version of the work file is retained as `work-data.json.bak` before each write.

Organizations and projects are included in work-history backups. Existing history from earlier versions is automatically assigned to a **General** organization, preserving its original rates, durations, and toman currency. Referenced organizations and projects cannot be deleted until their entries are reassigned or removed.

Theme, language, and window preferences are stored separately in `preferences.json`. Windows manages the startup registration. Work-history backups do not transfer these device preferences or startup registration.

The timer saves a checkpoint every 15 seconds. After a power failure or unexpected termination, the last saved checkpoint returns paused. Any time after that checkpoint can be added manually.

Export backups regularly to another location. **Restoring a backup replaces your current work history and profile settings.** Stop and save the timer before restoring. Uninstalling the app retains your work data.

## Development

Use **Windows** and **Node.js 22 or newer** for development and packaging.

```powershell
npm ci
npm run build
npm start
```

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run the Vite browser preview. |
| `npm run build` | Check TypeScript and build the renderer. |
| `npm start` | Open the built app in Electron. |
| `npm test` | Run model, preference, migration, currency, and localization tests. |
| `npm run test:app` | Run the original Electron workflow and the organizations/currencies/English workflow. Build first. |
| `npm run package` | Build the Windows x64 installer and portable executable. |
| `npm run package:portable` | Build only the portable executable. |
| `npm run icons` | Regenerate Windows icon assets using PowerShell. |

If PowerShell blocks `npm.ps1`, use `npm.cmd` in these commands.

The browser preview supports time tracking and themes using local storage. Windows startup, native save/restore dialogs, and always-on-top window behavior require the Electron app.

### Project layout

```text
src/          React interface, timer model, Jalali dates, report templates
electron/    Desktop lifecycle, IPC bridge, tray, local storage, preferences
tests/       Model, preferences, and Electron integration tests
public/      Application icons and bundled Arad fonts
build/       Installer resources
scripts/     Build helpers and icon generation
docs/        Screenshots and release notes
```

The desktop renderer runs with context isolation, sandboxing, and no Node.js access. Native operations are exposed through the preload bridge.

### Testing

```powershell
npm test
npm run build
npm run test:app
```

Integration tests use a temporary data directory and write screenshots and a real PDF to `test-artifacts/`. They keep your personal work history separate. Startup tests stub Windows registration to avoid changing the test machine's actual startup list.

To test an installed or portable executable, set `KAARNEGAR_TEST_EXECUTABLE` to its absolute path before running `npm run test:app`.

### Building a release

Build outputs are written to `release/`. The included GitHub Actions workflows automate Windows builds and release publishing; see [the workflows](.github/workflows) for their triggers.

The NSIS build helper handles the Persian/Farsi language-name mismatch, and `build/installer.nsh` supplies missing Persian installer strings. Bundled icon assets cover Windows sizes from 16 to 256 pixels.

## License

Kaarnegar is released under the [MIT License](LICENSE). The bundled [Arad font](https://github.com/MDarvishi5124/Arad) is distributed under the [SIL Open Font License](public/fonts/OFL.txt).

Screenshots show fictional sample entries.
