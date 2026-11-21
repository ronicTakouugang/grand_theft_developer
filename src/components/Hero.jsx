import { LINKS, hero } from '../content.js'
import posterDesktop from '../assets/site/hero/desktop/poster.avif'
import posterLogoDesktop from '../assets/site/hero/desktop/poster-logo.avif'
import posterMobile from '../assets/site/hero/mobile/poster.avif'
import posterLogoMobile from '../assets/site/hero/mobile/poster-logo.avif'
import './Hero.css'

// Square and tall screens (aspect <= 1) use the square mobile cut, the rest the
// 16:9 desktop cut. The live site's 64:27 (ultrawide) and 160:177 (tall phone)
// slots cover-crop these. Collage and logo are separate layers so the intro can
// animate them later; stacked, they are the full poster.
const MOBILE = '(max-aspect-ratio: 1/1)'

function PosterLayer({ desktop, mobile, className }) {
  return (
    <picture className={`hero__layer ${className}`}>
      <source media={MOBILE} srcSet={mobile} type="image/avif" />
      <img src={desktop} alt="" decoding="async" fetchPriority="high" />
    </picture>
  )
}

function Tagline({ className = '' }) {
  return (
    <div className={`hero__tagline ${className}`}>
      <h2 className="hero__line1">{hero.tagline[0]}</h2>
      <p className="hero__line2">{hero.tagline[1]}</p>
    </div>
  )
}

// Desktop: two right-aligned rows (two tags, then one), in the live platform
// logos' place. Phones in portrait: one centred row.
function Tags() {
  const rows = []
  for (let i = 0; i < hero.tags.length; i += 2) rows.push(hero.tags.slice(i, i + 2))
  return (
    <ul className="hero__tags" aria-label="Tech stack">
      {rows.map((row) => (
        <li key={row.join()} className="hero__tag-row">
          {row.map((t) => (
            <span key={t} className="hero__tag">
              {t}
            </span>
          ))}
        </li>
      ))}
    </ul>
  )
}

export default function Hero() {
  return (
    <section className="hero" id="top" aria-label="Intro">
      <h1 className="sr-only">{hero.posterLabel}</h1>
      <div className="hero__inner">
        <div className="hero__stack">
          {/* phones in portrait: tagline sits above the poster */}
          <div className="hero__top">
            <Tagline />
          </div>

          <div className="hero__poster" role="img" aria-label={hero.posterLabel}>
            <PosterLayer desktop={posterDesktop} mobile={posterMobile} className="hero__layer--art" />
            <PosterLayer desktop={posterLogoDesktop} mobile={posterLogoMobile} className="hero__layer--logo" />
          </div>

          <div className="hero__cta">
            <div className="hero__cta-grid">
              <Tagline className="hero__tagline--side" />
              <a className="pill hero__button" href={LINKS.hire}>
                {hero.button}
              </a>
              <Tags />
            </div>
          </div>
        </div>
      </div>
      <p className="hero__fanmade">{hero.fanMade}</p>
    </section>
  )
}
