import React, { useEffect, useState } from 'react';
import { AppSection, Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { PlaygroundPage } from './pages/PlaygroundPage';
import { HazardLabPage, HazardModeKey } from './pages/HazardLabPage';
import { PerformancePage } from './pages/PerformancePage';
import { AboutPage } from './pages/AboutPage';

export default function App() {
  const [section, setSection] = useState<AppSection>('home');
  const [hazardMode, setHazardMode] = useState<HazardModeKey>('structural');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const handleNavigate = (next: AppSection) => {
    setSection(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenHazardMode = (mode: HazardModeKey) => {
    setHazardMode(mode);
    setSection('hazards');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7FB] dark:bg-[#0B1220] text-[#172033] dark:text-[#F1F5F9]">
      <Navbar
        activeSection={section}
        onNavigate={handleNavigate}
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
      />

      <main className="flex-1">
        {section === 'home' && (
          <HomePage onNavigate={handleNavigate} onOpenHazardMode={handleOpenHazardMode} />
        )}
        {section === 'playground' && <PlaygroundPage />}
        {section === 'hazards' && <HazardLabPage key={hazardMode} initialMode={hazardMode} />}
        {section === 'performance' && <PerformancePage />}
        {section === 'about' && <AboutPage onNavigate={handleNavigate} />}
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] py-5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="font-mono">
            PIPELINE HAZARD SIMULATOR · COA Unit 4 · Course Code 21CSS201T
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => handleNavigate('playground')}
              className="hover:text-[#2563EB] dark:hover:text-[#22D3EE] cursor-pointer"
            >
              Playground
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('hazards')}
              className="hover:text-[#2563EB] dark:hover:text-[#22D3EE] cursor-pointer"
            >
              Hazard Lab
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('performance')}
              className="hover:text-[#2563EB] dark:hover:text-[#22D3EE] cursor-pointer"
            >
              Performance
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
