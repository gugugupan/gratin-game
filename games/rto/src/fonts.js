import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/ibm-plex-sans/700.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/ibm-plex-mono/600.css';

const loaded = new Set();

export function loadFonts(locale) {
  if (loaded.has(locale)) return;
  loaded.add(locale);
  if (locale === 'zh') {
    import('@fontsource/zcool-qingke-huangyou');
    import('@fontsource/noto-sans-sc/400.css');
    import('@fontsource/noto-sans-sc/700.css');
  } else {
    import('@fontsource/dela-gothic-one');
    if (locale === 'ja') {
      import('@fontsource/noto-sans-jp/400.css');
      import('@fontsource/noto-sans-jp/700.css');
    }
  }
}
