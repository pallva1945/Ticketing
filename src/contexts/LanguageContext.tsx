import React, { createContext, useContext, useState } from 'react';

type Language = 'en' | 'it';

const translations: Record<string, Record<Language, string>> = {
  'Revenue Intelligence': { en: 'Revenue Intelligence', it: 'Intelligence Ricavi' },
  'AI Advisor': { en: 'AI Advisor', it: 'Consulente AI' },
  'Season Pacing': { en: 'Season Pacing', it: 'Andamento Stagionale' },
  'Ahead of Pace': { en: 'Ahead of Pace', it: 'Sopra il Ritmo' },
  'Behind Pace': { en: 'Behind Pace', it: 'Sotto il Ritmo' },
  'surplus': { en: 'surplus', it: 'surplus' },
  'gap': { en: 'gap', it: 'gap' },
  'Revenue Verticals': { en: 'Revenue Verticals', it: 'Verticali Ricavi' },
  'Strategic Signals': { en: 'Strategic Signals', it: 'Segnali Strategici' },
  'Projected Finish': { en: 'Projected Finish', it: 'Proiezione Fine Stagione' },
  'GameDay Projection': { en: 'GameDay Projection', it: 'Proiezione GameDay' },
  'GameDay Tickets Projection': { en: 'GameDay Tickets Projection', it: 'Proiezione Biglietti GameDay' },
  'Attention Required': { en: 'Attention Required', it: 'Attenzione Richiesta' },
  'Coming Soon': { en: 'Coming Soon', it: 'In Arrivo' },
  'Progress': { en: 'Progress', it: 'Progresso' },
  'Accounted': { en: 'Accounted', it: 'Contabilizzato' },
  'Pace': { en: 'Pace', it: 'Ritmo' },
  'Proj': { en: 'Proj', it: 'Proiez' },
  'Target': { en: 'Target', it: 'Obiettivo' },
  'Collected': { en: 'Collected', it: 'Incassato' },
  'Recognized': { en: 'Recognized', it: 'Riconosciuto' },
  'Signed': { en: 'Signed', it: 'Firmato' },
  'Overview': { en: 'Overview', it: 'Panoramica' },
  'CRM': { en: 'CRM', it: 'CRM' },
  'Comparison': { en: 'Comparison', it: 'Confronto' },
  'Simulator': { en: 'Simulator', it: 'Simulatore' },
  'Home': { en: 'Home', it: 'Home' },
  'Ticketing': { en: 'Ticketing', it: 'Biglietteria' },
  'GameDay': { en: 'GameDay', it: 'GameDay' },
  'Sponsorship': { en: 'Sponsorship', it: 'Sponsorizzazioni' },
  'Merchandising': { en: 'Merchandising', it: 'Merchandising' },
  'Venue Ops': { en: 'Venue Ops', it: 'Operazioni Venue' },
  'Varese Basketball': { en: 'Varese Basketball', it: 'Varese Basketball' },
  'BOps': { en: 'BOps', it: 'BOps' },
  'Modules': { en: 'Modules', it: 'Moduli' },
  'Ticketing Tools': { en: 'Ticketing Tools', it: 'Strumenti Biglietteria' },
  'Data Source': { en: 'Data Source', it: 'Fonte Dati' },
  'Latest Game': { en: 'Latest Game', it: 'Ultima Partita' },
  'Refresh Data': { en: 'Refresh Data', it: 'Aggiorna Dati' },
  '3-Season Revenue Trend': { en: '3-Season Revenue Trend', it: 'Trend Ricavi 3 Stagioni' },
  'behind expected': { en: 'behind expected', it: 'sotto le attese' },
  'pace': { en: 'pace', it: 'ritmo' },
  'Gap': { en: 'Gap', it: 'Gap' },
  'games': { en: 'games', it: 'partite' },
  'Full Year': { en: 'Full Year', it: 'Anno Intero' },
  'vs target': { en: 'vs target', it: 'vs obiettivo' },
  'GameDay view tickets': { en: 'GameDay view tickets', it: 'Biglietti vista GameDay' },
  'Tickets sold on game day': { en: 'Tickets sold on game day', it: 'Biglietti venduti il giorno della partita' },
  'Accounting': { en: 'Accounting', it: 'Contabile' },
  'Realistic': { en: 'Realistic', it: 'Realistico' },
  'Board Report': { en: 'Board Report', it: 'Report CDA' },
  'Upload': { en: 'Upload', it: 'Carica' },
  'Settings': { en: 'Settings', it: 'Impostazioni' },
};

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  toggleLanguage: () => {},
  t: (key: string) => key,
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('pv-language');
    return (saved === 'it' ? 'it' : 'en');
  });

  const toggleLanguage = () => {
    const next = language === 'en' ? 'it' : 'en';
    setLanguage(next);
    localStorage.setItem('pv-language', next);
  };

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
