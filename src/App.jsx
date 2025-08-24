import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';

// Import your page components
import Landing from './pages/landing';
import Dashboard from './pages/dashboard';
import Login from './pages/login'; // Assuming Login.jsx is in pages folder
import Signup from './pages/signup'; // Assuming Signup.jsx is in pages folder
import './App.css';
import GithubDashboard from './pages/githubDashboard';

// --- Protected Route Component ---
// This component checks for an auth token in localStorage.
// If it exists, it renders the requested component (children).
// If not, it redirects the user to the /login page.
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    // User is not authenticated
    return <Navigate to="/login" />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Publicly accessible routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected route */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
              <Route 
          path="/github" 
          element={<ProtectedRoute><GithubDashboard /></ProtectedRoute>}
        />
      </Routes>
    </Router>
  );
}

export default App;