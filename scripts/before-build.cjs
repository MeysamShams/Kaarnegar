// electron-builder 26 calls the NSIS language "Persian", but its bundled
// NSIS 3 distribution ships Farsi.nlf/Farsi.nsh. Keep the correction local
// to the build process so npm ci and GitHub Actions remain reproducible.
module.exports = async () => {
  const languages = require('app-builder-lib/out/util/langs');
  if (languages.langIdToName.fa === 'Persian') languages.langIdToName.fa = 'Farsi';
};
