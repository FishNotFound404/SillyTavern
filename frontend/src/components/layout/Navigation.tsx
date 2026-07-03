import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

function Navigation() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `block px-4 py-2 rounded-lg transition-colors ${
      isActive
        ? 'bg-blue-600 text-white'
        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }`

  const links = [
    { to: '/', label: 'Characters', end: true },
    { to: '/groups', label: 'Groups' },
    { to: '/chat', label: 'Chat' },
    { to: '/world-info', label: 'World Info' },
    { to: '/personas', label: 'Personas' },
    { to: '/settings', label: 'Settings' },
  ]

  const handleLegacyClick = () => {
    document.cookie = 'st_use_legacy=1; Path=/; Max-Age=2592000; SameSite=Lax'
    window.location.href = '/?legacy=1'
  }

  return (
    <nav className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-white">SillyTavern</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-600 text-white">
              React
            </span>
            <span className="text-xs text-gray-400 ml-2">{location.pathname}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleLegacyClick}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg border border-gray-700 transition-colors"
              title="Switch to legacy jQuery frontend"
            >
              <span>回到旧版</span>
              <span className="fa-solid fa-arrow-up-right-from-square text-xs" />
            </button>
            <button
              className="md:hidden text-gray-300"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <span className="fa-solid fa-bars" />
            </button>
          </div>
        </div>
        <div className={`${menuOpen ? 'block' : 'hidden'} md:block pb-4`}>
          <div className="flex flex-col md:flex-row md:items-center md:gap-2">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={linkClass}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navigation