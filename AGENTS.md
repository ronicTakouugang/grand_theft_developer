# Grand Theft Developer: a GTA VI-style developer portfolio

A developer portfolio built on the layout and motion of the GTA VI website (https://www.rockstargames.com/VI). Fan-made, not affiliated with Rockstar Games.

- **Layout and motion** match the live site exactly: layout, type scale, colours, timing and easing.
- **Content and artwork** are ours: the text in `CONTENT.md`, and the illustrations, logo and videos in `src/assets/`.

## Inputs

1. The user's prompts.
2. This file, and `CONTENT.md` for every word on the page.
3. `src/assets/` (artwork, logo, fonts, `hosted-media.json`) and the screen recordings in `src/references/`.
4. The live site: the source for layout, sizes, timing and motion only.

There is no earlier code, notes or known values. Never assume a value from memory or from how similar sites usually work; find it on the live site.

## Stack

React + Vite, Tailwind CSS, GSAP (ScrollTrigger), Lenis for smooth scrolling. Plain JavaScript, no TypeScript.

## Method: Record → Measure → Extract → Rebuild → Diff

1. **Record:** `src/references/` holds one screen recording per section of the live site. They are the reference for motion and never ship.
2. **Measure:** with playwright-core and headless Chrome, dump computed styles and bounding boxes from the live site, sampling every 50px of scroll at 375, 768, 1024, 1440, 1920 and 2560px wide, plus phone landscape.
3. **Extract:** read the live site's front-end code for exact triggers, durations, eases and values. Prefer these to values fitted from recordings.
4. **Rebuild:** build from the numbers.
5. **Diff:** run the same measurement on localhost and compare.

Rules:
- Measure before building. When something looks off, measure both sites; never adjust by eye.
- Before trusting live-site numbers, check that headless Chrome received the same page a real browser does (compare with the recordings).
- When a value breaks the pattern found so far, measure it at every width instead of forcing it into the pattern.

## Definition of done

A section is done only when:
- its diff is within 1px / 1% at every width above. Mobile is part of the section, never a follow-up;
- its motion matches its recording, checked frame by frame;
- its handoffs work: what happens to the previous section as it arrives, pins, navbar changes, and the cursor glow (a soft light behind the page that follows the pointer: match its size, colour, blur, layering, and when it fades or returns);
- its text fits its artwork;
- `prefers-reduced-motion: reduce` gives a readable, static version, and everything clickable works by keyboard with a visible focus outline;
- nothing earlier broke: re-run earlier sections' checks after changing shared code.

Report what was checked and what still doesn't match.

## Tools

- Measuring and diff scripts live in `tools/` and stay reusable: they take a URL, a viewport width and selectors.
- Measurement output and temporary files go in `.measure/`, which is git-ignored.

## Assets

```
src/assets/
  brand/              the logo poster (VI + wordmark) and the loader logo
  fonts/              Outfit and Barlow Condensed (free, Google Fonts)
  site/               every image the page loads, already cut to size
    hero/             collage pieces + logo layers, desktop + mobile
    meet-the-developer/  services/  highlights/  clients/  blog/  footer/
  source/             the original artwork, grouped by shape, and the hero piece outlines
  hosted-media.json   Cloudinary links to the two scroll-scrubbed videos
```

- Use `site/` as delivered and never edit it by hand. If a slot needs a different crop, re-cut it from `source/` with a script in `tools/`.
- On the first pass through the assets, record which file belongs to which section under Findings, and keep that map current.

## Artwork

Our own artwork only. Never download, hotlink or trace Rockstar's images, video, logos or fonts.

- Measure each artwork slot on the live site (box size, aspect ratio, crop, focal point) at every width and fit our art to it. Never upscale past the original size. When square art fills a wide or tall slot, place it whole and fill the rest with a blurred extension, so text baked into the art stays readable.
- Check every crop at desktop and phone widths: the subject stays in view and clear of the text over it. Put a card's text on the side where the art leaves room.
- **Hero:** match the live site's layer count, canvas size and positions so the intro lines up; measure them first. The poster shown after the intro must match the intro's last frame pixel for pixel, or the logo flickers at the swap. All logo layers come from the same source, so they stack exactly.
- If no asset fits a slot, use a plain placeholder of the right size and list it under Open differences.

## Scroll-scrubbed videos

- Import their links from `src/assets/hosted-media.json`; never copy URLs into components.
- Build renditions with Cloudinary URL transformations: keep every frame, add a keyframe every few frames, drop the audio, and give portrait phones a 9:16 crop that follows the subject. The poster is the first frame of the same crop, so nothing jumps when the video takes over.
- Check each video's real length and frame count before mapping it to scroll, and how many pixels of scroll each frame gets. If a short clip would step, play it over part of the scroll range and hold the first and last frames either side.

## Page map

| Live section | Our section |
|---|---|
| Loader | Loader, with our loader logo as the shape |
| Navbar | GTD monogram, menu icon, and a "Hire Me" pill that appears as the hero scrolls away |
| Hero (layered intro) | Our collage and logo, tagline, "Hire Me" button, tech tags, fan-made line |
| Launch Trailer | Meet the Developer: pinned scene, a wide featured card, and three project cards |
| Ultimate Edition | Services: scroll-scrubbed video backdrop and two service cards |
| Vice City, USA. | Miami, USA.: bio over the scroll-scrubbed city video |
| Feature cards | Four wide cards: Open to Work, After Hours, Case Study, Off the Clock |
| Shop | Clients: two cards |
| Featured News | Blog: three posts |
| Footer | Logo, "Build Your Own" pill, socials, links, disclaimer, "Rated D for Developer" badge |

Keep our own titles whatever the live site's headings say, and don't build promo strips or banners above the page. When the live page has something this page map doesn't, ask the user before building it.

## Content

Use the content from `CONTENT.md`, next to this file: it holds every word on the page, section by section. Put it in one content file, `src/content.js`, with one object per section, and have components read from it. `CONTENT.md` is the source of truth: when it changes, update `src/content.js` to match. A viewer makes the site theirs by editing `CONTENT.md` and swapping the artwork. Several images have titles painted into them; the copy in `CONTENT.md` matches them, so if you change one, change the other.

- **Voice:** first person ("I build…"). The developer's name appears only in the page title, the meta description and the bio.
- **Samples:** the name, projects, clients, numbers and links are samples for viewers to replace. Keep every link in one `LINKS` object, all set to `#`. Never present samples as real: where artwork shows real company logos or badges, label it "Sample".
- **Disclaimer:** "Fan-made GTA VI-style portfolio. Not affiliated with Rockstar Games." appears in the hero, the footer and the meta description. Never remove it.

## Project memory

This file is the only context that carries between prompts and sessions. Keep it current so a new session can pick up exactly where the last one stopped.

- **Progress:** update it at the end of every task, before replying: done, in progress, next, and open differences from the live site. Write it for someone with no other context.
- **Findings:** add facts as they're established (asset map, how sizes scale, breakpoints, colours, fonts, code layout, non-obvious problems) with where each was measured.
- Keep both short. Delete anything proven wrong, and collapse finished work into one line.

## Git

- Commits are authored by the user. **Never add an AI co-author or attribution line** to commits or PRs.
- Commit only when asked. Never force-push.

## Progress

**Done:**
- Scaffold: React 19 + Vite 8, Tailwind v4, GSAP + `@gsap/react`, playwright-core; favicon from our logo; `src/content.js` mirrors all of `CONTENT.md`.
- Navbar + Hero + scroll chevron, **layout only** (no motion): `src/components/Navbar.*`, `Hero.*`, `ScrollHint.*`, plus the fixed `.backdrop` in `App.jsx`. Diff vs live (`hero-live.json` vs `hero-local.json`) is within 1px/1% at all 7 widths + 667×375 + 2560×1000. Keyboard focus checked (`tools/check-focus.mjs`).

**In progress:** none.

**Next:** hero intro + navbar motion: the pill appears between 300 and 500px of scroll; the Hire Me button pulses; the chevron bobs (`_1smfa210`, 1s ease-in-out, infinite, alternate) and fades out over the first ~150px of scroll (hidden by 300); cursor glow. Then install Lenis, build the Loader, then Meet the Developer.

**Open differences:**
- Hero button colour: live pulses between `#fed6e3`/`#693c56` and `#ffb2c6`/`#0c0d1b`; ours is static at the first state.
- CTA row uses `1fr auto 1fr` (live `repeat(3,1fr)`): same visible edges, but the invisible side columns are wider so "Full-stack developer" doesn't wrap at 812×375.
- Tech tags are text (live: platform logos). Desktop shows two rows (2 + 1), each the logo row's height (5u); phones in portrait show one row.
- Navbar shade (`._12q75i58::after`) is built as `<Navbar shade>`, off by default: the live VI page never turns it on (checked at load, at scroll depths up to 12,000px, on a phone and with the menu open).
- The chevron is our own path drawn in the live 34×14 box. The fan-made line (not on the live site) sits 2u above the chevron; on landscape screens ≤480px tall it moves bottom-left, stopping short of the chevron.
- Mobile poster `site/hero/mobile/poster.avif` is 640² and shows at 522px on a 768×1024 tablet (DPR 1 ok, upscaled on 2× screens). The 64:27 and 160:177 slots cover-crop our 16:9 / square art.
- GTD monogram is SVG text in Barlow Condensed 900 (no monogram asset exists).

## Findings

- **Repo:** this folder is its own git repo (origin `github.com/ronicTakouugang/grand_theft_developer`, branch `main`). It sits inside an unrelated Desktop-level repo; always run git from here. `references/` and `.measure/` are git-ignored, so the recordings stay local only. Assets and recordings now live in `src/assets/` and `src/references/`.
- **Page base (live):** the stylesheet's body bg is `#111117`, but JS paints body + the fixed backdrop `._1637kzg5` `#0c0d1b`. Mouse devices: flat `#0c0d1b` + cursor glow `._1637kzg7` (radial `#1f1f38` → transparent, 150vmax, opacity .5, hidden on `pointer: coarse`). Touch devices: `linear-gradient(189deg, #1f1f38 .55%, #18182d 30.38%, #111222 65.19%, #0c0d1b 100%)`. Depends on pointer type, not width (tested by swapping). The favicon is a single 48×48 `.ico`.
- **Measuring live:** `tools/measure.mjs <url> <selectors.json> <name> [WxH,..] --live` hides the promo strip (`--_1qwkqln0:0`, which also zeroes the hero's top padding), hides cookies, and waits until the nav fades in and the poster stops moving. The intro takes about 10s; earlier snapshots are mid-intro. Selector maps are in `tools/selectors/`. `tools/diff.mjs` compares runs, `tools/print.mjs` prints one, `tools/grep-css.mjs` searches live CSS declarations, and `tools/dump-css.mjs` / `dump-tree.mjs` dump rules and the DOM.
- **Scale unit (live CSS):** every size is `n × u`, `u = min(1vw, 25.6px) / x0`. x0: 1 (<768), 3 (768–1023), 3.5 (1024–1439), 4 (≥1440), 4.5 (aspect ≥ 2.25), 2 (<768 landscape); the later rules win. Page gutter: 7.5vw (<1024), 15vw (<768 landscape), 10vw (≥1024), 13vw (≥1440), 64u (≥1920). Implemented as `--u`/`--gutter` in `src/index.css`.
- **Navbar (live `nav._12q75i51`):** fixed, padding 6u / 7u (768–1023) / 10u (≥1024); buttons 12u; logo width 7u / 9u (≥768); right gap 2.5u / 4u; menu bars 5u / 7u wide, `round(1u|1.5u, .5px)` tall and gapped. Pill (`._1092chnf`): min 24u × 10u, padding 0 5u, text 3.5u, `#ffb2c6` on `#0c0d1b`, hidden at load.
- **Scroll chevron (live `._1ph7wmg0` > `svg._1smfa212`):** fixed bottom bar, 100vw, z 90. The icon is `0.45 × max(5vw, 10vh)` tall, `min(that, 2.1rem)` wide, `#ffb2c6`, `drop-shadow(0 0 .025d #ffb0c480) drop-shadow(0 0 .1d #000)` with `d = max(5vw, 10vh)`, and hidden on landscape phones under 768px. `tools/probe-scroll.mjs` reports nav, pill and chevron state at each scroll depth.
- **Hero (live `._191jtbm*`):** 100svh grid, content centred vertically. Poster width `min(100%, 120svh)`, at 16:9; aspect 0.6–1: `min(80%, 60svh)`, 1:1; aspect <0.6: 160:177; aspect ≥2.25 (or <768 and ≥2): `min(100%, 150svh)`, 64:27; <768 portrait/square: `min(100%, 40svh)`. Stack gap 8u / 6u (<768) / 5u (wide). CTA: 3 columns, padding 0 2.5u. Tagline 5.5u (6u <768) over 4u, gap 3u. Button `._1092chnd` 24u × 14u, padding 7u, text 4.5u. Logos are 5u tall, gap 3u. Phones in portrait: tagline above the poster, logos row (mt 3.5u, mb 2u, gap 6u), then a 12u button (mt 2.5u). <768 landscape: small pill, text 3.5u/3u, gaps 1.5u. Live poster = `poster_full` + `poster_logo` stacked, both `object-fit: cover`, in 4 crops (16:9, 1:1, 160:177, 64:27).
- **Fonts (live):** ArtDeco Regular/Medium/Bold (400/500/700) for most text, ArtDeco Condensed Bold/Heavy (700/900) for headlines, system sans for some UI. Ours: Outfit → ArtDeco, Barlow Condensed 700/900 → ArtDeco Condensed. Tailwind tokens: `bg-page`, `text-ink`, `font-sans`, `font-condensed` (in `src/index.css` `@theme`).
- **Logo files:** `site/hero/*/logo-*.avif` and `poster-logo` are full-canvas layers (desktop 2560×1440, mobile 1366²). `site/footer/logo.avif` (807×540) is the trimmed logo. `tools/make-favicon.py` writes `public/favicon.ico` (16/32/48) and `apple-touch-icon.png` from `brand/logo-poster.png`.
