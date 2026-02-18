import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { WelcomePage } from './components/WelcomePage';
import { InternalHub } from './components/InternalHub';
import { FinancialCenter } from './components/FinancialCenter';
import { CostCenter } from './components/CostCenter';
import { VerticalsPnL } from './components/VerticalsPnL';
import { LoginPage } from './components/LoginPage';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const Root: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<string>(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || 'welcome';
  });

  const handleNavigate = (section: string) => {
    setCurrentView(section);
    window.location.hash = section;
  };

  const handleBackToHub = () => {
    setCurrentView('hub');
    window.location.hash = 'hub';
  };

  const handleBackToFinancial = () => {
    setCurrentView('landing');
    window.location.hash = 'landing';
  };

  const handleBackToWelcome = () => {
    setCurrentView('welcome');
    window.location.hash = '';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="w-8 h-8 border-2 border-red-800 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  if (currentView === 'revenue') {
    return <App onBackToLanding={handleBackToFinancial} />;
  }

  if (currentView === 'cost') {
    return <CostCenter onBackToLanding={handleBackToFinancial} />;
  }

  if (currentView === 'pnl') {
    return <VerticalsPnL onBackToLanding={handleBackToFinancial} />;
  }

  if (currentView === 'landing') {
    return <FinancialCenter onNavigate={handleNavigate} />;
  }

  if (currentView === 'hub') {
    return <InternalHub onNavigate={handleNavigate} onBackToWelcome={handleBackToWelcome} />;
  }

  return <WelcomePage onEnter={() => handleNavigate('hub')} />;
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <Root />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </React.StrictMode>
);
