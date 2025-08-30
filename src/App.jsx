import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';

import Landing from './pages/landing';
import Dashboard from './pages/dashboard';
import Login from './pages/login'; 
import Signup from './pages/signup'; 
import GithubDashboard from './pages/githubDashboard';
import VideoCallPage from './pages/videoCallPage';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/github" element={<ProtectedRoute><GithubDashboard /></ProtectedRoute>} />
        
        <Route path="/project/:projectId/call" element={<ProtectedRoute><VideoCallPage /></ProtectedRoute>} />
        
      </Routes>
    </Router>
  );
}

export default App;
