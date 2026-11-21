import './ScrollHint.css'

// Bottom-centre "scroll for more" chevron (live: ._1ph7wmg0 + svg._1smfa212).
// Layout only: the live bob animation and the fade-out over the first ~150px
// of scroll come with the motion pass.
export default function ScrollHint() {
  return (
    <div className="scroll-hint">
      <svg className="scroll-hint__icon" viewBox="0 0 34 14" aria-hidden="true" focusable="false">
        {/* our own chevron: a thick V in the live icon's 34x14 box */}
        <path d="M1.3 0 17 9.6 32.7 0 34 2.3 17 14 0 2.3Z" fill="currentColor" />
      </svg>
      <span className="sr-only">Scroll for more content.</span>
    </div>
  )
}
