import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { WelcomePage } from './components/WelcomePage';
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

  const handleBack = () => {
    setCurrentView('landing');
    window.location.hash = 'landing';
  };

  const handleBackToWelcome = () => {
    setCurrentView('welcome');
    window.location.hash = '';
  };

  if (currentView === 'revenue') {
    return <App onBackToLanding={handleBack} />;
  }

  if (currentView === 'cost') {
    return <CostCenter onBackToLanding={handleBack} />;
  }

  if (currentView === 'pnl') {
    return <VerticalsPnL onBackToLanding={handleBack} />;
  }

  if (currentView === 'landing') {
    return <FinancialCenter onNavigate={handleNavigate} />;
  }

  return <WelcomePage onEnter={() => handleNavigate('landing')} />;
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
