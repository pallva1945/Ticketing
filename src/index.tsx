import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { WelcomePage } from './components/WelcomePage';
import { InternalHub } from './components/InternalHub';
import { VBHub } from './components/VBHub';
import { FinancialCenter } from './components/FinancialCenter';
import { CostCenter } from './components/CostCenter';
import { VerticalsPnL } from './components/VerticalsPnL';
import { LoginPage } from './components/LoginPage';
import { AdminPanel } from './components/AdminPanel';
import { InviteAcceptPage } from './components/InviteAcceptPage';
import { ApprovalPage } from './components/ApprovalPage';
import { AccessPendingPage } from './components/AccessPendingPage';
import { VBDashboard } from './components/VBDashboard';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const Root: React.FC = () => {
  const { isAuthenticated, isLoading, isAdmin, isPendingApproval, accessLevel, permissions } = useAuth();
  const [currentView, setCurrentView] = useState<string>(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || 'welcome';
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) setCurrentView(hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavigate = (section: string) => {
    setCurrentView(section);
    window.location.hash = section;
  };

  const handleBackToHub = () => {
    setCurrentView('hub');
    window.location.hash = 'hub';
  };

  const handleBackToVBHub = () => {
    setCurrentView('vb-hub');
    window.location.hash = 'vb-hub';
  };

  const handleBackToFinancial = () => {
    setCurrentView('landing');
    window.location.hash = 'landing';
  };

  const handleBackToWelcome = () => {
    setCurrentView('welcome');
    window.location.hash = '';
  };

  const canAccessPage = (pageId: string): boolean => {
    if (isAdmin) return true;
    if (accessLevel === 'full') return true;
    if (accessLevel === 'partial') return permissions.includes(pageId);
    return true;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="w-8 h-8 border-2 border-red-800 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (currentView.startsWith('invite/')) {
    const token = currentView.replace('invite/', '');
    return <InviteAcceptPage token={token} onAccepted={() => {
      handleNavigate('welcome');
      window.location.reload();
    }} />;
  }

  if (currentView.startsWith('approve/')) {
    const token = currentView.replace('approve/', '');
    return <ApprovalPage token={token} onDone={() => {
      handleNavigate('hub');
    }} />;
  }

  if (isPendingApproval) {
    return <AccessPendingPage />;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  if (currentView === 'admin' && isAdmin) {
    return <AdminPanel onBack={() => handleNavigate('hub')} />;
  }

  if (currentView === 'vb' && canAccessPage('hub')) {
    return <VBDashboard onBack={handleBackToVBHub} />;
  }

  if (currentView === 'revenue' && canAccessPage('revenue')) {
    return <App onBackToLanding={handleBackToFinancial} />;
  }

  if (currentView === 'cost' && canAccessPage('cost')) {
    return <CostCenter onBackToLanding={handleBackToFinancial} />;
  }

  if (currentView === 'pnl' && canAccessPage('pnl')) {
    return <VerticalsPnL onBackToLanding={handleBackToFinancial} />;
  }

  if (currentView === 'landing') {
    return <FinancialCenter onNavigate={(section) => {
      if (canAccessPage(section)) handleNavigate(section);
    }} />;
  }

  if (currentView === 'vb-hub' && canAccessPage('hub')) {
    return <VBHub onNavigate={handleNavigate} onBackToWelcome={handleBackToWelcome} />;
  }

  if (currentView === 'hub' && canAccessPage('hub')) {
    return <InternalHub onNavigate={handleNavigate} onBackToWelcome={handleBackToWelcome} />;
  }

  return <WelcomePage onEnterPV={() => handleNavigate('hub')} onEnterVB={() => handleNavigate('vb-hub')} />;
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
