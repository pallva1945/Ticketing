import React, { useEffect, useState } from 'react';
import { LucideIcon } from 'lucide-react';

export interface TickerItem {
  label: string;
  value: string;
  icon: LucideIcon;
  color: string;
}

interface MobileTickerProps {
  items: TickerItem[];
}

export const MobileTicker: React.FC<MobileTickerProps> = ({ items }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % items.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [items.length]);

  if (items.length === 0) return null;

  const currentItem = items[activeIndex];

  return (
    <div className="md:hidden flex-1 ml-3 bg-slate-900 text-white rounded-xl px-3 h-10 flex items-center justify-between overflow-hidden shadow-inner border border-slate-700 min-w-0">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className={`p-1.5 rounded-full bg-white/10 ${currentItem.color} flex-shrink-0`}>
          <currentItem.icon size={14} />
        </div>
        <div className="flex flex-col justify-center min-w-0">
          <span className="text-[8px] font-bold text-slate-400 tracking-widest leading-none mb-0.5 truncate uppercase">
            {currentItem.label}
          </span>
          <span className="text-sm font-bold leading-none animate-in fade-in slide-in-from-bottom-1 duration-300 key={activeIndex} truncate">
            {currentItem.value}
          </span>
        </div>
      </div>
      
      {/* Paginator dots */}
      <div className="flex gap-1 pl-2 flex-shrink-0">
        {items.map((_, idx) => (
          <div 
            key={idx} 
            className={`w-1 h-1 rounded-full transition-all duration-300 ${idx === activeIndex ? 'bg-white scale-125' : 'bg-slate-700'}`}
          />
        ))}
      </div>
    </div>
  );
};