import localFont from 'next/font/local';

// next/font/google은 빌드 중 Google Fonts에서 폰트를 받다가 간헐적으로 실패하므로,
// @fontsource 패키지의 파일을 next/font/local로 불러온다.
//
// Google Fonts처럼 latin과 latin-ext를 같은 font-family의 @font-face로 나누고 unicode-range로 구분한다.
// next/font/local은 src 항목마다 unicode-range를 줄 수 없어 subset마다 따로 호출한다.
// latin-ext는 preload하지 않고, 대체 폰트 보정과 CSS 변수는 latin 쪽에서만 만든다.
// next/font 호출 인자는 리터럴만 허용하므로 unicode-range 값을 상수로 빼지 않는다.
// latin-ext 호출은 @font-face만 만들면 되지만, 앱이 참조하지 않는 const는 번들러(turbopack)가 버리므로 export해 둔다.
//
// DM Sans와 JetBrains Mono는 Google Fonts가 주던 것과 같이 굵기 전체를 담은 가변 폰트를 쓰고,
// 기존에 쓰던 굵기 범위로 제한한다.

const pressStart2P = localFont({
  src: '../../node_modules/@fontsource/press-start-2p/files/press-start-2p-latin-400-normal.woff2',
  weight: '400',
  style: 'normal',
  display: 'swap',
  variable: '--font-pixel',
  declarations: [
    { prop: 'font-family', value: "'Press Start 2P'" },
    {
      prop: 'unicode-range',
      value:
        'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
    },
  ],
});

export const pressStart2PLatinExt = localFont({
  src: '../../node_modules/@fontsource/press-start-2p/files/press-start-2p-latin-ext-400-normal.woff2',
  weight: '400',
  style: 'normal',
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
  declarations: [
    { prop: 'font-family', value: "'Press Start 2P'" },
    {
      prop: 'unicode-range',
      value:
        'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF',
    },
  ],
});

const jetbrainsMono = localFont({
  src: '../../node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2',
  weight: '400 600',
  style: 'normal',
  display: 'swap',
  variable: '--font-mono',
  declarations: [
    { prop: 'font-family', value: "'JetBrains Mono'" },
    {
      prop: 'unicode-range',
      value:
        'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
    },
  ],
});

export const jetbrainsMonoLatinExt = localFont({
  src: '../../node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-ext-wght-normal.woff2',
  weight: '400 600',
  style: 'normal',
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
  declarations: [
    { prop: 'font-family', value: "'JetBrains Mono'" },
    {
      prop: 'unicode-range',
      value:
        'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF',
    },
  ],
});

const dmSans = localFont({
  src: '../../node_modules/@fontsource-variable/dm-sans/files/dm-sans-latin-wght-normal.woff2',
  weight: '400 700',
  style: 'normal',
  display: 'swap',
  variable: '--font-sans',
  declarations: [
    { prop: 'font-family', value: "'DM Sans'" },
    {
      prop: 'unicode-range',
      value:
        'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
    },
  ],
});

export const dmSansLatinExt = localFont({
  src: '../../node_modules/@fontsource-variable/dm-sans/files/dm-sans-latin-ext-wght-normal.woff2',
  weight: '400 700',
  style: 'normal',
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
  declarations: [
    { prop: 'font-family', value: "'DM Sans'" },
    {
      prop: 'unicode-range',
      value:
        'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF',
    },
  ],
});

// 앱 루트 <html>의 className에 넣어 --font-pixel, --font-mono, --font-sans를 정의한다.
export const fontVariables = [pressStart2P.variable, jetbrainsMono.variable, dmSans.variable].join(
  ' ',
);
