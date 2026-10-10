const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  powerMonitor,
  Menu,
  nativeTheme,
  screen,
} = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const {
  readPreferences,
  writePreferences,
  loginOptions,
  startupEnabled,
} = require("./preferences.cjs");
const { validate } = require("./validation.cjs");
const { syncFolder } = require("./sync.cjs");
const os = require("node:os");
const crypto = require("node:crypto");
const {
  initializeTray,
  updateTrayLanguage,
  showApp,
  destroyTray,
} = require("./tray.cjs");
if (process.env.KAARNEGAR_DATA_DIR)
  app.setPath("userData", process.env.KAARNEGAR_DATA_DIR);
const locked = app.requestSingleInstanceLock();
if (!locked) app.quit();
let win,
  state,
  loadError = "",
  compact = false,
  normalBounds,
  normalMaximized = false,
  quitting = false;
let preferences,
  switchingMode = false;
const preferencesPath = () =>
  path.join(app.getPath("userData"), "preferences.json");
const nativeText = (fa, en) => (preferences?.language === "en" ? en : fa);
const startupOptions = () => loginOptions(app);
const launchOnStartup = () => {
  if (process.platform !== "win32") return false;
  return startupEnabled(app, startupOptions());
};
function saveWindow() {
  if (!win || win.isDestroyed() || switchingMode) return;
  const bounds =
    win.isMaximized() || win.isMinimized()
      ? win.getNormalBounds()
      : win.getBounds();
  // On scaled Windows displays, native bounds can differ from Electron's size by a few pixels.
  if (!win.isMaximized() && !win.isMinimized())
    [bounds.width, bounds.height] = win.getSize();
  preferences = {
    ...preferences,
    compact,
    normalMaximized: compact ? normalMaximized : win.isMaximized(),
    [compact ? "compactBounds" : "normalBounds"]: bounds,
  };
  writePreferences(preferencesPath(), preferences);
}
function visibleBounds(bounds, small) {
  if (!bounds) return {};
  const display = screen.getDisplayMatching(bounds).workArea;
  const width = Math.min(
    Math.max(bounds.width, small ? 390 : 1000),
    display.width,
  );
  const height = Math.min(
    Math.max(bounds.height, small ? 360 : 720),
    display.height,
  );
  return {
    width,
    height,
    x: Math.max(
      display.x,
      Math.min(bounds.x, display.x + display.width - width),
    ),
    y: Math.max(
      display.y,
      Math.min(bounds.y, display.y + display.height - height),
    ),
  };
}
const dataPath = () => path.join(app.getPath("userData"), "work-data.json");
function write(s) {
  validate(s);
  const p = dataPath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  if (fs.existsSync(p)) fs.copyFileSync(p, p + ".bak");
  fs.writeFileSync(p + ".tmp", JSON.stringify(s, null, 2), "utf8");
  fs.renameSync(p + ".tmp", p);
  state = s;
  scheduleSync();
}
const syncMetaPath = () => path.join(app.getPath("userData"), "sync-state.json");
let syncStatus = { enabled: false, lastSync: null, devices: 0, error: "" },
  syncTimer,
  syncRunning = false;
const publicSync = () => ({
  folder: preferences?.syncFolder ?? "",
  ...syncStatus,
  enabled: !!preferences?.syncFolder,
});
function scheduleSync(delay = 3000) {
  if (!preferences?.syncFolder) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => runSync(), delay);
}
function runSync() {
  const folder = preferences?.syncFolder;
  if (!folder || syncRunning || !state) return publicSync();
  syncRunning = true;
  try {
    let meta = { known: {}, deleted: {}, seen: {} };
    try {
      meta = JSON.parse(fs.readFileSync(syncMetaPath(), "utf8"));
    } catch {}
    const result = syncFolder({
      folder,
      deviceId: preferences.deviceId,
      deviceName: os.hostname(),
      local: state,
      meta,
    });
    if (result.changed) {
      // Keep this device's timer; only shared organizations, projects, and entries come from other devices.
      const merged = validate({ ...result.state, active: state.active });
      const p = dataPath();
      if (fs.existsSync(p)) fs.copyFileSync(p, p + ".bak");
      fs.writeFileSync(p + ".tmp", JSON.stringify(merged, null, 2), "utf8");
      fs.renameSync(p + ".tmp", p);
      state = merged;
      if (win && !win.isDestroyed()) win.webContents.send("synced", state);
    }
    fs.writeFileSync(syncMetaPath(), JSON.stringify(result.meta), "utf8");
    syncStatus = { lastSync: result.lastSync, devices: result.devices, error: "" };
  } catch (e) {
    syncStatus = { ...syncStatus, error: e.message };
  } finally {
    syncRunning = false;
  }
  if (win && !win.isDestroyed()) win.webContents.send("sync-status", publicSync());
  return publicSync();
}
function pause() {
  if (state?.active?.runningSince !== null && state?.active) {
    const a = state.active;
    write({
      ...state,
      active: {
        ...a,
        segments: [
          ...a.segments,
          { start: a.runningSince, end: Math.max(a.runningSince, Date.now()) },
        ],
        runningSince: null,
      },
    });
    if (win && !win.isDestroyed()) win.webContents.send("state", state);
  }
}
function read() {
  for (const p of [dataPath(), dataPath() + ".bak"]) {
    if (!fs.existsSync(p)) continue;
    try {
      state = validate(JSON.parse(fs.readFileSync(p, "utf8")));
      if (p.endsWith(".bak"))
        loadError = "اطلاعات از نسخهٔ پشتیبان بازیابی شد.";
      return;
    } catch {
      loadError =
        "فایل اطلاعات آسیب دیده است. فایل اصلی محفوظ است؛ از تنظیمات نسخهٔ پشتیبان را وارد کنید.";
    }
  }
  state = {
    version: 1,
    rate: 0,
    name: "",
    organizations: [],
    projects: [],
    entries: [],
    active: null,
  };
  if (loadError && fs.existsSync(dataPath()))
    fs.copyFileSync(dataPath(), dataPath() + ".damaged-" + Date.now());
}
if (locked)
  app.whenReady().then(() => {
    read();
    preferences = readPreferences(preferencesPath());
    compact = preferences.compact;
    normalBounds = preferences.normalBounds;
    normalMaximized = preferences.normalMaximized;
    nativeTheme.themeSource = preferences.theme;
    // Explicit quitting pauses before exit. Interrupted processes restore the last checkpoint as paused.
    if (state.active?.runningSince != null) {
      state = { ...state, active: { ...state.active, runningSince: null } };
      write(state);
      loadError =
        "زمان‌سنج پس از بسته‌شدن غیرمنتظره، در حالت مکث بازیابی شد. زمان تأییدنشده را می‌توانید دستی اضافه کنید.";
    }
    Menu.setApplicationMenu(null);
    win = new BrowserWindow({
      show: false,
      width: compact ? 430 : 1320,
      height: compact ? 430 : 900,
      ...visibleBounds(
        compact ? preferences.compactBounds : normalBounds,
        compact,
      ),
      minWidth: compact ? 390 : 1000,
      minHeight: compact ? 360 : 720,
      alwaysOnTop: compact,
      frame: false,
      title: "کارنگار",
      icon: path.join(__dirname, "../dist/icon.png"),
      backgroundColor: nativeTheme.shouldUseDarkColors ? "#101820" : "#f5f6f8",
      autoHideMenuBar: true,
      webPreferences: {
        preload: path.join(__dirname, "preload.cjs"),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        backgroundThrottling: false,
      },
    });
    const restoredBounds = visibleBounds(
      compact ? preferences.compactBounds : normalBounds,
      compact,
    );
    if (restoredBounds.width)
      win.setSize(restoredBounds.width, restoredBounds.height);
    win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    win.webContents.on("will-navigate", (event) => event.preventDefault());
    if (!compact && normalMaximized) win.maximize();
    win.once("ready-to-show", () => win.show());
    nativeTheme.on("updated", () => {
      if (!win.isDestroyed())
        win.setBackgroundColor(
          nativeTheme.shouldUseDarkColors ? "#101820" : "#f5f6f8",
        );
    });
    for (const event of ["resize", "move", "maximize", "unmaximize"])
      win.on(event, () => {
        try {
          saveWindow();
        } catch (e) {
          console.error("Window preferences:", e.message);
        }
      });
    win.loadFile(path.join(__dirname, "../dist/index.html"));
    initializeTray(win, () => app.quit(), preferences.language);
    win.on("maximize", () => win.webContents.send("window-maximized", true));
    win.on("unmaximize", () => win.webContents.send("window-maximized", false));
    win.on("close", (event) => {
      try {
        saveWindow();
      } catch (e) {
        console.error("Window preferences:", e.message);
      }
      if (!quitting) {
        event.preventDefault();
        win.hide();
      }
    });
    // Windows shutdown may skip before-quit; persist the timer at its session-end boundary too.
    win.on("query-session-end", (event) => {
      try {
        pause();
      } catch (e) {
        event.preventDefault();
        dialog.showErrorBox(
          nativeText(
            "\u062e\u0637\u0627 \u062f\u0631 \u0630\u062e\u06cc\u0631\u0647",
            "Save error",
          ),
          e.message,
        );
      }
    });
    win.on("session-end", () => {
      quitting = true;
      destroyTray();
    });
    powerMonitor.on("suspend", () => {
      try {
        pause();
      } catch (e) {
        dialog.showErrorBox(
          nativeText(
            "\u062e\u0637\u0627 \u062f\u0631 \u0630\u062e\u06cc\u0631\u0647",
            "Save error",
          ),
          e.message,
        );
      }
    });
    if (!preferences.deviceId) {
      preferences = { ...preferences, deviceId: crypto.randomUUID() };
      writePreferences(preferencesPath(), preferences);
    }
    runSync();
    setInterval(() => runSync(), 60000);
    ipcMain.handle("sync-status", () => publicSync());
    ipcMain.handle("sync-now", () => runSync());
    ipcMain.handle("sync-choose", async (_, disable) => {
      if (disable === true) {
        preferences = { ...preferences, syncFolder: undefined };
        writePreferences(preferencesPath(), preferences);
        syncStatus = { enabled: false, lastSync: null, devices: 0, error: "" };
        return publicSync();
      }
      const result = await dialog.showOpenDialog(win, {
        title: nativeText("پوشهٔ همگام‌سازی", "Choose sync folder"),
        properties: ["openDirectory", "createDirectory"],
      });
      if (result.canceled) return publicSync();
      const folder = result.filePaths[0];
      fs.accessSync(folder, fs.constants.R_OK | fs.constants.W_OK);
      preferences = { ...preferences, syncFolder: folder };
      writePreferences(preferencesPath(), preferences);
      try {
        fs.unlinkSync(syncMetaPath());
      } catch {}
      return runSync();
    });
    ipcMain.handle("load", () => ({
      state,
      warning: loadError,
      dataPath: dataPath(),
      preferences: {
        theme: preferences.theme,
        language: preferences.language,
        launchOnStartup: launchOnStartup(),
        compact,
      },
      sync: publicSync(),
    }));
    ipcMain.handle("save", (_, s) => {
      write(s);
      return true;
    });
    ipcMain.handle("window-control", (_, action) => {
      if (action === "minimize") win.minimize();
      else if (action === "close") win.close();
      else if (action === "maximize") {
        if (win.isMaximized()) win.unmaximize();
        else win.maximize();
      }
    });
    ipcMain.handle("window-maximized", () => win.isMaximized());
    ipcMain.handle("preferences", (_, value) => {
      if (
        !value ||
        !["light", "dark", "system"].includes(value.theme) ||
        typeof value.launchOnStartup !== "boolean" ||
        !["fa", "en"].includes(value.language)
      )
        throw Error("Invalid preferences");
      const previousStartup = launchOnStartup();
      const startupChanged = previousStartup !== value.launchOnStartup;
      if (startupChanged) {
        if (process.platform !== "win32")
          throw Error("Startup is only supported on Windows");
        app.setLoginItemSettings({
          ...startupOptions(),
          openAtLogin: value.launchOnStartup,
          enabled: value.launchOnStartup,
        });
        if (launchOnStartup() !== value.launchOnStartup)
          throw Error("Windows could not update startup settings");
      }
      const next = {
        ...preferences,
        theme: value.theme,
        language: value.language,
      };
      try {
        writePreferences(preferencesPath(), next);
      } catch (e) {
        if (startupChanged)
          app.setLoginItemSettings({
            ...startupOptions(),
            openAtLogin: previousStartup,
            enabled: previousStartup,
          });
        throw e;
      }
      preferences = next;
      updateTrayLanguage(preferences.language);
      nativeTheme.themeSource = preferences.theme;
      return {
        theme: preferences.theme,
        language: preferences.language,
        launchOnStartup: launchOnStartup(),
        compact,
      };
    });
    ipcMain.handle("widget", (_, value) => {
      if (typeof value !== "boolean") throw Error("Invalid window mode");
      if (value === compact) return compact;
      saveWindow();
      switchingMode = true;
      try {
        if (value) {
          normalBounds = preferences.normalBounds;
          normalMaximized = win.isMaximized();
          if (normalMaximized) win.unmaximize();
          win.setMinimumSize(390, 360);
          const bounds = {
            width: 430,
            height: 430,
            ...visibleBounds(preferences.compactBounds, true),
          };
          win.setBounds(bounds);
          win.setSize(bounds.width, bounds.height);
          win.setAlwaysOnTop(true);
        } else {
          if (win.isMaximized()) win.unmaximize();
          win.setAlwaysOnTop(false);
          win.setMinimumSize(1000, 720);
          const bounds = {
            width: 1320,
            height: 900,
            ...visibleBounds(normalBounds, false),
          };
          win.setBounds(bounds);
          win.setSize(bounds.width, bounds.height);
          if (normalMaximized) win.maximize();
        }
        compact = value;
      } finally {
        switchingMode = false;
      }
      saveWindow();
      return compact;
    });
    ipcMain.handle("backup", async () => {
      const result = await dialog.showSaveDialog(win, {
        title: nativeText(
          "\u0630\u062e\u06cc\u0631\u0647\u0654 \u0646\u0633\u062e\u0647\u0654 \u067e\u0634\u062a\u06cc\u0628\u0627\u0646",
          "Save backup",
        ),
        defaultPath: "kaarnegar-backup.json",
        filters: [
          {
            name: nativeText(
              "\u0646\u0633\u062e\u0647\u0654 \u067e\u0634\u062a\u06cc\u0628\u0627\u0646",
              "Backup",
            ),
            extensions: ["json"],
          },
        ],
      });
      if (result.canceled) return false;
      fs.writeFileSync(result.filePath, JSON.stringify(state, null, 2), "utf8");
      return true;
    });
    ipcMain.handle("import", async () => {
      if (state.active) throw Error("ابتدا زمان‌سنج را متوقف و ذخیره کنید.");
      const result = await dialog.showOpenDialog(win, {
        title: nativeText(
          "\u0628\u0627\u0632\u06cc\u0627\u0628\u06cc \u0646\u0633\u062e\u0647\u0654 \u067e\u0634\u062a\u06cc\u0628\u0627\u0646",
          "Restore backup",
        ),
        properties: ["openFile"],
        filters: [
          {
            name: nativeText(
              "\u0646\u0633\u062e\u0647\u0654 \u067e\u0634\u062a\u06cc\u0628\u0627\u0646",
              "Backup",
            ),
            extensions: ["json"],
          },
        ],
      });
      if (result.canceled) return null;
      const p = result.filePaths[0];
      if (fs.statSync(p).size > 30e6)
        throw Error("حجم فایل بیش از حد مجاز است.");
      const imported = validate(JSON.parse(fs.readFileSync(p, "utf8")));
      if (imported.active) imported.active.runningSince = null;
      write(imported);
      return imported;
    });
    ipcMain.handle("pdf", async (_, html, filename) => {
      if (typeof html !== "string" || html.length > 10e6)
        throw Error("گزارش بیش از حد بزرگ است.");
      if (
        typeof filename !== "string" ||
        !/^[۰-۹0-9]{4}-[۰-۹0-9]{2}-[۰-۹0-9]{2}_[۰-۹0-9]{4}-[۰-۹0-9]{2}-[۰-۹0-9]{2}\.pdf$/u.test(
          filename,
        )
      )
        throw Error("نام گزارش معتبر نیست.");
      const result = process.env.KAARNEGAR_TEST_PDF
        ? { filePath: process.env.KAARNEGAR_TEST_PDF }
        : await dialog.showSaveDialog(win, {
            title: nativeText(
              "\u0630\u062e\u06cc\u0631\u0647\u0654 \u06af\u0632\u0627\u0631\u0634 PDF",
              "Save PDF report",
            ),
            defaultPath: filename,
            filters: [{ name: "PDF", extensions: ["pdf"] }],
          });
      if (result.canceled) return false;
      const font = fs
        .readFileSync(path.join(__dirname, "../dist/fonts/Arad-Regular.woff2"))
        .toString("base64");
      const bold = fs
        .readFileSync(path.join(__dirname, "../dist/fonts/Arad-Bold.woff2"))
        .toString("base64");
      const pdfWin = new BrowserWindow({
        show: false,
        webPreferences: {
          sandbox: true,
          contextIsolation: true,
          nodeIntegration: false,
          javascript: true,
        },
      });
      pdfWin.webContents.session.webRequest.onBeforeRequest(
        { urls: ["http://*/*", "https://*/*"] },
        (_, cb) => cb({ cancel: true }),
      );
      try {
        await pdfWin.loadURL(
          "data:text/html;charset=utf-8," +
            encodeURIComponent(
              html.replace(
                "/* FONT */",
                `@font-face{font-family:Arad;src:url("data:font/woff2;base64,${font}") format("woff2");font-weight:400}@font-face{font-family:Arad;src:url("data:font/woff2;base64,${bold}") format("woff2");font-weight:600 900}`,
              ),
            ),
        );
        await pdfWin.webContents.executeJavaScript(
          'Promise.all([document.fonts.load("14px Arad"),document.fonts.load("700 14px Arad")]).then(() => document.fonts.ready).then(() => true)',
        );
        const buffer = await pdfWin.webContents.printToPDF({
          printBackground: true,
          pageSize: "A4",
          preferCSSPageSize: true,
        });
        fs.writeFileSync(result.filePath, buffer);
        return true;
      } finally {
        pdfWin.destroy();
      }
    });
  });
app.on("before-quit", (event) => {
  try {
    saveWindow();
    pause();
    quitting = true;
    destroyTray();
  } catch (e) {
    event.preventDefault();
    quitting = false;
    showApp();
    dialog.showErrorBox(
      nativeText(
        "\u062e\u0637\u0627 \u062f\u0631 \u0630\u062e\u06cc\u0631\u0647",
        "Save error",
      ),
      e.message,
    );
  }
});
app.on("second-instance", showApp);
app.on("window-all-closed", () => app.quit());
