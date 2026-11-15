import React from 'react';
import { ArrowRight, Cpu, GitBranch, Layers, ShieldAlert } from 'lucide-react';
import { AppSection } from '../components/Navbar';
import { HazardModeKey } from './HazardLabPage';

interface HomePageProps {
  onNavigate: (section: AppSection) => void;
  onOpenHazardMode: (mode: HazardModeKey) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onOpenHazardMode }) => {
  return (
    <div className="space-y-14 pb-14">
      {/* Hero Section */}
      <section className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] lab-grid-bg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div className="font-mono text-xs font-semibold uppercase tracking-wider text-[#2563EB] dark:text-[#22D3EE]">
              Computer Organization and Architecture · Unit 4 · Course Code 21CSS201T
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-[#14213D] dark:text-white leading-[1.08]">
              PIPELINE HAZARD SIMULATOR
            </h1>
            <p className="text-lg font-medium text-[#2563EB] dark:text-[#22D3EE]">
              Visualizing Instruction Execution, Pipeline Conflicts and Stalls
            </p>
            <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
              Explore how a simplified five-stage processor pipeline overlaps instruction execution cycle by cycle, why Structural, Data (RAW), and Control hazards introduce stalls or flushes, and how hardware mitigations restore CPI throughput.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onNavigate('playground')}
                className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Start Simulation
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('hazards')}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-5 py-3 text-sm font-semibold text-[#14213D] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Open Hazard Laboratory
              </button>
            </div>
          </div>

          {/* Live Schematic Overview */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-[#14213D] p-5">
              <div className="flex items-center justify-between text-[11px] font-mono text-[#22D3EE] mb-3">
                <span>SIMPLIFIED 5-STAGE PIPELINE MODEL</span>
                <span>IF · ID · EX · MEM · WB</span>
              </div>
              <svg viewBox="0 0 460 220" className="w-full h-auto select-none" role="img" aria-label="Five stage instruction pipeline stages and hazard overview">
                {[
                  { label: 'IF', sub: 'Fetch', x: 14, color: '#2563EB' },
                  { label: 'ID', sub: 'Decode', x: 102, color: '#0891B2' },
                  { label: 'EX', sub: 'Execute', x: 190, color: '#4F46E5' },
                  { label: 'MEM', sub: 'Memory', x: 278, color: '#7C3AED' },
                  { label: 'WB', sub: 'Write', x: 366, color: '#16A34A' },
                ].map((s, idx) => (
                  <g key={s.label}>
                    <rect x={s.x} y={32} width={76} height={64} rx={8} fill="#0F172A" stroke={s.color} strokeWidth={2} />
                    <text x={s.x + 38} y={60} textAnchor="middle" fill="#FFFFFF" className="text-[13px] font-mono font-bold">
                      {s.label}
                    </text>
                    <text x={s.x + 38} y={78} textAnchor="middle" fill="#94A3B8" className="text-[10px] font-mono">
                      {s.sub}
                    </text>
                    {idx < 4 && (
                      <line x1={s.x + 76} y1={64} x2={s.x + 88} y2={64} stroke="#22D3EE" strokeWidth={2} className="animate-signal-flow" />
                    )}
                  </g>
                ))}

                {/* Forwarding bypass curve */}
                <path d="M 316 32 C 316 8, 228 8, 228 32" fill="none" stroke="#22D3EE" strokeWidth={1.8} className="animate-signal-flow" />
                <text x={272} y={18} textAnchor="middle" fill="#22D3EE" className="text-[9px] font-mono">
                  FORWARDING PATH
                </text>

                {/* Hazard summary blocks */}
                <rect x={14} y={128} width={136} height={68} rx={8} fill="#1E293B" stroke="#EF4444" strokeWidth={1.5} />
                <text x={82} y={152} textAnchor="middle" fill="#FCA5A5" className="text-[10.5px] font-mono font-bold">
                  1. STRUCTURAL
                </text>
                <text x={82} y={170} textAnchor="middle" fill="#CBD5E1" className="text-[9.5px] font-mono">
                  Shared Memory Conflict
                </text>

                <rect x={162} y={128} width={136} height={68} rx={8} fill="#1E293B" stroke="#F59E0B" strokeWidth={1.5} />
                <text x={230} y={152} textAnchor="middle" fill="#FCD34D" className="text-[10.5px] font-mono font-bold">
                  2. DATA (RAW)
                </text>
                <text x={230} y={170} textAnchor="middle" fill="#CBD5E1" className="text-[9.5px] font-mono">
                  Stall vs Forwarding
                </text>

                <rect x={310} y={128} width={136} height={68} rx={8} fill="#1E293B" stroke="#22D3EE" strokeWidth={1.5} />
                <text x={378} y={152} textAnchor="middle" fill="#67E8F9" className="text-[10.5px] font-mono font-bold">
                  3. CONTROL
                </text>
                <text x={378} y={170} textAnchor="middle" fill="#CBD5E1" className="text-[9.5px] font-mono">
                  Branch Flush &amp; PC Jump
                </text>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Core Concepts: What is Pipelining & What are Hazards */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-3">
          <div className="flex items-center gap-2 text-[#2563EB] dark:text-[#22D3EE]">
            <Layers className="h-5 w-5" />
            <h2 className="font-display text-xl font-bold text-[#14213D] dark:text-white">
              What is Instruction Pipelining?
            </h2>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Instruction pipelining overlaps the execution of sequential instructions across independent hardware stages—<strong>IF</strong>, <strong>ID</strong>, <strong>EX</strong>, <strong>MEM</strong>, and <strong>WB</strong>—like an assembly line. Instead of waiting 5 cycles for one instruction to finish before starting the next, a new instruction enters the pipeline every clock cycle, targeting an ideal throughput of 1 instruction completed per cycle.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-3">
          <div className="flex items-center gap-2 text-[#EF4444]">
            <ShieldAlert className="h-5 w-5" />
            <h2 className="font-display text-xl font-bold text-[#14213D] dark:text-white">
              What are Pipeline Hazards?
            </h2>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            A pipeline hazard is any condition that prevents the next instruction in the instruction stream from executing during its designated clock cycle. Hazards force the control unit to insert <strong>stall cycles (bubbles)</strong> or <strong>flush wrong-path instructions</strong>, increasing total clock cycles and raising the effective <strong>CPI</strong>.
          </p>
        </div>
      </section>

      {/* Three Hazard Mode Launch Cards */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-5">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#14213D] dark:text-white">
            Three Interactive Hazard Laboratories
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Jump directly into any hazard mode to demonstrate conflicts, stalls, mitigations, and expected outputs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              key: 'structural' as HazardModeKey,
              title: '1. Structural Hazard',
              icon: <Cpu className="h-5 w-5 text-[#EF4444]" />,
              desc: 'Compares Shared Instruction/Data Memory (IF vs MEM collision at Cycle 4) against Separate Instruction and Data Memories.',
            },
            {
              key: 'data' as HazardModeKey,
              title: '2. Data Hazard (RAW)',
              icon: <Layers className="h-5 w-5 text-amber-500" />,
              desc: 'Demonstrates ADD R1, R2, R3 followed by SUB R4, R1, R5 without forwarding vs with EX→EX forwarding and Load-Use limits.',
            },
            {
              key: 'control' as HazardModeKey,
              title: '3. Control Hazard',
              icon: <GitBranch className="h-5 w-5 text-[#2563EB] dark:text-[#22D3EE]" />,
              desc: 'Simulates BEQ R1, R2, TARGET under Branch Taken (wrong-path flush + PC jump) vs Branch Not Taken.',
            },
          ].map((card) => (
            <button
              key={card.key}
              type="button"
              onClick={() => onOpenHazardMode(card.key)}
              className="text-left rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 hover:border-[#2563EB] dark:hover:border-[#22D3EE] transition-colors flex flex-col justify-between gap-4 cursor-pointer"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-display text-lg font-bold text-[#14213D] dark:text-white">
                    {card.title}
                  </span>
                  {card.icon}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {card.desc}
                </p>
              </div>
              <div className="text-xs font-semibold text-[#2563EB] dark:text-[#22D3EE]">
                Launch {card.title.split('. ')[1]} Lab →
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
