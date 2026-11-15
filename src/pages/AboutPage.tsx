import React from 'react';
import { AppSection } from '../components/Navbar';

interface AboutPageProps {
  onNavigate: (section: AppSection) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-7 space-y-4">
        <div className="font-mono text-xs font-semibold uppercase tracking-wider text-[#2563EB] dark:text-[#22D3EE]">
          Computer Organization and Architecture · Unit 4 · Course Code 21CSS201T
        </div>
        <h1 className="font-display text-3xl font-extrabold text-[#14213D] dark:text-white">
          PIPELINE HAZARD SIMULATOR
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          An interactive educational processor simulation tool designed to demonstrate 5-stage instruction pipelining and the three classic pipeline hazards—<strong>Structural</strong>, <strong>Data (RAW)</strong>, and <strong>Control (Instruction)</strong> hazards—with clock-by-clock execution, stalls, bubbles, timing diagrams, and exact CPI metrics.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 font-mono text-xs">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-4">
            <div className="text-slate-500 dark:text-slate-400">Subject</div>
            <div className="mt-1 font-bold text-[#14213D] dark:text-white">
              Computer Organization &amp; Architecture
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-4">
            <div className="text-slate-500 dark:text-slate-400">Course Code &amp; Unit</div>
            <div className="mt-1 font-bold text-[#2563EB] dark:text-[#22D3EE]">
              21CSS201T · Unit 4
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-4">
            <div className="text-slate-500 dark:text-slate-400">Architecture</div>
            <div className="mt-1 font-bold text-[#14213D] dark:text-white">
              Frontend-Only Simulation Engine
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-7 space-y-3">
        <h2 className="font-display text-lg font-bold text-[#14213D] dark:text-white">
          Simplified 5-Stage Model Assumptions
        </h2>
        <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
          <li>
            <strong>Five Uniform Stages:</strong> Every instruction passes sequentially through IF, ID, EX, MEM, and WB (1 clock cycle per stage).
          </li>
          <li>
            <strong>Structural Hazard Assumption:</strong> In Shared Memory mode, a single memory port serves both Instruction Fetch (IF) and Data Memory (MEM for LOAD/STORE), stalling IF by 1 cycle when both coincide. Separate I and D memories remove this conflict.
          </li>
          <li>
            <strong>Data Hazard Assumption:</strong> Register file writes occur in the first half of WB and reads occur in the second half of ID. Without forwarding, RAW dependencies stall in ID until the producer finishes WB; with forwarding, EX→EX and MEM→EX paths eliminate ALU-to-ALU stalls, while Load-Use still requires 1 stall cycle.
          </li>
          <li>
            <strong>Control Hazard Assumption:</strong> Conditional branches (BEQ) resolve in EX by default (flushing 2 wrong-path instructions when Taken), with an optional early ID-stage resolution comparison (1 flush).
          </li>
          <li>
            <strong>CPI Formula:</strong> <code className="font-mono">CPI = Total Clock Cycles / Number of Completed Instructions</code>, including startup fill and WB drain cycles.
          </li>
        </ul>

        <div className="pt-3 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onNavigate('playground')}
            className="rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer"
          >
            Open Pipeline Playground
          </button>
          <button
            type="button"
            onClick={() => onNavigate('hazards')}
            className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-[#14213D] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Open Hazard Laboratory
          </button>
        </div>
      </div>
    </div>
  );
};
