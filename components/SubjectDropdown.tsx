
import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../i18n';

interface SubjectDropdownProps {
  subjects: string[];
  selectedSubject: string;
  onSelect: (subject: string) => void;
}

export const SubjectDropdown: React.FC<SubjectDropdownProps> = ({
  subjects,
  selectedSubject,
  onSelect
}) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayLabel = selectedSubject === 'all'
    ? t.all_subjects
    : selectedSubject;

  return (
    <div className="relative flex-1 min-w-[240px]" ref={dropdownRef}>
      <label className="sr-only">{t.filter_by_subject}</label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between pl-4 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium hover:border-indigo-300 focus-ring transition-all"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="text-slate-400 shrink-0">📚</span>
          <span className="truncate text-slate-700">
            {displayLabel}
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <ul
          className="absolute z-[60] mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl py-1 max-h-60 overflow-auto"
          role="listbox"
        >
          <li
            role="option"
            aria-selected={selectedSubject === 'all'}
            onClick={() => { onSelect('all'); setIsOpen(false); }}
            className={`px-4 py-2 text-sm cursor-pointer transition-colors flex items-center justify-between ${selectedSubject === 'all' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
              }`}
          >
            {t.all_subjects}
            {selectedSubject === 'all' && <span>✓</span>}
          </li>
          <div className="h-px bg-slate-100 my-1" />
          {subjects.map((subject) => (
            <li
              key={subject}
              role="option"
              aria-selected={selectedSubject === subject}
              onClick={() => { onSelect(subject); setIsOpen(false); }}
              className={`px-4 py-2 text-sm cursor-pointer transition-colors flex items-center justify-between ${selectedSubject === subject ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                }`}
            >
              <span className="truncate">{subject}</span>
              {selectedSubject === subject && <span>✓</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
