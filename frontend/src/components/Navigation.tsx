import { NavLink } from 'react-router-dom'

function Navigation() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 rounded-lg transition-colors ${
      isActive
        ? 'bg-blue-600 text-white'
        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }`

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
          <div className="flex items-center gap-2">
            <NavLink to="/" end className={linkClass}>
              Characters
            </NavLink>
            <NavLink to="/chat" className={linkClass}>
              Chat
            </NavLink>
            <NavLink to="/settings" className={linkClass}>
              Settings
            </NavLink>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navigation
