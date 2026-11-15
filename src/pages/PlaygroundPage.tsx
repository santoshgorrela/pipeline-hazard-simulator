import React, { useMemo, useState } from 'react';
import {
  PRESET_PROGRAMS,
  PipelineConfig,
  ProgramPreset,
  parseProgram,
  simulatePipeline,
} from '../engine/pipelineEngine';
import { usePipelinePlayback } from '../hooks/usePipelinePlayback';
import { SimulationControls } from '../components/SimulationControls';
import { PipelineStageDiagram } from '../components/PipelineStageDiagram';
import { PipelineTimingDiagram } from '../components/PipelineTimingDiagram';

export const PlaygroundPage: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<ProgramPreset['id']>('playground');
  const [programText, setProgramText] = useState<string>(PRESET_PROGRAMS.playground.source);
  const [config, setConfig] = useState<PipelineConfig>({
    hazardMode: 'all',
    sharedMemory: false,
    forwarding: true,
    branchOutcome: 'taken',
    branchResolutionStage: 'EX',
  });

  const program = useMemo(() => parseProgram(programText), [programText]);
  const simulation = useMemo(() => simulatePipeline(program, config), [program, config]);
  const playback = usePipelinePlayback(simulation.metrics.totalCycles);

  const activeSnapshot =
    simulation.cycles[Math.min(playback.currentCycle, simulation.cycles.length - 1)];

  const handleLoadPreset = (presetId: ProgramPreset['id']) => {
    const preset = PRESET_PROGRAMS[presetId];
    setSelectedPreset(presetId);
    setProgramText(preset.source);
    setConfig(preset.recommendedConfig);
    playback.reset();
  };

  const handleConfigChange = (patch: Partial<PipelineConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
    playback.reset();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#14213D] dark:text-white">
            Pipeline Playground
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Execute instructions clock by clock, edit instruction sequences, toggle hazard controls, and watch live timing updates.
          </p>
        </div>

        <div className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
          Total Cycles: <strong className="text-[#14213D] dark:text-white">{simulation.metrics.totalCycles}</strong> ·
          CPI: <strong className="text-[#2563EB] dark:text-[#22D3EE]">{simulation.metrics.cpi.toFixed(2)}</strong>
        </div>
      </div>

      {/* Main Controls */}
      <SimulationControls
        isPlaying={playback.isPlaying}
        currentCycle={playback.currentCycle}
        totalCycles={simulation.metrics.totalCycles}
        speedMs={playback.speedMs}
        onPlay={playback.play}
        onPause={playback.pause}
        onStep={playback.step}
        onReset={playback.reset}
        onSpeedChange={playback.setSpeedMs}
        selectedPreset={selectedPreset}
        onLoadPreset={handleLoadPreset}
      />

      {/* Primary Pipeline Stage Diagram */}
      <PipelineStageDiagram
        snapshot={activeSnapshot}
        sharedMemory={config.sharedMemory}
        forwarding={config.forwarding}
        highlightMode="all"
      />

      {/* Instruction Sequence, Hazard Config & Execution Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Instruction Queue & Status */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-[#14213D] dark:text-white">
              Instruction Sequence &amp; Queue State
            </h2>
            <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
              {program.length} instructions
            </span>
          </div>

          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-200/70 dark:divide-slate-800">
            {program.map((inst) => {
              const st = activeSnapshot.instructionStatus[inst.id] ?? {
                status: 'waiting',
                stage: null,
              };
              const badgeColor =
                st.status === 'completed'
                  ? 'text-[#16A34A]'
                  : st.status === 'flushed'
                    ? 'text-[#EF4444]'
                    : st.status === 'stalled'
                      ? 'text-amber-600 dark:text-amber-400'
                      : st.status === 'active'
                        ? 'text-[#2563EB] dark:text-[#22D3EE]'
                        : 'text-slate-400';

              return (
                <div
                  key={inst.id}
                  className="flex items-center justify-between gap-3 px-3 py-2 font-mono text-xs"
                >
                  <div className="truncate">
                    <span className="text-slate-400 mr-2">{inst.pc}</span>
                    <span className="font-bold text-[#14213D] dark:text-white mr-2">{inst.id}:</span>
                    <span className={st.status === 'flushed' ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}>
                      {inst.displayText}
                    </span>
                  </div>
                  <span className={`font-bold uppercase shrink-0 ${badgeColor}`}>
                    {st.status === 'active' && st.stage ? `IN ${st.stage}` : st.status}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
            <label
              htmlFor="custom-program-input"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Edit Assembly Sequence (ADD, SUB, MUL, LOAD, STORE, BEQ)
            </label>
            <textarea
              id="custom-program-input"
              rows={5}
              value={programText}
              onChange={(e) => {
                setProgramText(e.target.value);
                playback.reset();
              }}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 font-mono text-xs text-[#172033] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>
        </div>

        {/* Middle: Processor Hazard Configuration */}
        <div className="lg:col-span-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <h2 className="font-display text-base font-bold text-[#14213D] dark:text-white">
            Hazard Configuration
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <span className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Memory Port Architecture
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleConfigChange({ hazardMode: 'all', sharedMemory: true })}
                  className={`rounded-lg border px-3 py-2 text-left font-medium transition-colors cursor-pointer ${
                    config.sharedMemory
                      ? 'border-[#EF4444] bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-200'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Shared I+D Memory (Structural Hazard)
                </button>
                <button
                  type="button"
                  onClick={() => handleConfigChange({ hazardMode: 'all', sharedMemory: false })}
                  className={`rounded-lg border px-3 py-2 text-left font-medium transition-colors cursor-pointer ${
                    !config.sharedMemory
                      ? 'border-[#16A34A] bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Separate I &amp; D Memories (No Conflict)
                </button>
              </div>
            </div>

            <div>
              <span className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Data Forwarding Unit
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleConfigChange({ hazardMode: 'all', forwarding: false })}
                  className={`rounded-lg border px-2.5 py-2 font-medium cursor-pointer ${
                    !config.forwarding
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Disabled
                </button>
                <button
                  type="button"
                  onClick={() => handleConfigChange({ hazardMode: 'all', forwarding: true })}
                  className={`rounded-lg border px-2.5 py-2 font-medium cursor-pointer ${
                    config.forwarding
                      ? 'border-[#2563EB] bg-blue-50 dark:bg-blue-950/40 text-[#2563EB] dark:text-[#22D3EE]'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Enabled
                </button>
              </div>
            </div>

            <div>
              <span className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Branch Outcome (Control Hazard)
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleConfigChange({ hazardMode: 'all', branchOutcome: 'taken' })}
                  className={`rounded-lg border px-2.5 py-2 font-medium cursor-pointer ${
                    config.branchOutcome === 'taken'
                      ? 'border-[#EF4444] bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-200'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Taken
                </button>
                <button
                  type="button"
                  onClick={() => handleConfigChange({ hazardMode: 'all', branchOutcome: 'not-taken' })}
                  className={`rounded-lg border px-2.5 py-2 font-medium cursor-pointer ${
                    config.branchOutcome === 'not-taken'
                      ? 'border-[#16A34A] bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Not Taken
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Clock-Cycle Execution Log */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
          <h2 className="font-display text-base font-bold text-[#14213D] dark:text-white">
            Clock Cycle Execution Log (C0 – C{playback.currentCycle})
          </h2>
          <div className="max-h-80 overflow-y-auto space-y-2 pr-1 pb-1">
            {simulation.cycles
              .slice(0, playback.currentCycle + 1)
              .slice()
              .reverse()
              .map((cyc) => (
                <div
                  key={cyc.cycle}
                  className={`rounded-lg border px-3 py-2 text-xs ${
                    cyc.cycle === playback.currentCycle
                      ? 'border-[#2563EB] dark:border-[#22D3EE] bg-blue-50/50 dark:bg-slate-800'
                      : 'border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900'
                  }`}
                >
                  <div className="font-mono font-bold text-[#14213D] dark:text-[#22D3EE]">
                    Cycle C{cyc.cycle} · PC {cyc.pc}
                  </div>
                  <ul className="mt-1 space-y-0.5 text-slate-600 dark:text-slate-300">
                    {cyc.events.map((ev, idx) => (
                      <li key={idx}>{ev}</li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Dynamic Timing Diagram */}
      <PipelineTimingDiagram
        rows={simulation.timingRows}
        totalCycles={simulation.metrics.totalCycles}
        currentCycle={playback.currentCycle}
      />
    </div>
  );
};
