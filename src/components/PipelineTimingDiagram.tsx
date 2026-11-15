import React from 'react';
import { TimingCellState, TimingDiagramRow } from '../engine/pipelineEngine';

interface PipelineTimingDiagramProps {
  rows: TimingDiagramRow[];
  totalCycles: number;
  currentCycle: number;
}

function cellStyle(cell: TimingCellState, isCurrentOrPast: boolean): string {
  if (!isCurrentOrPast || cell === '') {
    return 'bg-slate-50/50 dark:bg-slate-900/40 text-slate-300 dark:text-slate-700';
  }
  switch (cell) {
    case 'IF':
      return 'bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-200 font-bold';
    case 'ID':
      return 'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-900 dark:text-cyan-200 font-bold';
    case 'EX':
      return 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-900 dark:text-indigo-200 font-bold';
    case 'MEM':
      return 'bg-violet-100 dark:bg-violet-900/50 text-violet-900 dark:text-violet-200 font-bold';
    case 'WB':
      return 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 font-bold';
    case 'STALL':
      return 'bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-bold';
    case 'FLUSH':
      return 'bg-rose-200 dark:bg-rose-900/60 text-rose-900 dark:text-rose-200 font-bold';
    default:
      return '';
  }
}

export const PipelineTimingDiagram: React.FC<PipelineTimingDiagramProps> = ({
  rows,
  totalCycles,
  currentCycle,
}) => {
  const cycleHeaders = Array.from({ length: totalCycles }, (_, i) => i + 1);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-bold text-[#14213D] dark:text-white">
            Dynamic Pipeline Timing Diagram
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Generated live from the simulation engine up to current clock cycle C{currentCycle}
          </p>
        </div>

        {/* Explicit Text Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded bg-blue-200 dark:bg-blue-800 border border-blue-400" />
            IF–MEM Normal
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded bg-amber-300 dark:bg-amber-800 border border-amber-500" />
            STALL / Bubble
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded bg-rose-300 dark:bg-rose-800 border border-rose-500" />
            FLUSH (Wrong Path)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded bg-emerald-200 dark:bg-emerald-800 border border-emerald-500" />
            WB Completed
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs font-mono tabular-nums">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
              <th className="py-2 pr-3 text-left font-semibold whitespace-nowrap sticky left-0 bg-white dark:bg-slate-900">
                Instruction
              </th>
              {cycleHeaders.map((c) => (
                <th
                  key={c}
                  className={`py-2 px-2 text-center font-semibold min-w-[46px] ${
                    c === currentCycle
                      ? 'bg-[#2563EB]/10 dark:bg-[#22D3EE]/15 text-[#2563EB] dark:text-[#22D3EE] border-b-2 border-[#2563EB] dark:border-[#22D3EE]'
                      : ''
                  }`}
                >
                  C{c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const rowCompletedByNow =
                row.cells.findIndex((cell) => cell === 'WB') >= 0 &&
                row.cells.findIndex((cell) => cell === 'WB') + 1 <= currentCycle;
              const rowFlushedByNow =
                row.cells.findIndex((cell) => cell === 'FLUSH') >= 0 &&
                row.cells.findIndex((cell) => cell === 'FLUSH') + 1 <= currentCycle;

              return (
                <tr
                  key={row.instId}
                  className="border-b border-slate-100 dark:border-slate-800/80 last:border-b-0"
                >
                  <td className="py-2 pr-3 text-left whitespace-nowrap sticky left-0 bg-white dark:bg-slate-900">
                    <span className="font-bold text-[#14213D] dark:text-white mr-2">
                      {row.instId}
                    </span>
                    <span className="text-slate-700 dark:text-slate-300">{row.displayText}</span>
                    {rowCompletedByNow && (
                      <span className="ml-2 text-[10px] text-[#16A34A] font-bold">DONE</span>
                    )}
                    {rowFlushedByNow && (
                      <span className="ml-2 text-[10px] text-[#EF4444] font-bold">FLUSHED</span>
                    )}
                  </td>
                  {row.cells.map((cell, idx) => {
                    const cycleNum = idx + 1;
                    const visible = cycleNum <= currentCycle;
                    return (
                      <td
                        key={cycleNum}
                        className={`p-1 text-center border-l border-slate-100 dark:border-slate-800/70 ${
                          cycleNum === currentCycle ? 'ring-1 ring-inset ring-[#2563EB]/40' : ''
                        }`}
                      >
                        <div
                          className={`rounded px-1.5 py-1 text-[11px] transition-all duration-150 ${cellStyle(
                            cell,
                            visible,
                          )}`}
                        >
                          {visible && cell ? cell : '·'}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
