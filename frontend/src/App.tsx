import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client';
import { client } from './graphql/client';
import Home from './pages/Home';
import Login from './pages/Login';
import Characters from './pages/Characters';
import CharacterEditor from './pages/CharacterEditor';

function App() {
  return (
    <ApolloProvider client={client}>
      <Router>
        <div className="min-h-screen bg-gray-900">
          <nav className="bg-gray-800 p-4">
            <div className="container mx-auto flex gap-4">
              <a href="/" className="text-white hover:text-primary-400">Home</a>
              <a href="/characters" className="text-white hover:text-primary-400">Characters</a>
            </div>
          </nav>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/characters" element={<Characters />} />
            <Route path="/characters/:id" element={<CharacterEditor />} />
          </Routes>
        </div>
      </Router>
    </ApolloProvider>
  );
}

export default App;
