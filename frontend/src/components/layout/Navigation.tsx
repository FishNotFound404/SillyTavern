import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

function Navigation() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/')

  const linkClass = (path: string) =>
    `block px-4 py-2 rounded-lg transition-colors ${
      isActive(path)
        ? 'bg-blue-600 text-white'
        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }`

  const links = [
    { to: '/', label: 'Characters' },
    { to: '/groups', label: 'Groups' },
    { to: '/chat', label: 'Chat' },
    { to: '/world-info', label: 'World Info' },
    { to: '/personas', label: 'Personas' },
    { to: '/settings', label: 'Settings' },
  ]

  return (
    <nav className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-white">SillyTavern</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-600 text-white">
              React
            </span>
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-2">
            {links.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={linkClass(to)}
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="md:hidden p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg"
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="md:hidden pb-4 space-y-1">
            {links.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={linkClass(to)}
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navigation
