// src/App.tsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { SocketProvider } from './contexts/SocketContext';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import GameDetailPage from './pages/GameDetailPage';
import BettingPage from './pages/BettingPage';
import HybridSchedulePage from './pages/HybridSchedulePage';

// Components
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  return (
    <Provider store={store}>
      <SocketProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            <Route path="/" element={<ProtectedRoute><MainLayout><DashboardPage /></MainLayout></ProtectedRoute>} />
            <Route path="/game/:gameId" element={<ProtectedRoute><MainLayout><GameDetailPage /></MainLayout></ProtectedRoute>} />
            <Route path="/betting" element={<ProtectedRoute><MainLayout><BettingPage /></MainLayout></ProtectedRoute>} />
            <Route path="/schedule" element={<ProtectedRoute><MainLayout><HybridSchedulePage /></MainLayout></ProtectedRoute>} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </SocketProvider>
    </Provider>
  );
}

export default App;
