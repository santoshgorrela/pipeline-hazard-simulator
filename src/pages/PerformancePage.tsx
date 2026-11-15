import React, { useMemo, useState } from 'react';
import {
  PRESET_PROGRAMS,
  ProgramPreset,
  comparePipelineScenarios,
  parseProgram,
} from '../engine/pipelineEngine';
import { PerformancePanel } from '../components/PerformancePanel';

export const PerformancePage: React.FC = () => {
  const [selected, setSelected] = useState<ProgramPreset['id']>('data');

  const preset = PRESET_PROGRAMS[selected];
  const program = useMemo(() => parseProgram(preset.source), [preset.source]);

  const modeForComparison = useMemo<'structural' | 'data' | 'control' | 'all'>(() => {
    if (selected === 'structural') return 'structural';
    if (selected === 'data' || selected === 'dataLoadUse') return 'data';
    if (selected === 'control') return 'control';
    return 'all';
  }, [selected]);

  const comparison = useMemo(
    () => comparePipelineScenarios(program, modeForComparison),
    [program, modeForComparison],
  );

  const labels = useMemo(() => {
    if (modeForComparison === 'structural') {
      return {
        hazard: 'Shared I+D Memory (Structural Hazard)',
        handling: 'Separate I & D Memories (Mitigated)',
      };
    }
    if (modeForComparison === 'data') {
      return {
        hazard: 'Without Forwarding (Stalls)',
        handling: 'With EX→EX / MEM→EX Forwarding',
      };
    }
    if (modeForComparison === 'control') {
      return {
        hazard: 'Branch Taken (Resolve in EX · 2 Flushes)',
        handling: 'Branch Taken (Early Resolve in ID · 1 Flush)',
      };
    }
    return {
      hazard: 'All Hazards Active (Shared Mem + No Fwd)',
      handling: 'Mitigated (Separate Mem + Forwarding + Early Branch)',
    };
  }, [modeForComparison]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#14213D] dark:text-white">
            Performance Analysis
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Compare simulated Ideal execution, Hazard penalties, and Hazard Handling across real instruction traces.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1">
          {Object.values(PRESET_PROGRAMS).map((p) => {
            const active = selected === p.id;
            const shortName =
              p.id === 'playground'
                ? 'Playground (5)'
                : p.id === 'structural'
                  ? 'Structural'
                  : p.id === 'data'
                    ? 'Data (RAW)'
                    : p.id === 'dataLoadUse'
                      ? 'Load-Use'
                      : 'Control (BEQ)';
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelected(p.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[#2563EB] text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {shortName}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div>
          <strong className="text-[#14213D] dark:text-white">{preset.name}:</strong>{' '}
          <span className="text-slate-600 dark:text-slate-300">{preset.summary}</span>
        </div>
        <div className="font-mono text-slate-500 dark:text-slate-400">
          {program.map((i) => i.id).join(' · ')}
        </div>
      </div>

      <PerformancePanel
        comparison={comparison}
        activeResult={comparison.withHazards}
        modeLabel={preset.name}
        hazardLabel={labels.hazard}
        handlingLabel={labels.handling}
      />
    </div>
  );
};
