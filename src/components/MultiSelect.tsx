import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface MultiSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  // placeholder?: string; // Removed unused prop
}

export const MultiSelect: React.FC<MultiSelectProps> = ({ 
  label, 
  options, 
  selected, 
  onChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    let newSelected: string[];
    
    if (option === 'All') {
      // If clicking All (if it exists in options), set to All
      newSelected = ['All'];
    } else {
      // If clicking a specific option
      if (selected.includes('All')) {
        // If All was previously selected, remove All and add the new option
        newSelected = [option];
      } else {
        if (selected.includes(option)) {
          newSelected = selected.filter(item => item !== option);
        } else {
          newSelected = [...selected, option];
        }
      }
    }
    onChange(newSelected);
  };

  const displayText = selected.includes('All') 
    ? 'All' 
    : selected.length === 0 
      ? 'None' 
      : selected.join(', ');

  return (
    <div className="relative" ref={containerRef}>
      <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">{label}</label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-gray-300 hover:border-red-500 text-gray-900 text-sm rounded-lg p-2.5 flex items-center justify-between min-w-[140px] transition-colors"
      >
        <span className="truncate pr-2 block max-w-[120px] text-left">
          {displayText}
        </span>
        <ChevronDown size={16} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full min-w-[200px] mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {/* Select All / None Controls */}
          <div className="sticky top-0 bg-white p-2 border-b border-gray-100 flex gap-2 z-10">
            <button
              onClick={() => onChange(['All'])}
              className="flex-1 text-xs font-bold text-center py-1 bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors"
            >
              Select All
            </button>
            <button
              onClick={() => onChange([])}
              className="flex-1 text-xs font-bold text-center py-1 bg-gray-50 text-gray-600 rounded hover:bg-gray-100 transition-colors"
            >
              None
            </button>
          </div>
          
          <div className="p-1">
            {options.map((option) => {
              const isSelected = selected.includes(option);
              return (
                <div
                  key={option}
                  onClick={() => toggleOption(option)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer transition-colors ${
                    isSelected ? 'bg-red-50 text-red-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                    isSelected ? 'bg-red-600 border-red-600' : 'border-gray-300'
                  }`}>
                    {isSelected && <Check size={12} className="text-white" />}
                  </div>
                  <span className="truncate">{option}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};