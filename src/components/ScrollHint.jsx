import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import './ScrollHint.css'

// Bottom-centre "scroll for more" chevron (live: ._1ph7wmg0 + svg._1smfa212).
// It bobs from page load, like the live one (GSAP yoyo, values from the live
// code). Hiding it on scroll comes with the hero scroll pass.
export default function ScrollHint() {
  const icon = useRef(null)

  useGSAP(() => {
    gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(
        icon.current,
        { opacity: 1, scale: 1, y: 0 },
        { opacity: 0.7, scale: 0.9, y: 4, yoyo: true, repeat: -1, duration: 0.8, ease: 'power1.inOut' },
      )
    })
  })

  return (
    <div className="scroll-hint">
      <svg ref={icon} className="scroll-hint__icon" viewBox="0 0 34 14" aria-hidden="true" focusable="false">
        {/* our own chevron: a thick V in the live icon's 34x14 box */}
        <path d="M1.3 0 17 9.6 32.7 0 34 2.3 17 14 0 2.3Z" fill="currentColor" />
      </svg>
      <span className="sr-only">Scroll for more content.</span>
    </div>
  )
}
