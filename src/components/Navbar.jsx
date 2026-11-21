import { LINKS, navbar } from '../content.js'
import './Navbar.css'

// Fixed top bar (live: nav._12q75i51). Layout only: the "Hire Me" pill stays
// hidden until the scroll motion pass makes it appear as the hero scrolls away.
export default function Navbar({ pillVisible = false, shade = false }) {
  return (
    <nav className={`navbar${shade ? ' navbar--shade' : ''}`} aria-label="Main">
      <a className="navbar__home" href={LINKS.home} aria-label={navbar.homeLabel}>
        <Monogram />
      </a>
      <div className="navbar__right">
        <div className="navbar__pill-wrap" data-visible={pillVisible}>
          <a className="pill navbar__pill" href={LINKS.hire} tabIndex={pillVisible ? undefined : -1}>
            {navbar.pill}
          </a>
        </div>
        <button type="button" className="navbar__menu" aria-label={navbar.menuLabel} aria-expanded="false">
          <span className="navbar__bar" />
          <span className="navbar__bar" />
        </button>
      </div>
    </nav>
  )
}

// "GTD" set in Barlow Condensed 900 inside the live logo's box (viewBox matches
// the live VI mark's 1.317:1 ratio).
function Monogram() {
  return (
    <svg className="navbar__monogram" viewBox="0 0 79 60" aria-hidden="true" focusable="false">
      <text
        x="39.5"
        y="55"
        textAnchor="middle"
        textLength="79"
        lengthAdjust="spacingAndGlyphs"
        fill="currentColor"
        fontFamily="'Barlow Condensed', sans-serif"
        fontWeight="900"
        fontSize="72"
      >
        {navbar.monogram}
      </text>
    </svg>
  )
}
