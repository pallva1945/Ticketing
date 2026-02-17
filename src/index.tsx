import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { WelcomePage } from './components/WelcomePage';
import { InternalHub } from './components/InternalHub';
import { FinancialCenter } from './components/FinancialCenter';
import { CostCenter } from './components/CostCenter';
import { VerticalsPnL } from './components/VerticalsPnL';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';

const Root: React.FC = () => {
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
        <Root />
      </LanguageProvider>
    </ThemeProvider>
  </React.StrictMode>
);
