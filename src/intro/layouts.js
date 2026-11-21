// Intro choreography, extracted from the live site's front-end code
// (rockstargames.com/VI, the hero "fob" timelines). All times in seconds.
//
// Each of the 12 canvas layers is one image, in this order:
//   0–8  poster pieces (shard-01…09)   9  logo hole (shard-10)
//   10   VI logo                       11  "grand theft developer" wordmark
// Piece k gets PIECES[k]: its start depth z (it flies from z to 0) and the
// delay before its dark "reveal" overlay starts fading.

// Visibility tuning: our deliberate departures from the live timing, so the
// pieces can be seen flying in (on the live site the flight happens mostly
// under the loader, with the pieces still dark). Set all four to the live
// values (0, 1, 1, 0.5) to get the live intro back exactly.
export const TUNING = {
  introDelay: 0.5, // s after "fadeout" before the intro starts (live 0: it starts under the opaque loader)
  timeScale: 0.75, // intro playback speed (live 1); 0.75 stretches the 2.6s fly-in to ~3.5s
  revealFrom: 0.55, // starting strength of the dark overlay on each piece (live 1 = fully dark)
  shardAlpha: 0.75, // piece opacity while flying (live 0.5)
}

export const HERO_ENTER = 2.6 // HeroEnterDuration
export const TOTAL_FRAMES = 140 // the live timeline is authored in 140 frames of HERO_ENTER
export const SHARD_FADE_IN_DELAY = 0.5571428571428572
export const frames = (n) => (n / TOTAL_FRAMES) * HERO_ENTER

export const EASE = {
  fly: 'power3.inOut', // z
  reveal: 'power3.inOut',
  sine: 'sine.inOut',
  mask: 'power1.out',
}

// Reveal delays are the same in every layout.
const DELAYS = [
  0.4642857142857143, 0.5571428571428572, 0.65, 0.7428571428571429, 0.8357142857142859,
  0.9285714285714286, 1.0214285714285714, 1.1142857142857143, 1.2071428571428573,
]
const withDelays = (zs) => zs.map((z, i) => ({ z, revealDelay: DELAYS[i] }))

// square and portrait (mobile art)
const MOBILE_Z = [-4314, -5486, -6533, -7759, -8923, -10080, -11246, -12331, -13335]
// landscape and ultrawide (desktop art)
const DESKTOP_Z = [-4314, -5337, -6533, -7760, -9177, -9440, -19197, -15243, -16634]

// Checked in this order; the first match wins, else "landscape".
export const LAYOUTS = [
  {
    name: 'square',
    media: '(min-aspect-ratio: 0.6) and (max-aspect-ratio: 1)',
    art: 'mobile',
    pieces: withDelays(MOBILE_Z),
    wordmarkMaskDuration: 2.1357142857142857,
  },
  {
    name: 'portrait',
    media: '(max-aspect-ratio: 0.6)',
    art: 'mobile',
    pieces: withDelays(MOBILE_Z),
    wordmarkMaskDuration: 2.1357142857142857,
  },
  {
    name: 'ultrawide',
    media: '(min-aspect-ratio: 2.25), (min-width: 0px) and (max-width: 767.98px) and (min-aspect-ratio: 2)',
    art: 'desktop',
    pieces: withDelays(DESKTOP_Z),
    wordmarkMaskDuration: 1.4857142857142858,
  },
]
export const DEFAULT_LAYOUT = {
  name: 'landscape',
  media: null,
  art: 'desktop',
  pieces: withDelays(DESKTOP_Z),
  wordmarkMaskDuration: 2.1357142857142857,
}

export const LOGO_HOLE_Z = -13435
export const VI_LOGO_Z = -13435
export const WORDMARK_Z = -15853

export function currentLayout() {
  return LAYOUTS.find((l) => window.matchMedia(l.media).matches) ?? DEFAULT_LAYOUT
}

// Loader fade-out, from the live loader (Web Animations API).
export const LOADER = {
  logoFade: { duration: 1000, easing: 'cubic-bezier(0.2, 0, 0.8, 1)' },
  overlayFade: { duration: 1300, easing: 'cubic-bezier(0.4, 0, 0.8, 1)' },
}

// The live poster images are requested at the picture's `sizes` width:
// 85vw, or min(85vw, 2560px) on ultrawide. The canvas draws them at that
// natural size, so we resample ours to the same width.
export function layerPixelWidth(layout) {
  const vw = window.innerWidth * 0.85
  const css = layout.name === 'ultrawide' ? Math.min(vw, 2560) : vw
  return Math.round(css * (window.devicePixelRatio || 1))
}
