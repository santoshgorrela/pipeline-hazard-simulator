import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Cpu, GitBranch, Layers } from 'lucide-react';
import {
  PRESET_PROGRAMS,
  PipelineConfig,
  parseProgram,
  simulatePipeline,
} from '../engine/pipelineEngine';
import { usePipelinePlayback } from '../hooks/usePipelinePlayback';
import { SimulationControls } from '../components/SimulationControls';
import { PipelineStageDiagram } from '../components/PipelineStageDiagram';
import { PipelineTimingDiagram } from '../components/PipelineTimingDiagram';

export type HazardModeKey = 'structural' | 'data' | 'control';

interface HazardLabPageProps {
  initialMode?: HazardModeKey;
}

export const HazardLabPage: React.FC<HazardLabPageProps> = ({ initialMode = 'structural' }) => {
  const [mode, setMode] = useState<HazardModeKey>(initialMode);

  // Mode-specific configuration states
  const [sharedMemory, setSharedMemory] = useState<boolean>(true);
  const [dataVariant, setDataVariant] = useState<'raw' | 'loadUse'>('raw');
  const [forwarding, setForwarding] = useState<boolean>(false);
  const [branchOutcome, setBranchOutcome] = useState<'taken' | 'not-taken'>('taken');
  const [branchResolutionStage, setBranchResolutionStage] = useState<'EX' | 'ID'>('EX');

  const activePreset = useMemo(() => {
    if (mode === 'structural') return PRESET_PROGRAMS.structural;
    if (mode === 'data') {
      return dataVariant === 'raw' ? PRESET_PROGRAMS.data : PRESET_PROGRAMS.dataLoadUse;
    }
    return PRESET_PROGRAMS.control;
  }, [mode, dataVariant]);

  const activeConfig: PipelineConfig = useMemo(() => {
    if (mode === 'structural') {
      return {
        hazardMode: 'structural',
        sharedMemory,
        forwarding: true,
        branchOutcome: 'not-taken',
        branchResolutionStage: 'EX',
      };
    }
    if (mode === 'data') {
      return {
        hazardMode: 'data',
        sharedMemory: false,
        forwarding,
        branchOutcome: 'not-taken',
        branchResolutionStage: 'EX',
      };
    }
    return {
      hazardMode: 'control',
      sharedMemory: false,
      forwarding: true,
      branchOutcome,
      branchResolutionStage,
    };
  }, [mode, sharedMemory, forwarding, branchOutcome, branchResolutionStage]);

  const program = useMemo(() => parseProgram(activePreset.source), [activePreset.source]);
  const simulation = useMemo(() => simulatePipeline(program, activeConfig), [program, activeConfig]);

  // Baseline comparison run for instant side-by-side results in the active mode
  const alternateSimulation = useMemo(() => {
    if (mode === 'structural') {
      return simulatePipeline(program, { ...activeConfig, sharedMemory: !sharedMemory });
    }
    if (mode === 'data') {
      return simulatePipeline(program, { ...activeConfig, forwarding: !forwarding });
    }
    return simulatePipeline(program, {
      ...activeConfig,
      branchOutcome: branchOutcome === 'taken' ? 'not-taken' : 'taken',
    });
  }, [mode, program, activeConfig, sharedMemory, forwarding, branchOutcome]);

  const playback = usePipelinePlayback(simulation.metrics.totalCycles);
  const activeSnapshot =
    simulation.cycles[Math.min(playback.currentCycle, simulation.cycles.length - 1)];

  const switchMode = (next: HazardModeKey) => {
    setMode(next);
    playback.reset();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Mode Selector Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#14213D] dark:text-white">
            Hazard Laboratory
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Select a hazard mode to observe live hardware conflicts, pipeline stalls, mitigations, and exact cycle impact.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1">
          {[
            { id: 'structural' as HazardModeKey, label: 'Mode 1: Structural Hazard', icon: <Cpu className="h-3.5 w-3.5" /> },
            { id: 'data' as HazardModeKey, label: 'Mode 2: Data Hazard', icon: <Layers className="h-3.5 w-3.5" /> },
            { id: 'control' as HazardModeKey, label: 'Mode 3: Control Hazard', icon: <GitBranch className="h-3.5 w-3.5" /> },
          ].map((tab) => {
            const active = mode === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => switchMode(tab.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[#2563EB] text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mode Explanation + Configuration Switchboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
          {mode === 'structural' && (
            <>
              <h2 className="font-display text-lg font-bold text-[#14213D] dark:text-white">
                Mode 1: Structural Hazard (Shared Memory Conflict)
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                A structural hazard occurs when two instructions require the same hardware resource during the same clock cycle. With a single unified memory, <strong>I1 (LOAD)</strong> in <strong>MEM</strong> needs memory for data at Cycle 4 while <strong>I4</strong> in <strong>IF</strong> needs memory to fetch the next instruction—forcing <strong>I4</strong> to stall and inserting a pipeline bubble.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                <strong>Mitigation note:</strong> Separate Instruction and Data memories (Harvard split L1 caches) are one effective way to eliminate this particular fetch-vs-memory conflict.
              </p>
            </>
          )}

          {mode === 'data' && (
            <>
              <h2 className="font-display text-lg font-bold text-[#14213D] dark:text-white">
                Mode 2: Data Hazard (RAW Dependency on R1)
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                A Read-After-Write (RAW) data hazard occurs when <strong>I2 (SUB R4, R1, R5)</strong> reads register <strong>R1</strong> before <strong>I1 (ADD R1, R2, R3)</strong> writes it back in WB. Without forwarding, I2 must stall for 2 cycles; enabling <strong>EX→EX forwarding</strong> passes R1 directly from EX/MEM to EX with 0 stalls.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                <strong>Forwarding limit:</strong> Forwarding does not eliminate every data hazard—switch to the <em>Load-Use</em> example below to see why <strong>LOAD R1</strong> followed immediately by <strong>SUB</strong> still requires 1 unavoidable stall cycle because the loaded value is only ready after MEM.
              </p>
            </>
          )}

          {mode === 'control' && (
            <>
              <h2 className="font-display text-lg font-bold text-[#14213D] dark:text-white">
                Mode 3: Control Hazard (Conditional Branch &amp; PC Redirect)
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                A control hazard occurs when a branch instruction (<strong>I1: BEQ R1, R2, TARGET</strong>) alters the Program Counter (PC). Under our simplified educational assumption, the branch condition and target PC are resolved in <strong>{branchResolutionStage}</strong>. When <strong>Taken</strong>, sequentially fetched instructions (<strong>I2, I3</strong>) are flushed and the PC jumps to <strong>TARGET (MUL R9, R10, R11)</strong>.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                <strong>Resolution assumption:</strong> Compare Branch Taken vs Not Taken, or move branch resolution earlier from EX (2 flushed instructions) to ID (1 flushed instruction).
              </p>
            </>
          )}
        </div>

        {/* Mode Controls & Configuration */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
          <h3 className="font-display text-sm font-bold text-[#14213D] dark:text-white">
            Scenario Configuration
          </h3>

          {mode === 'structural' && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setSharedMemory(true);
                  playback.reset();
                }}
                className={`w-full rounded-xl border px-4 py-2.5 text-left text-xs font-semibold transition-colors cursor-pointer ${
                  sharedMemory
                    ? 'border-[#EF4444] bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-200'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                Config A: Shared Instruction &amp; Data Memory (Causes Hazard)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSharedMemory(false);
                  playback.reset();
                }}
                className={`w-full rounded-xl border px-4 py-2.5 text-left text-xs font-semibold transition-colors cursor-pointer ${
                  !sharedMemory
                    ? 'border-[#16A34A] bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                Config B: Separate Instruction &amp; Data Memories (Mitigated)
              </button>
            </div>
          )}

          {mode === 'data' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setForwarding(false);
                    playback.reset();
                  }}
                  className={`rounded-xl border px-3 py-2.5 text-xs font-semibold whitespace-nowrap cursor-pointer ${
                    !forwarding
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  A. Without Forwarding
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setForwarding(true);
                    playback.reset();
                  }}
                  className={`rounded-xl border px-3 py-2.5 text-xs font-semibold whitespace-nowrap cursor-pointer ${
                    forwarding
                      ? 'border-[#2563EB] bg-blue-50 dark:bg-blue-950/40 text-[#2563EB] dark:text-[#22D3EE]'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  B. With Forwarding
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDataVariant('raw');
                    playback.reset();
                  }}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium whitespace-nowrap cursor-pointer ${
                    dataVariant === 'raw'
                      ? 'border-[#14213D] dark:border-[#22D3EE] bg-slate-100 dark:bg-slate-800 font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Example: ADD → SUB (R1)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDataVariant('loadUse');
                    playback.reset();
                  }}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium whitespace-nowrap cursor-pointer ${
                    dataVariant === 'loadUse'
                      ? 'border-[#14213D] dark:border-[#22D3EE] bg-slate-100 dark:bg-slate-800 font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Limit: LOAD → SUB (Load-Use)
                </button>
              </div>
            </div>
          )}

          {mode === 'control' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setBranchOutcome('taken');
                    playback.reset();
                  }}
                  className={`rounded-xl border px-3 py-2.5 text-xs font-semibold whitespace-nowrap cursor-pointer ${
                    branchOutcome === 'taken'
                      ? 'border-[#EF4444] bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-200'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Branch Taken (Flush)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBranchOutcome('not-taken');
                    playback.reset();
                  }}
                  className={`rounded-xl border px-3 py-2.5 text-xs font-semibold whitespace-nowrap cursor-pointer ${
                    branchOutcome === 'not-taken'
                      ? 'border-[#16A34A] bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Branch Not Taken
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setBranchResolutionStage('EX');
                    playback.reset();
                  }}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium whitespace-nowrap cursor-pointer ${
                    branchResolutionStage === 'EX'
                      ? 'border-[#14213D] dark:border-[#22D3EE] bg-slate-100 dark:bg-slate-800 font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Resolve in EX (2 flushes)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBranchResolutionStage('ID');
                    playback.reset();
                  }}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium whitespace-nowrap cursor-pointer ${
                    branchResolutionStage === 'ID'
                      ? 'border-[#14213D] dark:border-[#22D3EE] bg-slate-100 dark:bg-slate-800 font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Early Resolve in ID (1 flush)
                </button>
              </div>
            </div>
          )}

          {/* Live Program Instructions Box */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 font-mono text-xs space-y-1">
            {program.map((inst) => (
              <div key={inst.id} className="flex items-center justify-between">
                <span>
                  <strong className="text-[#2563EB] dark:text-[#22D3EE] mr-2">{inst.id}:</strong>
                  {inst.displayText}
                </span>
                <span className="text-slate-400">{inst.pc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Simulation Controls */}
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
      />

      {/* Live Pipeline Diagram */}
      <PipelineStageDiagram
        snapshot={activeSnapshot}
        sharedMemory={activeConfig.sharedMemory}
        forwarding={activeConfig.forwarding}
        highlightMode={mode}
      />

      {/* Expected Output & Comparison Readout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2.5">
          <div className="flex items-center gap-2 font-display text-base font-bold text-[#14213D] dark:text-white">
            {simulation.metrics.stallCycles > 0 || simulation.metrics.flushedInstructions > 0 ? (
              <AlertTriangle className="h-4 w-4 text-[#EF4444]" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-[#16A34A]" />
            )}
            Expected vs Simulated Output (Active Configuration)
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs tabular-nums pt-1">
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-2.5">
              <div className="text-slate-500 dark:text-slate-400">Cycles</div>
              <div className="text-base font-bold text-[#14213D] dark:text-white">
                {simulation.metrics.totalCycles}
              </div>
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-2.5">
              <div className="text-slate-500 dark:text-slate-400">Stalls</div>
              <div className="text-base font-bold text-amber-600 dark:text-amber-400">
                {simulation.metrics.stallCycles}
              </div>
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-2.5">
              <div className="text-slate-500 dark:text-slate-400">Flushed</div>
              <div className="text-base font-bold text-rose-600 dark:text-rose-400">
                {simulation.metrics.flushedInstructions}
              </div>
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-2.5">
              <div className="text-slate-500 dark:text-slate-400">CPI</div>
              <div className="text-base font-bold text-[#2563EB] dark:text-[#22D3EE]">
                {simulation.metrics.cpi.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2.5">
          <div className="font-display text-base font-bold text-[#14213D] dark:text-white">
            Alternate Configuration Comparison
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            {mode === 'structural' && (sharedMemory ? 'With Separate I & D Memories:' : 'With Shared Memory:')}
            {mode === 'data' && (forwarding ? 'Without Forwarding:' : 'With Forwarding Enabled:')}
            {mode === 'control' && (branchOutcome === 'taken' ? 'When Branch Not Taken:' : 'When Branch Taken:')}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs tabular-nums">
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-2.5">
              <div className="text-slate-500 dark:text-slate-400">Cycles</div>
              <div className="text-base font-bold text-[#14213D] dark:text-white">
                {alternateSimulation.metrics.totalCycles}
              </div>
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-2.5">
              <div className="text-slate-500 dark:text-slate-400">Stalls</div>
              <div className="text-base font-bold text-amber-600 dark:text-amber-400">
                {alternateSimulation.metrics.stallCycles}
              </div>
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-2.5">
              <div className="text-slate-500 dark:text-slate-400">Flushed</div>
              <div className="text-base font-bold text-rose-600 dark:text-rose-400">
                {alternateSimulation.metrics.flushedInstructions}
              </div>
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-2.5">
              <div className="text-slate-500 dark:text-slate-400">CPI</div>
              <div className="text-base font-bold text-[#2563EB] dark:text-[#22D3EE]">
                {alternateSimulation.metrics.cpi.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Timing Diagram */}
      <PipelineTimingDiagram
        rows={simulation.timingRows}
        totalCycles={simulation.metrics.totalCycles}
        currentCycle={playback.currentCycle}
      />
    </div>
  );
};
