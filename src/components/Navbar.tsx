import React, { useState } from 'react';
import { Menu, Moon, Sun, X } from 'lucide-react';

export type AppSection = 'home' | 'playground' | 'hazards' | 'performance' | 'about';

interface NavbarProps {
  activeSection: AppSection;
  onNavigate: (section: AppSection) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

const NAV_ITEMS: { id: AppSection; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'playground', label: 'Playground' },
  { id: 'hazards', label: 'Hazard Lab' },
  { id: 'performance', label: 'Performance' },
  { id: 'about', label: 'About' },
];

export const Navbar: React.FC<NavbarProps> = ({
  activeSection,
  onNavigate,
  theme,
  onToggleTheme,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSelect = (id: AppSection) => {
    onNavigate(id);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => handleSelect('home')}
          className="font-display text-base sm:text-lg font-extrabold tracking-tight text-[#14213D] dark:text-white whitespace-nowrap shrink-0 cursor-pointer"
        >
          PIPELINE HAZARD SIMULATOR
        </button>

        {/* Zone 2: Clean Single-Line Nav Links */}
        <nav className="hidden md:flex items-center gap-6" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => {
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`whitespace-nowrap shrink-0 text-sm font-medium py-1 border-b-2 transition-colors cursor-pointer ${
                  active
                    ? 'border-[#2563EB] text-[#2563EB] dark:border-[#22D3EE] dark:text-[#22D3EE]'
                    : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-[#14213D] dark:hover:text-white'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Theme Toggle & Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-[#14213D]" />
            )}
          </button>

          <button
            type="button"
            onClick={() => handleSelect('playground')}
            className="hidden sm:inline-flex items-center rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Start Simulation
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className="inline-flex md:hidden h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] px-4 py-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`block w-full text-left rounded-lg px-3 py-2 text-sm font-medium cursor-pointer ${
                  active
                    ? 'bg-blue-50 dark:bg-slate-800 text-[#2563EB] dark:text-[#22D3EE]'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
