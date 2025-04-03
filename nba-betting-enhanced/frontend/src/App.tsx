import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { SocketProvider } from './contexts/SocketContext';

// Pages
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import GameDetailPage from './pages/GameDetailPage';
import RiskAssessmentPage from './pages/RiskAssessmentPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/auth/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';

const App: React.FC = () => {
  const [sidebarVisible, setSidebarVisible] = useState(true);
  
  // Function to toggle sidebar visibility
  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  return (
    <Provider store={store}>
      <SocketProvider>
        <Router>
          <div className="flex flex-col min-h-screen bg-betting-dark text-white">
            <Header />
            <div className="flex-grow">
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                
                {/* Protected routes with sidebar layout */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <div className="container mx-auto px-4 py-8">
                        <DashboardPage />
                      </div>
                    </MainLayout>
                  </ProtectedRoute>
                } />
                <Route path="/risk-assessment" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <div className="container mx-auto px-4 py-8">
                        <RiskAssessmentPage />
                      </div>
                    </MainLayout>
                  </ProtectedRoute>
                } />
                <Route path="/games/:gameId" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <div className="container mx-auto px-4 py-8">
                        <GameDetailPage />
                      </div>
                    </MainLayout>
                  </ProtectedRoute>
                } />
                
                {/* Add routes for new sidebar navigation items */}
                <Route path="/favorites" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <div className="container mx-auto px-4 py-8">
                        <h1>Favorites</h1>
                        <p>Your favorite games and teams will appear here.</p>
                      </div>
                    </MainLayout>
                  </ProtectedRoute>
                } />
                <Route path="/history" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <div className="container mx-auto px-4 py-8">
                        <h1>Betting History</h1>
                        <p>Your betting history will appear here.</p>
                      </div>
                    </MainLayout>
                  </ProtectedRoute>
                } />
              </Routes>
            </div>
            <Footer />
          </div>
        </Router>
      </SocketProvider>
    </Provider>
  );
};

export default App;
