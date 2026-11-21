// Every word on the page, mirrored from CONTENT.md (the source of truth).
// When CONTENT.md changes, update this file to match. One object per section.

// All links are samples: replace '#' with real URLs.
export const LINKS = {
  home: '#top',
  hire: '#',
  menu: '#',
  watchIntro: '#',
  rideAlong: '#',
  projects: { aiBook: '#', basketball3d: '#', languageApp: '#' },
  services: { codeRescue: '#', fullStack: '#' },
  highlights: { openToWork: '#', afterHours: '#', caseStudy: '#', offTheClock: '#' },
  clients: { all: '#', clients: '#', review: '#' },
  blog: { all: '#', posts: ['#', '#', '#'] },
  buildYourOwn: '#',
  socials: { github: '#', linkedin: '#', x: '#', youtube: '#' },
  footer: { email: '#', resume: '#', privacy: '#' },
}

export const DISCLAIMER = 'Fan-made GTA VI-style portfolio. Not affiliated with Rockstar Games.'

export const page = {
  title: 'Grand Theft Developer · Jarvis, Full-Stack Developer',
  description:
    'Portfolio of Jarvis, a full-stack developer in Miami. Fan-made GTA VI-style portfolio. Not affiliated with Rockstar Games.',
}

export const navbar = {
  monogram: 'GTD',
  homeLabel: 'Grand Theft Developer, back to top',
  menuLabel: 'Open navigation menu',
  pill: 'Hire Me',
}

export const hero = {
  posterLabel: 'Grand Theft Developer',
  tagline: ['Full-stack developer', 'Booking spring 2027'],
  button: 'Hire Me',
  tags: ['React', 'Node.js', 'PostgreSQL'],
  fanMade: DISCLAIMER,
}

export const meetTheDeveloper = {
  scene: { eyebrow: 'Watch', title: 'Meet the Developer', play: 'Play' },
  featured: { eyebrow: 'Watch', title: 'Ride Along', button: 'Play' },
  projects: [
    { eyebrow: 'AI', title: 'AI Book Assistant' },
    { eyebrow: '3D Web', title: '3D Basketball Website' },
    { eyebrow: 'Mobile', title: 'React Native Language App' },
  ],
}

export const services = [
  {
    title: 'Code Rescue',
    text: 'For existing teams: slow pages, flaky deploys or a codebase nobody wants to touch. I find the problems, fix them and leave it documented.',
    button: "See What's Included",
  },
  {
    eyebrow: 'For new products',
    title: 'Full-Stack / Builds',
    text: 'Product, API and database, designed and shipped end to end, from the first sketch to production. Typically six to ten weeks.',
    button: 'Start a Project',
  },
]

export const miami = {
  title: 'Miami, USA.',
  bio: "I'm Jarvis, a full-stack developer who has spent eight years building products for startups, agencies and teams that need to ship fast without breaking things. I work across the whole stack, from the interface people see to the API and database behind it, and I care about code the next developer will thank me for.",
}

export const highlights = [
  { eyebrow: 'Status', title: 'Open to Work', text: 'Available for freelance and contract work from spring 2027, remote or on site in Miami.', button: 'Hire Me' },
  { eyebrow: 'Community', title: 'After Hours', text: "When the deploy's done, I'm out with Miami's dev crowd: meetups, talks and the occasional late-night hackathon.", button: 'View All' },
  { eyebrow: 'Case Study', title: 'The Heist: Shipped in Six Weeks', text: "How I rebuilt a booking platform's checkout and cut drop-offs by 31%.", button: 'Read the Case Study' },
  { eyebrow: 'Personal', title: 'Off the Clock', text: 'Open-source contributor, weekend game jammer and the one who always brings the coffee to the meetup.', button: 'More About Me' },
]

export const clients = {
  header: 'Clients',
  link: 'View All',
  cards: [
    { eyebrow: 'Sample Clients', title: 'Startups, Agencies and Product Teams', button: 'See All Clients' },
    { eyebrow: 'Sample Review', title: '“Incredibly fast, detail-oriented, and easy to work with.”', button: 'Read the Review' },
  ],
}

export const blog = {
  header: 'Blog',
  link: 'View all',
  posts: [
    { title: '700 AI Agents Escaped and Became Hackers', date: 'November 3, 2026' },
    { title: 'Agentic Engineering in 2026', date: 'October 21, 2026' },
    { title: 'Think System Design & Architecture', date: 'October 8, 2026' },
  ],
}

export const footer = {
  pill: { title: 'Build Your Own', text: "Want a portfolio like this? Here's how it was built, step by step." },
  socials: ['GitHub', 'LinkedIn', 'X', 'YouTube'],
  links: ['Email', 'Résumé', 'Privacy'],
  badge: { title: 'Rated D for Developer', text: 'Clean Code, Mild Refactoring, Frequent Coffee.' },
  copyright: '© 2026 Grand Theft Developer.',
  disclaimer: DISCLAIMER,
}
