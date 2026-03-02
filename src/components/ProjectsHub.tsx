import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Building2, Dumbbell, MapPin, Calendar, Target, DollarSign, Clock, Users, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { PV_LOGO_URL } from '../constants';

interface ProjectsHubProps {
  onBackToWelcome: () => void;
}

const CAMPUS_IMAGE = 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80';
const ARENA_IMAGE = 'https://images.unsplash.com/photo-1505666287802-931dc83948e5?w=800&q=80';

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

  const projects = [
    {
      id: 'campus',
      title: t('Training Facility'),
      subtitle: 'Campus',
      description: t('A state-of-the-art training facility designed to elevate player development, sports science, and team operations.'),
      image: CAMPUS_IMAGE,
      icon: Dumbbell,
      color: 'emerald',
      gradient: 'from-emerald-600 to-teal-600',
      status: t('Planning Phase'),
      statusColor: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
      milestones: [
        { label: t('Feasibility Study'), done: true },
        { label: t('Site Selection'), done: true },
        { label: t('Architectural Design'), done: false },
        { label: t('Permits & Approvals'), done: false },
        { label: t('Construction'), done: false },
        { label: t('Inauguration'), done: false },
      ],
      details: [
        { icon: MapPin, label: t('Location'), value: t('TBD — Varese Area') },
        { icon: Calendar, label: t('Timeline'), value: t('2026–2028') },
        { icon: Target, label: t('Scope'), value: t('Training Courts, Gym, Recovery, Offices') },
        { icon: Users, label: t('Capacity'), value: t('First Team + Youth Academy') },
      ],
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
      milestones: [
        { label: t('Concept & Vision'), done: true },
        { label: t('Stakeholder Alignment'), done: false },
        { label: t('Engineering Assessment'), done: false },
        { label: t('Funding & Partnerships'), done: false },
        { label: t('Phased Renovation'), done: false },
        { label: t('Completion'), done: false },
      ],
      details: [
        { icon: MapPin, label: t('Location'), value: 'Via Marzorati, Masnago' },
        { icon: Calendar, label: t('Timeline'), value: t('2026–2029') },
        { icon: Target, label: t('Scope'), value: t('Seating, Hospitality, Tech, Accessibility') },
        { icon: DollarSign, label: t('Focus'), value: t('Fan Experience & Revenue Growth') },
      ],
    },
  ];

  const selected = selectedProject ? projects.find(p => p.id === selectedProject) : null;

  if (selected) {
    const completedCount = selected.milestones.filter(m => m.done).length;
    const progressPct = Math.round((completedCount / selected.milestones.length) * 100);
    const Icon = selected.icon;

    return (
      <div className={`min-h-screen ${isDark ? 'dark bg-gray-950' : 'bg-gray-50'}`}>
        <div className="fixed top-0 left-0 w-full bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 z-50 px-4">
          <div className="flex items-center justify-between py-2.5 max-w-5xl mx-auto">
            <button onClick={() => setSelectedProject(null)} className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
              <ArrowLeft size={16} />
              {t('Projects')}
            </button>
            <div className="flex items-center gap-2">
              <Icon size={18} className={selected.color === 'emerald' ? 'text-emerald-600' : 'text-blue-600'} />
              <span className="text-sm font-bold text-gray-900 dark:text-white">{selected.title}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={toggleLanguage} className="px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">{language === 'en' ? 'IT' : 'EN'}</button>
              <button onClick={toggleTheme} className="p-1.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                {isDark ? <span className="text-xs">☀</span> : <span className="text-xs">☾</span>}
              </button>
            </div>
          </div>
        </div>

        <div className="pt-16 pb-12 max-w-5xl mx-auto px-4">
          <div className="relative rounded-2xl overflow-hidden mb-8 h-48 sm:h-64">
            <img src={selected.image} alt={selected.title} className="w-full h-full object-cover" />
            <div className={`absolute inset-0 bg-gradient-to-t ${selected.color === 'emerald' ? 'from-emerald-950/90 via-emerald-950/40' : 'from-blue-950/90 via-blue-950/40'} to-transparent`} />
            <div className="absolute bottom-0 left-0 p-6 sm:p-8">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-3 ${selected.statusColor}`}>{selected.status}</span>
              <h1 className="text-2xl sm:text-4xl font-bold text-white mb-1">{selected.title}</h1>
              <p className="text-sm text-white/70">{selected.subtitle}</p>
            </div>
          </div>

          <p className={`text-sm leading-relaxed mb-8 max-w-3xl ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{selected.description}</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {selected.details.map(d => {
              const DIcon = d.icon;
              return (
                <div key={d.label} className={`rounded-xl border p-4 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                  <DIcon size={16} className={`mb-2 ${selected.color === 'emerald' ? 'text-emerald-500' : 'text-blue-500'}`} />
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{d.label}</p>
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">{d.value}</p>
                </div>
              );
            })}
          </div>

          <div className={`rounded-xl border p-6 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">{t('Project Milestones')}</h3>
              <span className={`text-xs font-bold ${selected.color === 'emerald' ? 'text-emerald-600' : 'text-blue-600'}`}>{progressPct}% {t('complete')}</span>
            </div>
            <div className={`h-2 rounded-full mb-6 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <div
                className={`h-full rounded-full transition-all bg-gradient-to-r ${selected.gradient}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="space-y-3">
              {selected.milestones.map((m, i) => (
                <div key={i} className="flex items-center gap-3">
                  {m.done ? (
                    <CheckCircle2 size={18} className={selected.color === 'emerald' ? 'text-emerald-500' : 'text-blue-500'} />
                  ) : i === completedCount ? (
                    <AlertCircle size={18} className="text-amber-500" />
                  ) : (
                    <Circle size={18} className="text-gray-300 dark:text-gray-700" />
                  )}
                  <span className={`text-sm font-medium ${m.done ? (isDark ? 'text-white' : 'text-gray-900') : (isDark ? 'text-gray-500' : 'text-gray-400')}`}>{m.label}</span>
                  {i === completedCount && (
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">{t('Current')}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className={`mt-6 rounded-xl border-2 border-dashed p-10 text-center ${isDark ? 'border-gray-800 bg-gray-900/30' : 'border-gray-200 bg-gray-50'}`}>
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

  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-gray-950' : 'bg-gray-50'} flex items-center justify-center`}>
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <button onClick={toggleLanguage} className="px-3 py-2 rounded-lg text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-sm">
          {language === 'en' ? '🇮🇹 IT' : '🇬🇧 EN'}
        </button>
        <button onClick={toggleTheme} className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-sm">
          {isDark ? <span>☀️</span> : <span>🌙</span>}
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
                  isDark
                    ? 'bg-gray-900/50 border-gray-800 hover:border-gray-700'
                    : 'bg-white border-gray-200 hover:border-gray-300'
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
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      project.color === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-blue-100 dark:bg-blue-900/30'
                    }`}>
                      <Icon size={20} className={project.color === 'emerald' ? 'text-emerald-600' : 'text-blue-600'} />
                    </div>
                    <div>
                      <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{project.title}</h2>
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{project.subtitle}</p>
                    </div>
                  </div>
                  <p className={`text-xs leading-relaxed mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{project.description}</p>
                  <div className={`flex items-center gap-2 text-xs font-medium tracking-wider uppercase group-hover:gap-3 transition-all ${
                    project.color === 'emerald' ? 'text-emerald-600' : 'text-blue-600'
                  }`}>
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
