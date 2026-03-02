import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, Building2, Dumbbell, MapPin, Calendar, Target, DollarSign, Clock, Users, CheckCircle2, Circle, AlertCircle, ChevronLeft, ChevronRight, FileText, FileSignature, Banknote, FileCheck2, FileLock2, LayoutGrid, ExternalLink } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { PV_LOGO_URL } from '../constants';

interface ProjectsHubProps {
  onBackToWelcome: () => void;
}

const ARENA_IMAGE = 'https://images.unsplash.com/photo-1505666287802-931dc83948e5?w=800&q=80';
const CAMPUS_HERO = '/campus/campus_hero.png';

const RENDERINGS = Array.from({ length: 25 }, (_, i) => `/campus/renderings/render${i + 1}.jpg`);

const campusText = (lang: string) => {
  const isEN = lang === 'en';
  return {
    nav: isEN
      ? [['#campus-vision', 'The Vision'], ['#campus-project', 'The Project'], ['#campus-financials', 'Financials'], ['#campus-leadership', 'Leadership']]
      : [['#campus-vision', 'La Visione'], ['#campus-project', 'Il Progetto'], ['#campus-financials', 'Dati Finanziari'], ['#campus-leadership', 'Leadership']],
    heroTitle: isEN ? 'A Strategic Investment in the Future of Varese' : 'Un Investimento Strategico nel Futuro di Varese',
    heroDesc: isEN
      ? 'Investment proposal for the transformation of the Varese Campus: a guaranteed project with confirmed market demand and exceptional financial soundness.'
      : 'Proposta di investimento per la trasformazione del Varese Campus: un progetto garantito, con domanda di mercato confermata e una solidità finanziaria eccezionale.',
    heroCTA: isEN ? 'Financial Analysis' : 'Analisi Finanziaria',
    kpis: isEN
      ? [{ label: 'Financing Requested', value: '€2,500,000', color: 'text-white' }, { label: 'NOI (Year 1)', value: '€233,720', color: 'text-white' }, { label: 'DSCR', value: '1.60x', color: 'text-green-400' }]
      : [{ label: 'Finanziamento Richiesto', value: '€2.500.000', color: 'text-white' }, { label: 'NOI (Anno 1)', value: '€233.720', color: 'text-white' }, { label: 'DSCR', value: '1.60x', color: 'text-green-400' }],
    visionTitle: isEN ? 'The Vision: A New Hub for Varese' : 'La Visione: Un Nuovo Polo per Varese',
    visionDesc: isEN
      ? 'The "Varese Campus" project was born to create an integrated ecosystem that combines high-level sports, wellness, and commercial activities.'
      : 'Il progetto "Varese Campus" nasce per creare un ecosistema integrato che unisca sport di alto livello, benessere e attività commerciali.',
    carouselTitle: isEN ? 'Project Renderings' : 'Rendering del progetto',
    projectTitle: isEN ? 'The Project in Detail' : 'Il Progetto in Dettaglio',
    projectDesc: isEN
      ? 'The €3,000,000 investment will be allocated to a complete redevelopment of the facility, as detailed in the official project floor plans.'
      : "L'investimento di €3.000.000 sarà destinato a una riqualificazione completa della struttura, come dettagliato nelle planimetrie ufficiali del progetto.",
    floorplans: isEN
      ? [{ title: 'Ground Floor', desc: 'Management areas, offices and common spaces.' }, { title: 'Basement (Gym)', desc: 'Areas dedicated to gym, pilates and changing rooms.' }, { title: 'Basement (Retail)', desc: 'Commercial spaces and dining area.' }]
      : [{ title: 'Piano Rialzato', desc: 'Aree direzionali, uffici e spazi comuni.' }, { title: 'Piano Seminterrato (Palestre)', desc: 'Aree dedicate a palestra, pilates e spogliatoi.' }, { title: 'Piano Seminterrato (Negozi)', desc: 'Spazi commerciali e area ristorazione.' }],
    finTitle: isEN ? 'Proven Financial Soundness' : 'Solidità Finanziaria Comprovata',
    finDesc: isEN
      ? 'A detailed analysis based on real data from letters of intent and official reports.'
      : "Un'analisi dettagliata basata su dati reali provenienti da lettere d'intenti e report ufficiali.",
    revTitle: isEN ? 'Revenue and Savings Detail (Year 1)' : 'Dettaglio Ricavi e Risparmi (Anno 1)',
    revHeaders: isEN ? ['Source', 'Annual Amount (€)', 'Basis'] : ['Fonte', 'Importo Annuale (€)', 'Base di Calcolo'],
    revTable: isEN ? [
      { category: true, label: 'Direct Operational Savings' },
      { label: 'Office/Field Rental Savings', amount: '€75,000', basis: 'PV Savings Report' },
      { label: 'Energy Cost Savings', amount: '€40,000', basis: 'PV Savings Report' },
      { category: true, label: 'Lease Revenue (Confirmed by LOI)' },
      { label: 'Gym Rent', amount: '€67,000', basis: 'Gym LOI' },
      { label: 'Ivolution LAB Rent', amount: '€55,000', basis: 'Ivolution LOI' },
      { label: 'LSG Office Rent', amount: '€24,000', basis: 'LSG LOI' },
      { label: 'Restaurant Rent', amount: '€24,000', basis: 'Restaurant LOI' },
      { label: 'Pilates Studio Rent', amount: '€17,000', basis: 'Pilates LOI' },
      { total: true, label: 'Total Revenue and Savings', amount: '€302,000' },
    ] : [
      { category: true, label: 'Risparmi Operativi Diretti' },
      { label: 'Risparmio Affitto Uffici/Campi', amount: '€75.000', basis: 'Report PV Savings' },
      { label: 'Risparmio Costi Energetici', amount: '€40.000', basis: 'Report PV Savings' },
      { category: true, label: 'Ricavi da Locazione (Confermati da LOI)' },
      { label: 'Affitto Palestra', amount: '€67.000', basis: 'LOI Palestra' },
      { label: 'Affitto Ivolution LAB', amount: '€55.000', basis: 'LOI Ivolution' },
      { label: 'Affitto Uffici LSG', amount: '€24.000', basis: 'LOI LSG' },
      { label: 'Affitto Ristorante', amount: '€24.000', basis: 'LOI Ristorante' },
      { label: 'Affitto Studio Pilates', amount: '€17.000', basis: 'LOI Pilates' },
      { total: true, label: 'Totale Ricavi e Risparmi', amount: '€302.000' },
    ],
    expTitle: isEN ? 'Operating Expenses Detail (Year 1)' : 'Dettaglio Spese Operative (Anno 1)',
    expHeaders: isEN ? ['Expense Item', 'Annual Cost (€)', 'Basis'] : ['Voce di Spesa', 'Costo Annuale (€)', 'Base di Calcolo'],
    expTable: isEN ? [
      { label: 'Insurance (Property & Liability)', amount: '€15,000', basis: 'Quote based on asset value' },
      { label: 'Property Management Fees', amount: '€7,480', basis: '4% of Lease Revenue (€187k)' },
      { label: 'Repairs and Maintenance', amount: '€15,000', basis: 'Standard industry estimate' },
      { label: 'Common Area Utilities', amount: '€12,000', basis: 'Estimate for shared spaces' },
      { label: 'Marketing and Administrative Expenses', amount: '€5,000', basis: 'Fund for leasing activities' },
      { label: 'Sinking Fund (CAPEX Reserve)', amount: '€15,000', basis: '0.5% of project value/year' },
      { total: true, label: 'Total Annual Operating Expenses', amount: '€69,480' },
    ] : [
      { label: 'Assicurazione (Proprietà e RC)', amount: '€15.000', basis: "Preventivo basato sul valore dell'asset" },
      { label: 'Commissioni di Gestione Immobiliare', amount: '€7.480', basis: '4% dei Ricavi da Locazione (€187k)' },
      { label: 'Riparazioni e Manutenzione', amount: '€15.000', basis: 'Stima standard di settore' },
      { label: 'Utenze Aree Comuni', amount: '€12.000', basis: 'Stima per spazi condivisi' },
      { label: 'Marketing e Spese Amministrative', amount: '€5.000', basis: 'Fondo per attività di leasing' },
      { label: 'Fondo Ammortamento (CAPEX Reserve)', amount: '€15.000', basis: '0.5% del valore del progetto/anno' },
      { total: true, label: 'Totale Spese Operative Annuali', amount: '€69.480' },
    ],
    proformaTitle: isEN ? 'Financial Pro-Forma (Recommended Scenario)' : 'Pro-Forma Finanziario (Scenario Raccomandato)',
    proformaHeaders: isEN ? ['Metric', 'Year 1', 'Year 2', 'Year 3'] : ['Metrica', 'Anno 1', 'Anno 2', 'Anno 3'],
    proforma: isEN ? [
      { label: 'Total Revenue and Savings', y1: '€302,000', y2: '€306,725', y3: '€311,566', bold: true },
      { label: 'Operating Expenses', y1: '-€69,480', y2: '-€71,217', y3: '-€72,997', bold: true },
      { label: 'Net Operating Income (NOI)', y1: '€232,520', y2: '€235,508', y3: '€238,569', bold: true, highlight: 'gray' as const },
      { label: 'Loan Payment', y1: '-€146,165', y2: '-€146,165', y3: '-€146,165', bold: true },
      { label: 'Net Cash Flow', y1: '€86,355', y2: '€89,343', y3: '€92,404', bold: true, highlight: 'green' as const },
      { label: 'DSCR', y1: '1.59x', y2: '1.61x', y3: '1.63x', bold: true, highlight: 'dark' as const },
    ] : [
      { label: 'Totale Ricavi e Risparmi', y1: '€302.000', y2: '€306.725', y3: '€311.566', bold: true },
      { label: 'Spese Operative', y1: '-€69.480', y2: '-€71.217', y3: '-€72.997', bold: true },
      { label: 'Utile Operativo Netto (NOI)', y1: '€232.520', y2: '€235.508', y3: '€238.569', bold: true, highlight: 'gray' as const },
      { label: 'Rata del Finanziamento', y1: '-€146.165', y2: '-€146.165', y3: '-€146.165', bold: true },
      { label: 'Flusso di Cassa Netto', y1: '€86.355', y2: '€89.343', y3: '€92.404', bold: true, highlight: 'green' as const },
      { label: 'DSCR', y1: '1.59x', y2: '1.61x', y3: '1.63x', bold: true, highlight: 'dark' as const },
    ],
    proformaNote: isEN
      ? '*Based on €2.5M loan at 5% over 25 years and €500k equity contribution. 2.5% annual growth.'
      : '*Basato su un finanziamento di €2.5M al 5% su 25 anni e un apporto di capitale di €500k. Crescita annua del 2.5%.',
    stressTitle: isEN ? 'Severe Financial Stress Test' : 'Stress Test Finanziario Severo',
    stressDesc: isEN
      ? 'The model withstands an adverse scenario that simultaneously includes a 20% vacancy loss on lease revenue and a 10% increase in operating expenses.'
      : 'Il modello resiste a uno scenario avverso che prevede simultaneamente uno sfitto del 20% dei ricavi da locazione e un aumento del 10% delle spese operative.',
    stressHeaders: isEN ? ['Metric (Stress Test)', 'Amount (€)'] : ['Metrica (Stress Test)', 'Importo (€)'],
    stressTable: isEN ? [
      { label: 'Total Stressed Revenue', value: '€264,600' },
      { label: 'Stressed Operating Expenses (+10%)', value: '-€76,428' },
      { label: 'Stressed NOI', value: '€188,172', bold: true, highlight: true },
      { label: 'Loan Payment', value: '-€146,165' },
      { label: 'DSCR (Stress Test)', value: '1.29x', bold: true, pass: true },
    ] : [
      { label: 'Ricavi Totali in Stress', value: '€264.600' },
      { label: 'Spese Operative in Stress (+10%)', value: '-€76.428' },
      { label: 'NOI in Stress', value: '€188.172', bold: true, highlight: true },
      { label: 'Rata del Finanziamento', value: '-€146.165' },
      { label: 'DSCR (Stress Test)', value: '1.29x', bold: true, pass: true },
    ],
    stressNote: isEN
      ? '*A DSCR above 1.25x even in the stress scenario places the project in an exceptionally low-risk category.'
      : '*Un DSCR superiore a 1.25x anche nello scenario di stress posiziona il progetto in una categoria di rischio eccezionalmente bassa.',
    leadTitle: isEN ? 'Leadership and Management' : 'Leadership e Management',
    leadDesc: isEN
      ? 'The project is led by an international-caliber team with proven experience in the sports, financial, and industrial sectors.'
      : 'Il progetto è guidato da un team di caratura internazionale con comprovata esperienza nei settori sportivo, finanziario e industriale.',
    leadership: isEN ? [
      { name: 'Luis Scola', role: 'CEO & Owner', desc: 'A world basketball legend, he guides the strategic vision and operational management of the club.', img: '/campus/scola.png' },
      { name: 'Antonio Bulgheroni', role: 'Board of Directors', desc: 'A historic figure in Varese, former player and successful industrialist.', img: '/campus/bulgheroni.jpg' },
      { name: 'Paolo Perego', role: 'Vice President', desc: 'Provides key strategic oversight to the club.', img: '/campus/perego.jpeg' },
      { name: 'Stefano Bonfiglio', role: 'Partner, Sterling Square', desc: 'Co-founder of the private equity fund Stirling Square, he brings elite experience in global finance.', img: '/campus/bonfiglio.png' },
      { name: 'Zach Sogolow', role: 'GM, Basketball Operations', desc: 'Directs the technical strategy and sports operations of the club.', img: '/campus/sogolow.jpeg' },
      { name: 'Maksim Horowitz', role: 'GM, Business & Strategy', desc: 'Leads business development and long-term growth initiatives.', img: '/campus/horowitz.jpeg' },
      { name: 'Marco Zamberletti', role: 'Sponsorship & Partnership', desc: 'Manages commercial relationships and key sponsorships.', img: '/campus/zamberletti.jpg' },
      { name: 'Federico Bellotto', role: 'CEO, Varese Basket', desc: 'Organizes and manages all projects related to Varese Basket.', img: '/campus/bellotto.jpeg' },
    ] : [
      { name: 'Luis Scola', role: 'CEO & Proprietario', desc: 'Leggenda del basket mondiale, guida la visione strategica e la gestione operativa del club.', img: '/campus/scola.png' },
      { name: 'Antonio Bulgheroni', role: 'Consiglio di Amministrazione', desc: 'Figura storica di Varese, ex giocatore e industriale di successo.', img: '/campus/bulgheroni.jpg' },
      { name: 'Paolo Perego', role: 'Vice Presidente', desc: 'Fornisce una supervisione strategica chiave al club.', img: '/campus/perego.jpeg' },
      { name: 'Stefano Bonfiglio', role: 'Partner, Sterling Square', desc: "Co-fondatore del fondo di private equity Stirling Square, porta un'esperienza elitaria nella finanza globale.", img: '/campus/bonfiglio.png' },
      { name: 'Zach Sogolow', role: 'GM, Basketball Operations', desc: 'Dirige la strategia tecnica e le operazioni sportive del club.', img: '/campus/sogolow.jpeg' },
      { name: 'Maksim Horowitz', role: 'GM, Business & Strategy', desc: 'Guida lo sviluppo del business e le iniziative di crescita a lungo termine.', img: '/campus/horowitz.jpeg' },
      { name: 'Marco Zamberletti', role: 'Sponsorship & Partnership', desc: 'Gestisce le relazioni commerciali e le sponsorizzazioni chiave.', img: '/campus/zamberletti.jpg' },
      { name: 'Federico Bellotto', role: 'CEO, Varese Basket', desc: 'Organizza e gestisce tutti i progetti collegati a Varese Basket.', img: '/campus/bellotto.jpeg' },
    ],
    docTitle: isEN ? 'Complete Documentation' : 'Documentazione Completa',
    docDesc: isEN
      ? 'Access all supporting documentation for a complete review of the proposal.'
      : 'Accesso a tutta la documentazione di supporto per una revisione completa della proposta.',
    docs: isEN ? [
      { title: 'Architectural Floor Plans', desc: 'Executive drawings and detailed project plans.' },
      { title: 'Letters of Intent (LOI)', desc: 'Formal commitments from all future tenants.' },
      { title: 'Broker Opinion of Value', desc: 'Third-party validation of market rents.' },
      { title: 'PV Savings Report', desc: 'Detailed analysis of certified operational savings.' },
      { title: 'Legal Documents', desc: 'Includes the Property Guarantee and construction contract.' },
    ] : [
      { title: 'Planimetrie Architettoniche', desc: 'Disegni esecutivi e piante dettagliate del progetto.' },
      { title: 'Lettere di Intenti (LOI)', desc: 'Impegni formali da parte di tutti i futuri locatari.' },
      { title: 'Broker Opinion of Value', desc: 'Validazione dei canoni di mercato da parte di terzi.' },
      { title: 'Report Risparmi PV', desc: 'Analisi dettagliata dei risparmi operativi certificati.' },
      { title: 'Documenti Legali', desc: "Include la Garanzia della Proprietà e il contratto di appalto." },
    ],
    contactTitle: isEN ? 'Contact' : 'Contatti',
    contactDesc: isEN
      ? 'We are fully available to provide further details and for an in-depth meeting.'
      : 'Siamo a completa disposizione per fornire ulteriori dettagli e per un incontro di approfondimento.',
    rights: isEN ? 'All rights reserved.' : 'Tutti i diritti riservati.',
  };
};

const FLOORPLAN_IMGS = ['/campus/floorplan_rilazato.png', '/campus/floorplan_palestra.png', '/campus/floorplan_negozio.png'];
const DOC_ICONS = [LayoutGrid, FileSignature, Banknote, FileCheck2, FileLock2];

const CampusDetailPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { language, t } = useLanguage();
  const tx = campusText(language);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setVisibleSections(prev => new Set(prev).add(entry.target.id));
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    document.querySelectorAll('.campus-fade').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const fadeClass = (id: string) =>
    `campus-fade transition-all duration-700 ${visibleSections.has(id) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`;

  const scrollCarousel = (dir: number) => {
    if (!carouselRef.current) return;
    const img = carouselRef.current.querySelector('img');
    const w = (img?.offsetWidth || 300) + 24;
    carouselRef.current.scrollBy({ left: w * dir, behavior: 'smooth' });
  };

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const id = href.replace('#', '');
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="bg-gray-50 text-gray-800 min-h-screen" style={{ fontFamily: "'Inter', sans-serif" }}>
      <header className="bg-white/90 backdrop-blur-lg sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mr-2">
              <ArrowLeft size={16} />
              {t('Projects')}
            </button>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-red-700">
              <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 7L12 12L22 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 22V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-lg font-bold text-gray-800">Varese Campus</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-600">
            {tx.nav.map(([href, label]) => (
              <a key={href} href={href} onClick={(e) => scrollToSection(e, href)} className="relative pb-1 hover:text-red-700 transition-colors group">
                {label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-700 group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main>
        <section className="bg-gradient-to-br from-gray-900 to-gray-700 text-white">
          <div className="max-w-7xl mx-auto px-6 py-20 md:py-28 text-center">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight mb-4">{tx.heroTitle}</h1>
            <p className="text-base md:text-lg text-gray-300 max-w-3xl mx-auto mb-8">{tx.heroDesc}</p>
            <a href="#campus-financials" onClick={(e) => scrollToSection(e, '#campus-financials')} className="inline-block bg-red-700 text-white font-bold px-8 py-3.5 rounded-md hover:bg-red-800 transition-all text-base shadow-lg">{tx.heroCTA}</a>
          </div>
          <div className="max-w-5xl mx-auto px-6 pb-20 md:pb-28">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {tx.kpis.map((kpi, i) => (
                <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-lg text-center hover:bg-white/10 hover:-translate-y-1 transition-all duration-300">
                  <h3 className="text-gray-400 text-xs font-medium uppercase tracking-wider">{kpi.label}</h3>
                  <p className={`text-3xl md:text-4xl font-bold mt-2 ${kpi.color}`}>{kpi.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="campus-vision" className="py-20 md:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <h2 id="vision-title" className={`text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 ${fadeClass('vision-title')}`}>{tx.visionTitle}</h2>
              <p id="vision-desc" className={`text-base text-gray-600 ${fadeClass('vision-desc')}`}>{tx.visionDesc}</p>
            </div>

            <div className="relative bg-white rounded-xl shadow-2xl p-4 md:p-6 overflow-hidden">
              <h3 className="text-xl md:text-2xl font-extrabold text-gray-900 text-center mb-4">{tx.carouselTitle}</h3>
              <div ref={carouselRef} className="flex overflow-x-auto scroll-smooth snap-x snap-mandatory gap-4 pb-3" style={{ scrollbarWidth: 'none' }}>
                {RENDERINGS.map((src, i) => (
                  <img key={i} src={src} alt={`Rendering ${i + 1}`} className="flex-none w-full sm:w-1/2 lg:w-1/3 rounded-lg shadow-md snap-center object-cover h-56" loading="lazy" />
                ))}
              </div>
              <button onClick={() => scrollCarousel(-1)} className="absolute top-1/2 left-3 -translate-y-1/2 bg-white text-gray-800 p-2 rounded-full shadow-lg hover:bg-gray-100 transition-colors z-10">
                <ChevronLeft size={20} />
              </button>
              <button onClick={() => scrollCarousel(1)} className="absolute top-1/2 right-3 -translate-y-1/2 bg-white text-gray-800 p-2 rounded-full shadow-lg hover:bg-gray-100 transition-colors z-10">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </section>

        <section id="campus-project" className="py-20 md:py-28 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <h2 id="project-title" className={`text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 ${fadeClass('project-title')}`}>{tx.projectTitle}</h2>
              <p id="project-desc" className={`text-base text-gray-600 ${fadeClass('project-desc')}`}>{tx.projectDesc}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {tx.floorplans.map((plan, i) => (
                <div key={i} id={`plan-${i}`} className={`bg-white border border-gray-200 p-5 rounded-lg hover:-translate-y-1 hover:shadow-xl hover:border-red-700 transition-all duration-300 ${fadeClass(`plan-${i}`)}`}>
                  <img src={FLOORPLAN_IMGS[i]} alt={plan.title} className="rounded-md mb-4 w-full h-44 object-cover object-top" loading="lazy" />
                  <h3 className="text-lg font-bold text-gray-900">{plan.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{plan.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="campus-financials" className="py-20 md:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <h2 id="fin-title" className={`text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 ${fadeClass('fin-title')}`}>{tx.finTitle}</h2>
              <p id="fin-desc" className={`text-base text-gray-600 ${fadeClass('fin-desc')}`}>{tx.finDesc}</p>
            </div>

            <div id="fin-tables" className={`bg-white p-5 sm:p-8 rounded-lg shadow-lg border border-gray-200 ${fadeClass('fin-tables')}`}>
              <h3 className="text-xl font-bold mb-5">{tx.revTitle}</h3>
              <div className="overflow-x-auto mb-10">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="py-2.5 pr-2 font-semibold">{tx.revHeaders[0]}</th>
                      <th className="py-2.5 px-2 font-semibold text-right">{tx.revHeaders[1]}</th>
                      <th className="py-2.5 px-2 font-semibold">{tx.revHeaders[2]}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tx.revTable.map((r: any, i: number) =>
                      r.category ? (
                        <tr key={i} className="bg-gray-50"><td colSpan={3} className="py-2 px-1 font-bold text-sm">{r.label}</td></tr>
                      ) : r.total ? (
                        <tr key={i} className="bg-gray-800 text-white"><td className="py-3 pr-2 font-bold">{r.label}</td><td className="py-3 px-2 text-right font-bold text-lg">{r.amount}</td><td /></tr>
                      ) : (
                        <tr key={i} className="border-b border-gray-200"><td className="py-2 pr-2">{r.label}</td><td className="py-2 px-2 text-right">{r.amount}</td><td className="py-2 px-2 text-gray-500 text-xs">{r.basis}</td></tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              <h3 className="text-xl font-bold mb-5">{tx.expTitle}</h3>
              <div className="overflow-x-auto mb-10">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="py-2.5 pr-2 font-semibold">{tx.expHeaders[0]}</th>
                      <th className="py-2.5 px-2 font-semibold text-right">{tx.expHeaders[1]}</th>
                      <th className="py-2.5 px-2 font-semibold">{tx.expHeaders[2]}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tx.expTable.map((r: any, i: number) =>
                      r.total ? (
                        <tr key={i} className="bg-gray-100"><td className="py-3 pr-2 font-bold">{r.label}</td><td className="py-3 px-2 text-right font-bold">{r.amount}</td><td /></tr>
                      ) : (
                        <tr key={i} className="border-b border-gray-200"><td className="py-2 pr-2">{r.label}</td><td className="py-2 px-2 text-right">{r.amount}</td><td className="py-2 px-2 text-gray-500 text-xs">{r.basis}</td></tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              <h3 className="text-xl font-bold mb-5">{tx.proformaTitle}</h3>
              <div className="overflow-x-auto mb-10">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      {tx.proformaHeaders.map((h, i) => (
                        <th key={i} className={`py-2.5 ${i === 0 ? 'pr-2' : 'px-2'} font-semibold ${i > 0 ? 'text-right' : ''}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tx.proforma.map((r, i) => (
                      <tr key={i} className={`${r.highlight === 'gray' ? 'bg-gray-100 border-b-2 border-gray-300' : r.highlight === 'green' ? 'bg-green-50 border-b-2 border-gray-300' : r.highlight === 'dark' ? 'bg-gray-800 text-white' : 'border-b border-gray-200'}`}>
                        <td className={`py-2.5 pr-2 ${r.bold ? 'font-bold' : ''} ${r.highlight === 'green' ? 'text-green-800' : ''}`}>{r.label}</td>
                        <td className={`py-2.5 px-2 text-right ${r.bold ? 'font-bold' : ''} ${r.highlight === 'green' ? 'text-green-800' : ''}`}>{r.y1}</td>
                        <td className={`py-2.5 px-2 text-right ${r.bold ? 'font-bold' : ''} ${r.highlight === 'green' ? 'text-green-800' : ''}`}>{r.y2}</td>
                        <td className={`py-2.5 px-2 text-right ${r.bold ? 'font-bold' : ''} ${r.highlight === 'green' ? 'text-green-800' : ''}`}>{r.y3}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-xs text-gray-500 mt-2">{tx.proformaNote}</p>
              </div>

              <h3 className="text-xl font-bold mb-3">{tx.stressTitle}</h3>
              <p className="text-sm text-gray-600 mb-5">{tx.stressDesc}</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="py-2.5 pr-2 font-semibold">{tx.stressHeaders[0]}</th>
                      <th className="py-2.5 px-2 font-semibold text-right">{tx.stressHeaders[1]}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tx.stressTable.map((r: any, i: number) => (
                      <tr key={i} className={`${r.highlight ? 'bg-gray-100 border-b-2 border-gray-300' : r.pass ? 'bg-yellow-50' : 'border-b border-gray-200'}`}>
                        <td className={`py-2.5 pr-2 ${r.bold ? 'font-bold' : ''}`}>{r.label}</td>
                        <td className={`py-2.5 px-2 text-right ${r.bold ? 'font-bold' : ''} ${r.pass ? 'text-green-600 font-bold' : ''}`}>{r.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-xs text-gray-500 mt-2">{tx.stressNote}</p>
              </div>
            </div>
          </div>
        </section>

        <section id="campus-leadership" className="py-20 md:py-28 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <h2 id="lead-title" className={`text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 ${fadeClass('lead-title')}`}>{tx.leadTitle}</h2>
              <p id="lead-desc" className={`text-base text-gray-600 ${fadeClass('lead-desc')}`}>{tx.leadDesc}</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {tx.leadership.map((person, i) => (
                <div key={i} id={`lead-${i}`} className={`bg-white border border-gray-200 p-5 rounded-lg text-center hover:-translate-y-1 hover:shadow-xl hover:border-red-700 transition-all duration-300 ${fadeClass(`lead-${i}`)}`}>
                  <img src={person.img} alt={person.name} className="w-20 h-20 rounded-full mx-auto mb-3 object-cover bg-gray-200" loading="lazy" />
                  <h4 className="text-sm font-bold text-gray-900">{person.name}</h4>
                  <p className="text-red-700 font-semibold text-xs mb-1.5">{person.role}</p>
                  <p className="text-xs text-gray-600 leading-relaxed">{person.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 md:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <h2 id="doc-title" className={`text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 ${fadeClass('doc-title')}`}>{tx.docTitle}</h2>
              <p id="doc-desc" className={`text-base text-gray-600 ${fadeClass('doc-desc')}`}>{tx.docDesc}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tx.docs.map((doc, i) => {
                const Icon = DOC_ICONS[i];
                return (
                  <div key={i} id={`doc-${i}`} className={`bg-white border border-gray-200 p-5 rounded-lg hover:-translate-y-1 hover:shadow-xl hover:border-red-700 transition-all duration-300 cursor-pointer ${fadeClass(`doc-${i}`)}`}>
                    <div className="flex items-center mb-3">
                      <div className="bg-red-100 p-2.5 rounded-full mr-3">
                        <Icon size={18} className="text-red-700" />
                      </div>
                      <h3 className="text-base font-bold text-gray-900">{doc.title}</h3>
                    </div>
                    <p className="text-sm text-gray-600">{doc.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-10 text-center">
          <h2 className="text-xl font-bold mb-3">{tx.contactTitle}</h2>
          <p className="text-gray-400 mb-4 max-w-xl mx-auto text-sm">{tx.contactDesc}</p>
          <p className="font-medium text-sm">Pallacanestro Varese S.R.L.</p>
          <p className="text-gray-400 text-sm">Piazzale Gramsci snc, 21100 Varese</p>
          <a href="mailto:info@pallacanestrovarese.it" className="text-red-500 hover:text-red-400 transition text-sm">info@pallacanestrovarese.it</a>
          <div className="mt-6 border-t border-gray-800 pt-6">
            <p className="text-xs text-gray-500">&copy; 2025 Pallacanestro Varese S.R.L. {tx.rights}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export const ProjectsHub: React.FC<ProjectsHubProps> = ({ onBackToWelcome }) => {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const isDark = theme === 'dark';
  const [phase, setPhase] = useState(0);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 100);
    const t2 = setTimeout(() => setPhase(2), 400);
    const t3 = setTimeout(() => setPhase(3), 700);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  if (selectedProject === 'campus') {
    return <CampusDetailPage onBack={() => setSelectedProject(null)} />;
  }

  if (selectedProject === 'arena') {
    return (
      <div className={`min-h-screen ${isDark ? 'dark bg-gray-950' : 'bg-gray-50'}`}>
        <div className="fixed top-0 left-0 w-full bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 z-50 px-4">
          <div className="flex items-center justify-between py-2.5 max-w-5xl mx-auto">
            <button onClick={() => setSelectedProject(null)} className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
              <ArrowLeft size={16} />
              {t('Projects')}
            </button>
            <div className="flex items-center gap-2">
              <Building2 size={18} className="text-blue-600" />
              <span className="text-sm font-bold text-gray-900 dark:text-white">{t('Arena Remodelation')}</span>
            </div>
            <div className="w-20" />
          </div>
        </div>
        <div className="pt-16 pb-12 max-w-5xl mx-auto px-4">
          <div className="relative rounded-2xl overflow-hidden mb-8 h-48 sm:h-64">
            <img src={ARENA_IMAGE} alt="Arena" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-blue-950/90 via-blue-950/40 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6 sm:p-8">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-3 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">{t('Concept Phase')}</span>
              <h1 className="text-2xl sm:text-4xl font-bold text-white mb-1">{t('Arena Remodelation')}</h1>
              <p className="text-sm text-white/70">Palazzetto dello Sport</p>
            </div>
          </div>
          <p className={`text-sm leading-relaxed mb-8 max-w-3xl ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {t('Comprehensive renovation of the arena to enhance the fan experience, modernize facilities, and increase revenue potential.')}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[
              { icon: MapPin, label: t('Location'), value: 'Via Marzorati, Masnago' },
              { icon: Calendar, label: t('Timeline'), value: t('2026–2029') },
              { icon: Target, label: t('Scope'), value: t('Seating, Hospitality, Tech, Accessibility') },
              { icon: DollarSign, label: t('Focus'), value: t('Fan Experience & Revenue Growth') },
            ].map(d => {
              const DIcon = d.icon;
              return (
                <div key={d.label} className={`rounded-xl border p-4 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                  <DIcon size={16} className="mb-2 text-blue-500" />
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{d.label}</p>
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">{d.value}</p>
                </div>
              );
            })}
          </div>
          <div className={`rounded-xl border p-6 mb-6 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">{t('Project Milestones')}</h3>
              <span className="text-xs font-bold text-blue-600">17% {t('complete')}</span>
            </div>
            <div className={`h-2 rounded-full mb-6 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600" style={{ width: '17%' }} />
            </div>
            <div className="space-y-3">
              {[
                { label: t('Concept & Vision'), done: true },
                { label: t('Stakeholder Alignment'), done: false, current: true },
                { label: t('Engineering Assessment'), done: false },
                { label: t('Funding & Partnerships'), done: false },
                { label: t('Phased Renovation'), done: false },
                { label: t('Completion'), done: false },
              ].map((m, i) => (
                <div key={i} className="flex items-center gap-3">
                  {m.done ? <CheckCircle2 size={18} className="text-blue-500" /> : m.current ? <AlertCircle size={18} className="text-amber-500" /> : <Circle size={18} className="text-gray-300 dark:text-gray-700" />}
                  <span className={`text-sm font-medium ${m.done ? (isDark ? 'text-white' : 'text-gray-900') : (isDark ? 'text-gray-500' : 'text-gray-400')}`}>{m.label}</span>
                  {m.current && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">{t('Current')}</span>}
                </div>
              ))}
            </div>
          </div>
          <div className={`rounded-xl border-2 border-dashed p-10 text-center ${isDark ? 'border-gray-800 bg-gray-900/30' : 'border-gray-200 bg-gray-50'}`}>
            <Clock size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-1">{t('More details coming soon')}</h3>
            <p className="text-xs text-gray-400 dark:text-gray-600 max-w-md mx-auto">
              {t('Financial projections, design renders, and detailed timelines will be added as the project progresses.')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const projects = [
    {
      id: 'campus',
      title: t('Training Facility'),
      subtitle: 'Campus',
      description: t('A state-of-the-art training facility designed to elevate player development, sports science, and team operations.'),
      image: CAMPUS_HERO,
      icon: Dumbbell,
      color: 'emerald',
      gradient: 'from-emerald-600 to-teal-600',
      status: t('Planning Phase'),
      statusColor: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    },
    {
      id: 'arena',
      title: t('Arena Remodelation'),
      subtitle: 'Palazzetto dello Sport',
      description: t('Comprehensive renovation of the arena to enhance the fan experience, modernize facilities, and increase revenue potential.'),
      image: ARENA_IMAGE,
      icon: Building2,
      color: 'blue',
      gradient: 'from-blue-600 to-indigo-600',
      status: t('Concept Phase'),
      statusColor: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
    },
  ];

  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-gray-950' : 'bg-gray-50'} flex items-center justify-center`}>
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <button onClick={toggleLanguage} className="px-3 py-2 rounded-lg text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-sm">
          {language === 'en' ? 'IT' : 'EN'}
        </button>
        <button onClick={toggleTheme} className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-sm">
          {isDark ? '☀' : '☾'}
        </button>
        <button onClick={onBackToWelcome} className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-sm" title="Home">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </button>
      </div>

      <div className="w-full max-w-4xl mx-auto px-4 py-16">
        <div className={`text-center mb-12 transition-all duration-700 ease-out ${phase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <button onClick={onBackToWelcome} className="hover:opacity-70 transition-opacity mb-5 inline-block">
            <img src={PV_LOGO_URL} alt="Pallacanestro Varese" className="w-16 h-16 object-contain mx-auto" />
          </button>
          <h1 className={`text-3xl sm:text-4xl font-bold mb-2 tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('Our Projects')}
          </h1>
          <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {t('Building the future of Pallacanestro Varese')}
          </p>
        </div>

        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 transition-all duration-1000 ease-out ${phase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {projects.map(project => {
            const Icon = project.icon;
            return (
              <button
                key={project.id}
                onClick={() => setSelectedProject(project.id)}
                className={`group relative text-left rounded-2xl border overflow-hidden transition-all duration-500 hover:shadow-2xl cursor-pointer ${
                  isDark ? 'bg-gray-900/50 border-gray-800 hover:border-gray-700' : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="relative h-40 overflow-hidden">
                  <img src={project.image} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className={`absolute inset-0 bg-gradient-to-t ${project.color === 'emerald' ? 'from-emerald-950/80' : 'from-blue-950/80'} via-transparent to-transparent`} />
                  <div className="absolute bottom-3 left-4">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${project.statusColor}`}>{project.status}</span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${project.color === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                      <Icon size={20} className={project.color === 'emerald' ? 'text-emerald-600' : 'text-blue-600'} />
                    </div>
                    <div>
                      <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{project.title}</h2>
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{project.subtitle}</p>
                    </div>
                  </div>
                  <p className={`text-xs leading-relaxed mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{project.description}</p>
                  <div className={`flex items-center gap-2 text-xs font-medium tracking-wider uppercase group-hover:gap-3 transition-all ${project.color === 'emerald' ? 'text-emerald-600' : 'text-blue-600'}`}>
                    {t('Explore')}
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
                <div className={`absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r ${project.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              </button>
            );
          })}
        </div>

        <div className={`mt-10 text-center transition-all duration-1000 ease-out delay-300 ${phase >= 3 ? 'opacity-100' : 'opacity-0'}`}>
          <p className={`text-[10px] tracking-[0.25em] uppercase ${isDark ? 'text-gray-700' : 'text-gray-300'}`}>
            {t('Season')} 2025/26 · pallva.it
          </p>
        </div>
      </div>
    </div>
  );
};
