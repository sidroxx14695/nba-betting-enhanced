// src/App.tsx - Main application component

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { SocketProvider } from './contexts/SocketContext';

// Pages
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage'; // Verify the file exists or adjust the path accordingly
import GameDetailPage from './pages/GameDetailPage'; // Ensure the file exists at this path or adjust the path to the correct location
import RiskAssessmentPage from './pages/RiskAssessmentPage'; // Adjusted path based on possible folder structure
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/auth/ProtectedRoute';

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <SocketProvider>
        <Router>
          <div className="flex flex-col min-h-screen bg-gray-900 text-white">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/risk-assessment" element={
                  <ProtectedRoute>
                    <RiskAssessmentPage />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                } />
                <Route path="/games/:gameId" element={
                  <ProtectedRoute>
                    <GameDetailPage />
                  </ProtectedRoute>
                } />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </SocketProvider>
    </Provider>
  );
};

export default App;
