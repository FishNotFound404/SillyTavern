import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './routes'
import Navigation from './components/layout/Navigation'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-950">
        <Navigation />
        <main>
          <AppRoutes />
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App