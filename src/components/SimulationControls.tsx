import React from 'react';
import { Pause, Play, RotateCcw, SkipForward } from 'lucide-react';
import { PRESET_PROGRAMS, ProgramPreset } from '../engine/pipelineEngine';

interface SimulationControlsProps {
  isPlaying: boolean;
  currentCycle: number;
  totalCycles: number;
  speedMs: number;
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
  onReset: () => void;
  onSpeedChange: (ms: number) => void;
  selectedPreset?: ProgramPreset['id'];
  onLoadPreset?: (presetId: ProgramPreset['id']) => void;
}

const SPEED_OPTIONS = [
  { label: '0.5x', ms: 1600 },
  { label: '1x', ms: 1000 },
  { label: '1.5x', ms: 650 },
  { label: '2x', ms: 380 },
];

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  isPlaying,
  currentCycle,
  totalCycles,
  speedMs,
  onPlay,
  onPause,
  onStep,
  onReset,
  onSpeedChange,
  selectedPreset,
  onLoadPreset,
}) => {
  const atEnd = currentCycle >= totalCycles;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5">
      <div className="flex flex-wrap items-center gap-2">
        {isPlaying ? (
          <button
            type="button"
            onClick={onPause}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#14213D] dark:bg-slate-700 px-3.5 py-2 text-xs font-semibold text-white hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Pause className="h-3.5 w-3.5" />
            Pause
          </button>
        ) : (
          <button
            type="button"
            onClick={onPlay}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Play className="h-3.5 w-3.5" />
            {atEnd ? 'Replay' : 'Play'}
          </button>
        )}

        <button
          type="button"
          onClick={onStep}
          disabled={atEnd || isPlaying}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-[#172033] dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-45 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <SkipForward className="h-3.5 w-3.5 text-[#2563EB] dark:text-[#22D3EE]" />
          Step (+1 Cycle)
        </button>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-[#172033] dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Speed Selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Speed:</span>
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-0.5">
            {SPEED_OPTIONS.map((opt) => {
              const active = speedMs === opt.ms;
              return (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => onSpeedChange(opt.ms)}
                  className={`rounded-md px-2.5 py-1 text-xs font-mono font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-[#2563EB] text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:text-[#14213D] dark:hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Load Example Dropdown */}
        {onLoadPreset && (
          <div className="flex items-center gap-1.5">
            <label
              htmlFor="preset-select"
              className="text-xs font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap"
            >
              Load Example:
            </label>
            <select
              id="preset-select"
              value={selectedPreset ?? 'playground'}
              onChange={(e) => onLoadPreset(e.target.value as ProgramPreset['id'])}
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-[#172033] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              {Object.values(PRESET_PROGRAMS).map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Clock Readout */}
        <div className="font-mono text-xs font-semibold text-[#14213D] dark:text-[#22D3EE] tabular-nums whitespace-nowrap">
          Cycle C{currentCycle} / C{totalCycles}
        </div>
      </div>
    </div>
  );
};
