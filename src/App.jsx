import { useEffect } from 'react'
import Navbar from './components/Navbar.jsx'
import Hero from './components/Hero.jsx'
import ScrollHint from './components/ScrollHint.jsx'
import { runIntro } from './intro/intro.js'

export default function App() {
  // loader (static, in index.html) → hero intro
  useEffect(() => runIntro(), [])

  return (
    <>
      <div className="backdrop" aria-hidden="true" />
      <div className="backdrop-overlay" aria-hidden="true" />
      <Navbar />
      <main>
        <Hero />
      </main>
      <ScrollHint />
    </>
  )
}
