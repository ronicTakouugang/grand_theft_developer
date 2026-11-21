import Navbar from './components/Navbar.jsx'
import Hero from './components/Hero.jsx'
import ScrollHint from './components/ScrollHint.jsx'

export default function App() {
  return (
    <>
      <div className="backdrop" aria-hidden="true" />
      <Navbar />
      <main>
        <Hero />
      </main>
      <ScrollHint />
    </>
  )
}
