; Supply the MultiUser strings missing from NSIS's bundled Farsi language.
; Defines are consumed and cleared by LangFile.nsh for each language.
!include "MUI2.nsh"
!macroundef MUI_LANGUAGE
!macro MUI_LANGUAGE NLFID
  !if "${NLFID}" == "Farsi"
    !define MULTIUSER_TEXT_INSTALLMODE_TITLE "انتخاب کاربران"
    !define MULTIUSER_TEXT_INSTALLMODE_SUBTITLE "کاربرانی را که از کارنگار استفاده می‌کنند انتخاب کنید."
    !define MULTIUSER_INNERTEXT_INSTALLMODE_TOP "کارنگار برای شما نصب شود یا برای همهٔ کاربران این دستگاه؟ برای ادامه روی بعدی کلیک کنید."
    !define MULTIUSER_INNERTEXT_INSTALLMODE_ALLUSERS "نصب برای همهٔ کاربران"
    !define MULTIUSER_INNERTEXT_INSTALLMODE_CURRENTUSER "نصب فقط برای من"
  !endif
  !insertmacro MUI_LANGUAGEEX "${NSISDIR}\Contrib\Language files" "${NLFID}"
!macroend
!define MUI_LANGDLL_WINDOWTITLE "کارنگار | Installer language"
!define MUI_LANGDLL_INFO "زبان نصب را انتخاب کنید. / Select installer language."
