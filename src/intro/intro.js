// Loader → hero intro, matching the live site's sequence:
//  1. The loader (static markup in index.html) loops until fonts and every
//     intro image are ready, then waits for its current loop to end.
//  2. "fadeout": the loader logo fades (1000ms), then the loader overlay fades
//     (1300ms). The intro starts TUNING.introDelay after fadeout (live: at
//     once), so it plays as the overlay clears and stays visible behind it.
//     The page is never blank: the overlay is still there when it starts.
//  3. The canvas flies the poster pieces in and draws the logo; the hero UI
//     and navbar fade in at 2.6s.
//  4. At the end the real poster <picture>s fade in over the canvas (0.5s),
//     the canvas is hidden and scrolling is enabled.
import gsap from 'gsap'
import {
  HERO_ENTER, SHARD_FADE_IN_DELAY, EASE, frames, LOGO_HOLE_Z, VI_LOGO_Z, WORDMARK_Z, LOADER, TUNING,
  currentLayout, layerPixelWidth,
} from './layouts.js'
import { Layer, Stage, draw, resetScratch, toLayerBitmap } from './renderer.js'

// 10 pieces, then the VI and the wordmark. The logo pair is re-cut by
// tools/split-logo-hole.py so the wordmark's dark backing wipes in with it.
const LAYER_URLS = import.meta.glob('../assets/site/hero/*/{shard-*.avif,logo-vi-open.webp,logo-gta-backed.webp}', {
  eager: true, query: '?url', import: 'default',
})
const LAYER_FILES = [
  ...Array.from({ length: 10 }, (_, i) => `shard-${String(i + 1).padStart(2, '0')}.avif`),
  'logo-vi-open.webp',
  'logo-gta-backed.webp',
]
const layerUrls = (art) => LAYER_FILES.map((n) => LAYER_URLS[`../assets/site/hero/${art}/${n}`])

const LOAD_TIMEOUT = 15000
const FONTS = ['400 16px Outfit', '500 16px Outfit', '600 16px Outfit', '700 16px Outfit', '900 16px "Barlow Condensed"']

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => img.decode().then(() => resolve(img), () => resolve(img))
    img.onerror = reject
    img.src = src
  })

// <img> elements already in the page (the poster pictures)
const decoded = (img) => (img.complete && img.naturalWidth ? img.decode().catch(() => {}) : new Promise((r) => {
  img.addEventListener('load', () => img.decode().then(r, r), { once: true })
  img.addEventListener('error', r, { once: true })
}))

const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))])

function queryEls(root = document) {
  const q = (s) => root.querySelector(s)
  const grid = q('.hero__cta-grid')
  const ctaKids = grid ? [...grid.children] : []
  return {
    loader: document.getElementById('loader'),
    loaderLogo: document.querySelector('#loader .loader__logo'),
    stack: q('.hero__stack'),
    poster: q('.hero__poster'),
    canvas: q('.hero__canvas'),
    posterArt: q('.hero__layer--art'),
    posterLogo: q('.hero__layer--logo'),
    cta: q('.hero__cta'),
    top: q('.hero__top'),
    // our fan-made line (no live counterpart) fades in with the rest of the hero UI
    fanMade: q('.hero__fanmade'),
    buttons: ctaKids.filter((el) => el.matches('a, button')),
    ctaOthers: ctaKids.filter((el) => !el.matches('a, button')),
    navbar: q('.navbar'),
    scrollHint: q('.scroll-hint'),
    overlay: q('.backdrop-overlay'),
  }
}

function lockScroll(on) {
  document.documentElement.style.overflow = on ? 'hidden' : ''
}

function waitForLoopEnd(el) {
  // finish the loader's current 2.15s loop so it never cuts mid-pulse
  const anims = el.getAnimations({ subtree: true })
  if (!anims.length) return Promise.resolve()
  return new Promise((resolve) => {
    el.addEventListener('animationiteration', () => resolve(), { once: true })
  }).then(() => anims.forEach((a) => a.pause()))
}

// CSS cubic-bezier(x1, y1, x2, y2) as a function of progress (for seeking)
function cubicBezier(x1, y1, x2, y2) {
  const bx = (t) => 3 * x1 * t * (1 - t) ** 2 + 3 * x2 * t ** 2 * (1 - t) + t ** 3
  const by = (t) => 3 * y1 * t * (1 - t) ** 2 + 3 * y2 * t ** 2 * (1 - t) + t ** 3
  return (x) => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    let lo = 0
    let hi = 1
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2
      if (bx(mid) < x) lo = mid
      else hi = mid
    }
    return by((lo + hi) / 2)
  }
}
const parseBezier = (s) => cubicBezier(...s.match(/[\d.]+/g).map(Number))

// loader opacities at time t after "fadeout" (same curves as fadeOutLoader)
function loaderAt(t) {
  const logoT = LOADER.logoFade.duration / 1000
  const overT = LOADER.overlayFade.duration / 1000
  return {
    logo: 1 - parseBezier(LOADER.logoFade.easing)(t / logoT),
    overlay: 1 - parseBezier(LOADER.overlayFade.easing)((t - logoT) / overT),
  }
}

async function fadeOutLoader(els) {
  const logo = els.loaderLogo.animate([{ opacity: 0 }], { ...LOADER.logoFade, fill: 'forwards', iterations: 1 })
  await logo.finished
  const overlay = els.loader.animate([{ opacity: 1 }, { opacity: 0 }], { ...LOADER.overlayFade, fill: 'forwards', iterations: 1 })
  await overlay.finished
  els.loader.remove()
}

// (The live timeline also tweens the stage camera to its end value, but the
// camera already starts there, so that tween is a no-op and is left out.)
function buildTimeline({ layout, layers, els, render, onEnd }) {
  const tl = gsap.timeline({ paused: true, defaults: { duration: HERO_ENTER, ease: EASE.fly }, onUpdate: render })

  const zs = [...layout.pieces.map((p) => p.z), LOGO_HOLE_Z, VI_LOGO_Z, WORDMARK_Z]
  const pieces = layers.slice(0, 9)
  const [hole, vi, wordmark] = layers.slice(9)
  layers.forEach((layer, k) => {
    layer.alpha = k === 11 ? 1 : 0
    tl.from(layer, { z: zs[k] }, 0)
    if (k < 9) {
      tl.set(layer, { alpha: TUNING.shardAlpha }, SHARD_FADE_IN_DELAY)
      const d = layout.pieces[k].revealDelay
      tl.from(layer, { reveal: TUNING.revealFrom, ease: EASE.reveal, duration: HERO_ENTER - d }, d)
    }
  })
  tl.to(vi, { alpha: 1, duration: 0.5571428571428572, ease: 'none' }, 1.6714285714285717)
  tl.fromTo(vi, { shadowColor: '#FFACFD', shadowOpacity: 0, shadowBlur: 18 }, { shadowOpacity: 1, shadowBlur: 108, duration: 0.9285714285714284, ease: 'none' }, 2.0428571428571427)
  tl.from(wordmark, { mask: 0, duration: layout.wordmarkMaskDuration, ease: EASE.mask }, 1.6714285714285717)
  tl.fromTo(wordmark, { shadowColor: '#FFD398', shadowOpacity: 0, shadowBlur: 15 }, { shadowOpacity: 1, duration: 0.5571428571428572, ease: 'none' }, 2.4699999999999998)
  tl.to(hole, { alpha: 1, duration: 0.4642857142857143, ease: EASE.sine }, 2.4142857142857146)
  tl.to([vi, wordmark], { shadowOpacity: 0, duration: 1.1142857142857143, ease: 'power2.in' }, 3.0271428571428567)
  tl.addLabel('afterShardsLand', HERO_ENTER)
  tl.to(pieces, { alpha: 1, duration: 1.1142857142857143, ease: EASE.sine }, 'afterShardsLand')

  // page around the canvas
  const ui = frames(81)
  tl.to(els.cta, { autoAlpha: 1, duration: 0 }, 0)
  tl.from(els.stack, { scale: 1.4286, duration: frames(190), ease: 'power2.inOut' }, 0)
  tl.from(els.stack, { autoAlpha: 0, duration: HERO_ENTER / 2, ease: 'power1.in' }, 0)
  tl.addLabel('button', HERO_ENTER)
  tl.fromTo(els.buttons, { autoAlpha: 0 }, { autoAlpha: 1, duration: frames(42), ease: 'power1.in' }, 'button')
  tl.addLabel('heroUI', HERO_ENTER)
  tl.fromTo([els.top, ...els.ctaOthers, els.fanMade].filter(Boolean), { autoAlpha: 0 }, { autoAlpha: 1, duration: ui, ease: 'power1.inOut' }, 'heroUI')
  tl.fromTo(els.navbar, { autoAlpha: 0 }, { autoAlpha: 1, duration: ui, ease: 'power1.inOut' }, 'heroUI')
  if (els.overlay)
    tl.fromTo(els.overlay, { backgroundColor: 'rgba(12, 13, 27, 1)' }, { backgroundColor: 'rgba(12, 13, 27, 0)', duration: HERO_ENTER - SHARD_FADE_IN_DELAY, ease: 'none' }, SHARD_FADE_IN_DELAY)
  tl.call(onEnd)
  return tl
}

function showFinalState(els) {
  gsap.set([els.posterArt, els.posterLogo, els.scrollHint, els.stack, els.cta, els.top, els.fanMade, ...els.buttons, ...els.ctaOthers, els.navbar].filter(Boolean), { clearProps: 'opacity,visibility,transform' })
  if (els.canvas) els.canvas.style.display = 'none'
  if (els.overlay) els.overlay.style.backgroundColor = 'transparent'
}

/**
 * Run the loader and intro. Returns a cleanup function.
 * Exposes window.__intro (timeline + layout) for frame-by-frame checks.
 */
export function runIntro() {
  const els = queryEls()
  if (!els.loader || !els.stack) return () => {}
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  let tl = null
  let cancelled = false
  lockScroll(true)

  const fontsReady = Promise.all(FONTS.map((f) => document.fonts.load(f))).then(() => document.fonts.ready)
  const posterReady = Promise.all([els.posterArt, els.posterLogo].map((p) => decoded(p.querySelector('img'))))

  const finish = () => {
    lockScroll(false)
    if (els.canvas) els.canvas.style.display = 'none'
  }

  if (reduced) {
    // static: wait for content, then drop the loader without animation
    withTimeout(Promise.all([fontsReady, posterReady]), LOAD_TIMEOUT)
      .catch(() => {})
      .then(() => {
        if (cancelled) return
        showFinalState(els)
        els.loader.remove()
        finish()
      })
    return () => { cancelled = true }
  }

  const layout = currentLayout()
  // exact (fractional) box size: offsetWidth/Height round, which skews the
  // crop and camera by up to a pixel. Read before any transform is applied.
  const box = els.poster.getBoundingClientRect()
  const boxAspect = box.width / box.height
  const targetW = layerPixelWidth(layout)
  const bitmapsReady = Promise.all(layerUrls(layout.art).map(loadImage)).then((imgs) =>
    Promise.all(imgs.map((img) => toLayerBitmap(img, boxAspect, targetW))),
  )

  withTimeout(Promise.all([fontsReady, posterReady, bitmapsReady]), LOAD_TIMEOUT)
    .then(async ([, , bitmaps]) => {
      if (cancelled) return
      await waitForLoopEnd(els.loaderLogo)
      if (cancelled) return

      const canvas = els.canvas
      const dpr = window.devicePixelRatio || 1
      const cssBox = canvas.getBoundingClientRect() // unscaled: only translated so far
      canvas.cssWidth = cssBox.width
      canvas.cssHeight = cssBox.height
      canvas.width = Math.round(cssBox.width * dpr)
      canvas.height = Math.round(cssBox.height * dpr)
      const ctx = canvas.getContext('2d')
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      resetScratch()

      const stage = new Stage()
      stage.camera = box.width / bitmaps[0].width
      const layers = Array.from({ length: 12 }, (_, i) => new Layer(i))
      const render = () => draw(ctx, canvas, layers, stage, bitmaps)

      // ?intro=manual: build everything but let a script seek it (tools/capture-intro.mjs)
      const manual = new URLSearchParams(location.search).get('intro') === 'manual'
      gsap.set([els.posterArt, els.posterLogo], { autoAlpha: 0 })
      const endTween = () =>
        gsap.to([els.posterArt, els.posterLogo], {
          autoAlpha: 1, duration: 0.5, ease: 'sine.inOut', onComplete: finish, paused: manual,
        })
      let handoff = null
      tl = buildTimeline({ layout, layers, els, render, onEnd: () => { if (!manual) handoff = endTween() } })
      tl.timeScale(TUNING.timeScale)
      render()
      // real seconds after fadeout at which the intro timeline ends
      const introEnd = TUNING.introDelay + tl.duration() / TUNING.timeScale
      window.__intro = { timeline: tl, layout: layout.name, end: introEnd, tuning: TUNING }
      if (!manual) {
        fadeOutLoader(els)
        gsap.delayedCall(TUNING.introDelay, () => tl.play())
        return
      }
      handoff = endTween()
      // t = real seconds after fadeout (same clock as the loader fade)
      window.__intro.seek = (t) => {
        const introT = Math.max(0, t - TUNING.introDelay) * TUNING.timeScale
        tl.seek(Math.min(introT, tl.duration()), true)
        render()
        handoff.seek(Math.max(0, t - introEnd), true)
        const l = loaderAt(t)
        els.loaderLogo.style.opacity = l.logo
        els.loader.style.opacity = l.overlay
      }
      window.__intro.ready = true
    })
    .catch(() => {
      // loading failed or timed out: show the finished hero without the intro
      if (cancelled) return
      showFinalState(els)
      els.loader.remove()
      finish()
    })

  // a resize mid-intro would leave the canvas misaligned: jump to the end
  const onResize = () => { if (tl && tl.progress() < 1) tl.progress(1) }
  window.addEventListener('resize', onResize)

  return () => {
    cancelled = true
    window.removeEventListener('resize', onResize)
    tl?.kill()
  }
}
