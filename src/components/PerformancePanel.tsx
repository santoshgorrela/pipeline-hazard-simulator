import React from 'react';
import { PipelineSimulationResult, ScenarioComparison } from '../engine/pipelineEngine';

interface PerformancePanelProps {
  comparison: ScenarioComparison;
  activeResult?: PipelineSimulationResult;
  modeLabel: string;
  hazardLabel: string;
  handlingLabel: string;
}

export const PerformancePanel: React.FC<PerformancePanelProps> = ({
  comparison,
  activeResult,
  modeLabel,
  hazardLabel,
  handlingLabel,
}) => {
  const rows = [
    { key: 'ideal', label: '1. Ideal Pipeline (No Hazards)', result: comparison.ideal, accent: 'bg-slate-600' },
    { key: 'hazards', label: `2. ${hazardLabel}`, result: comparison.withHazards, accent: 'bg-[#EF4444]' },
    { key: 'handling', label: `3. ${handlingLabel}`, result: comparison.withHandling, accent: 'bg-[#2563EB]' },
  ];

  const maxCycles = Math.max(...rows.map((r) => r.result.metrics.totalCycles), 1);
  const maxCpi = Math.max(...rows.map((r) => r.result.metrics.cpi), 1);
  const summarySource = activeResult ?? comparison.withHazards;

  return (
    <div className="space-y-6">
      {/* Live Formula & KPI Readout */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Instructions', value: summarySource.metrics.totalInstructions },
          { label: 'Completed', value: summarySource.metrics.completedInstructions },
          { label: 'Total Cycles', value: summarySource.metrics.totalCycles },
          { label: 'Stall Cycles', value: summarySource.metrics.stallCycles },
          { label: 'Flushed', value: summarySource.metrics.flushedInstructions },
          { label: 'Measured CPI', value: summarySource.metrics.cpi.toFixed(2) },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4"
          >
            <div className="text-xs text-slate-500 dark:text-slate-400">{item.label}</div>
            <div className="mt-1 font-mono text-2xl font-bold text-[#14213D] dark:text-white tabular-nums">
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* Exact Formula & Counting Assumptions */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-base font-bold text-[#14213D] dark:text-white">
            CPI Calculation &amp; Counting Assumptions ({modeLabel})
          </h3>
          <div className="font-mono text-xs font-semibold text-[#2563EB] dark:text-[#22D3EE]">
            CPI = Total Clock Cycles / Number of Completed Instructions
          </div>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          All cycle counts include full pipeline startup fill (4 cycles before first WB) and drain through final WB completion. For a 5-stage pipeline executing <em>N</em> ideal instructions, Total Cycles = 5 + (<em>N</em> − 1). When stalls or branch flushes occur, every simulated stall bubble or flushed instruction increases total clock cycles or reduces completed instructions.
        </p>
      </div>

      {/* Comparison Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 overflow-x-auto">
        <h3 className="font-display text-base font-bold text-[#14213D] dark:text-white">
          Simulated Execution Comparison
        </h3>
        <table className="w-full text-left text-xs font-mono tabular-nums border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
              <th className="py-2 pr-4 font-sans font-semibold">Execution Configuration</th>
              <th className="py-2 px-3">Total Inst</th>
              <th className="py-2 px-3">Completed</th>
              <th className="py-2 px-3">Total Cycles</th>
              <th className="py-2 px-3">Stalls</th>
              <th className="py-2 px-3">Flushed</th>
              <th className="py-2 px-3">CPI</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-b border-slate-100 dark:border-slate-800 last:border-b-0">
                <td className="py-2.5 pr-4 font-sans font-semibold text-[#172033] dark:text-white">
                  {r.label}
                </td>
                <td className="py-2.5 px-3">{r.result.metrics.totalInstructions}</td>
                <td className="py-2.5 px-3">{r.result.metrics.completedInstructions}</td>
                <td className="py-2.5 px-3 font-bold text-[#14213D] dark:text-white">
                  {r.result.metrics.totalCycles}
                </td>
                <td className="py-2.5 px-3 text-amber-600 dark:text-amber-400">
                  {r.result.metrics.stallCycles}
                </td>
                <td className="py-2.5 px-3 text-rose-600 dark:text-rose-400">
                  {r.result.metrics.flushedInstructions}
                </td>
                <td className="py-2.5 px-3 font-bold text-[#2563EB] dark:text-[#22D3EE]">
                  {r.result.metrics.cpi.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Visual Bar Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
          <h4 className="font-display text-sm font-bold text-[#14213D] dark:text-white">
            Total Clock Cycles Comparison
          </h4>
          <div className="space-y-3">
            {rows.map((r) => {
              const pct = Math.round((r.result.metrics.totalCycles / maxCycles) * 100);
              return (
                <div key={r.key} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{r.label}</span>
                    <span className="font-mono font-bold text-[#14213D] dark:text-white tabular-nums">
                      {r.result.metrics.totalCycles} cycles
                    </span>
                  </div>
                  <div className="h-3 w-full rounded bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded transition-all duration-300 ${r.accent}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
          <h4 className="font-display text-sm font-bold text-[#14213D] dark:text-white">
            CPI (Cycles Per Instruction) Comparison
          </h4>
          <div className="space-y-3">
            {rows.map((r) => {
              const pct = Math.round((r.result.metrics.cpi / maxCpi) * 100);
              return (
                <div key={r.key} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{r.label}</span>
                    <span className="font-mono font-bold text-[#2563EB] dark:text-[#22D3EE] tabular-nums">
                      CPI {r.result.metrics.cpi.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-3 w-full rounded bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded transition-all duration-300 ${r.accent}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
