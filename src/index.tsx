import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { FinancialCenter } from './components/FinancialCenter';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';

const Root: React.FC = () => {
  const [currentView, setCurrentView] = useState<string>(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || 'landing';
  });

  const handleNavigate = (section: string) => {
    if (section === 'revenue') {
      setCurrentView('revenue');
      window.location.hash = 'revenue';
    }
  };

  const handleBack = () => {
    setCurrentView('landing');
    window.location.hash = '';
  };

  if (currentView === 'revenue') {
    return <App onBackToLanding={handleBack} />;
  }

  return <FinancialCenter onNavigate={handleNavigate} />;
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
