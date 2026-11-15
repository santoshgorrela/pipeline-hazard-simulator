import React from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, PauseCircle, Zap } from 'lucide-react';
import {
  PIPELINE_STAGES,
  PipelineCycleSnapshot,
  STAGE_LABELS,
  StageName,
} from '../engine/pipelineEngine';

interface PipelineStageDiagramProps {
  snapshot: PipelineCycleSnapshot;
  sharedMemory: boolean;
  forwarding: boolean;
  highlightMode?: 'all' | 'structural' | 'data' | 'control';
}

export const PipelineStageDiagram: React.FC<PipelineStageDiagramProps> = ({
  snapshot,
  sharedMemory,
  forwarding,
  highlightMode = 'all',
}) => {
  const hasStructural = Boolean(snapshot.structuralConflict);
  const activeForwarding = snapshot.dataHazards.filter((d) => !d.causedStall);
  const stalledData = snapshot.dataHazards.filter((d) => d.causedStall);
  const activeControl = snapshot.controlHazard;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-[#14213D] dark:text-white">
            5-Stage Educational Pipeline Datapath
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Simplified 5-stage model (IF → ID → EX → MEM → WB) · 1 clock cycle per stage · PC ={' '}
            <span className="font-mono font-semibold text-[#2563EB] dark:text-[#22D3EE]">
              {snapshot.pc}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 font-mono text-xs tabular-nums">
          <span className="text-[#14213D] dark:text-white font-bold">
            Clock: C{snapshot.cycle}
          </span>
          <span className="text-slate-500 dark:text-slate-400">
            Stalls: <strong className="text-amber-600 dark:text-amber-400">{snapshot.stallsSoFar}</strong>
          </span>
          <span className="text-slate-500 dark:text-slate-400">
            Flushed: <strong className="text-rose-600 dark:text-rose-400">{snapshot.flushesSoFar}</strong>
          </span>
          <span className="text-slate-500 dark:text-slate-400">
            Completed: <strong className="text-emerald-600 dark:text-emerald-400">{snapshot.completedSoFar}</strong>
          </span>
        </div>
      </div>

      {/* 5 Connected Pipeline Stage Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-stretch">
        {PIPELINE_STAGES.map((stage: StageName, idx: number) => {
          const slot = snapshot.stages[stage];
          const isStructuralIf = hasStructural && stage === 'IF';
          const isStructuralMem = hasStructural && stage === 'MEM';
          const isBubble = slot.kind === 'bubble';
          const isStalled = slot.kind === 'stalled';
          const isActive = slot.kind === 'instruction';

          let boxBorder = 'border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40';
          if (isStructuralIf || isStructuralMem) {
            boxBorder = 'border-[#EF4444] bg-rose-50 dark:bg-rose-950/30 ring-2 ring-[#EF4444]/30';
          } else if (isStalled) {
            boxBorder = 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 ring-2 ring-amber-500/25';
          } else if (isBubble) {
            boxBorder = 'border-dashed border-amber-400 dark:border-amber-600 bg-amber-50/50 dark:bg-amber-950/20';
          } else if (isActive) {
            boxBorder =
              stage === 'WB'
                ? 'border-[#16A34A] bg-emerald-50/60 dark:bg-emerald-950/25'
                : 'border-[#2563EB] dark:border-[#22D3EE] bg-blue-50/60 dark:bg-slate-800/80';
          }

          return (
            <div key={stage} className="relative flex items-stretch">
              <div
                className={`w-full rounded-xl border p-3.5 flex flex-col justify-between transition-all duration-200 ${boxBorder}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-extrabold tracking-wide text-[#14213D] dark:text-white">
                    {stage}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                    {STAGE_LABELS[stage]}
                  </span>
                </div>

                <div className="my-3 min-h-[58px] flex flex-col justify-center">
                  {slot.kind === 'empty' && (
                    <div className="text-xs font-mono text-slate-400 dark:text-slate-500">
                      IDLE
                    </div>
                  )}

                  {slot.kind === 'bubble' && (
                    <div className="space-y-1 animate-stage-enter">
                      <div className="inline-flex items-center gap-1 text-xs font-mono font-bold text-amber-700 dark:text-amber-300">
                        <PauseCircle className="h-3.5 w-3.5" />
                        BUBBLE (NOP)
                      </div>
                      <p className="text-[11px] text-amber-700/90 dark:text-amber-300/90 leading-snug">
                        {slot.note}
                      </p>
                    </div>
                  )}

                  {(slot.kind === 'instruction' || slot.kind === 'stalled') && (
                    <div key={`${snapshot.cycle}-${slot.instId}`} className="space-y-1 animate-stage-enter">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-xs font-bold text-[#2563EB] dark:text-[#22D3EE]">
                          {slot.instId}
                        </span>
                        {isStalled && (
                          <span className="inline-flex items-center gap-0.5 text-[11px] font-mono font-bold text-amber-700 dark:text-amber-300">
                            <PauseCircle className="h-3 w-3" />
                            STALLED
                          </span>
                        )}
                        {isStructuralMem && (
                          <span className="inline-flex items-center gap-0.5 text-[11px] font-mono font-bold text-[#EF4444]">
                            <AlertTriangle className="h-3 w-3" />
                            MEM BUSY
                          </span>
                        )}
                        {stage === 'WB' && isActive && (
                          <span className="inline-flex items-center gap-0.5 text-[11px] font-mono font-bold text-[#16A34A]">
                            <CheckCircle2 className="h-3 w-3" />
                            COMMIT
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-xs font-semibold text-[#172033] dark:text-white break-words">
                        {slot.instructionText}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/70 text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                  {slot.kind === 'empty'
                    ? 'Waiting for instruction'
                    : slot.note ?? 'Active stage'}
                </div>
              </div>

              {idx < PIPELINE_STAGES.length - 1 && (
                <div
                  className="hidden md:flex items-center justify-center -mx-1.5 z-10 text-slate-400 dark:text-slate-500"
                  aria-hidden="true"
                >
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Hardware Datapath & Hazard Signal Schematic (SVG) */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-[#14213D] p-4">
        <svg viewBox="0 0 860 182" className="w-full h-auto select-none" role="img" aria-label="Pipeline datapath, memory access, forwarding bypass, and branch control schematic">
          {/* Pipeline Register Dividers */}
          {[168, 338, 508, 678].map((x, idx) => (
            <g key={x}>
              <line x1={x} y1={32} x2={x} y2={118} stroke="#334155" strokeWidth={2} strokeDasharray="4 3" />
              <text x={x} y={131} textAnchor="middle" fill="#94A3B8" className="text-[9px] font-mono">
                {['IF/ID', 'ID/EX', 'EX/MEM', 'MEM/WB'][idx]}
              </text>
            </g>
          ))}

          {/* Stage Flow Backbone */}
          {PIPELINE_STAGES.map((stg, idx) => {
            const x = 18 + idx * 170;
            const slot = snapshot.stages[stg];
            const conflictHere = hasStructural && (stg === 'IF' || stg === 'MEM');
            const stalledHere = slot.kind === 'stalled';
            const bubbleHere = slot.kind === 'bubble';
            const stroke = conflictHere
              ? '#EF4444'
              : stalledHere || bubbleHere
                ? '#F59E0B'
                : slot.kind === 'instruction'
                  ? stg === 'WB'
                    ? '#16A34A'
                    : '#22D3EE'
                  : '#475569';
            return (
              <g key={stg}>
                <rect
                  x={x}
                  y={40}
                  width={132}
                  height={62}
                  rx={8}
                  fill="#0F172A"
                  stroke={stroke}
                  strokeWidth={slot.kind !== 'empty' || conflictHere ? 2.2 : 1.2}
                />
                <text x={x + 66} y={58} textAnchor="middle" fill="#94A3B8" className="text-[10px] font-mono font-bold">
                  {stg}
                </text>
                <text
                  x={x + 66}
                  y={76}
                  textAnchor="middle"
                  fill={conflictHere ? '#FCA5A5' : bubbleHere ? '#FCD34D' : '#FFFFFF'}
                  className="text-[11px] font-mono font-bold"
                >
                  {conflictHere && stg === 'IF'
                    ? 'IF BLOCKED'
                    : slot.kind === 'instruction' || slot.kind === 'stalled'
                      ? slot.instId
                      : slot.kind === 'bubble'
                        ? 'BUBBLE'
                        : '—'}
                </text>
                <text x={x + 66} y={92} textAnchor="middle" fill="#64748B" className="text-[9px] font-mono">
                  {slot.pc ?? (slot.kind === 'bubble' ? 'NOP' : 'IDLE')}
                </text>
              </g>
            );
          })}

          {/* Inter-stage animated signal lines */}
          {[150, 320, 490, 660].map((x) => (
            <path
              key={x}
              d={`M ${x} 71 L ${x + 38} 71`}
              stroke={hasStructural && x === 150 ? '#EF4444' : '#22D3EE'}
              strokeWidth={2}
              className={snapshot.cycle > 0 ? 'animate-signal-flow' : ''}
            />
          ))}

          {/* Structural Memory Conflict / Separate Memory Indicator */}
          {(highlightMode === 'structural' || highlightMode === 'all' || sharedMemory) && (
            <g>
              {sharedMemory ? (
                <>
                  <rect
                    x={315}
                    y={149}
                    width={230}
                    height={23}
                    rx={5}
                    fill={hasStructural ? '#7F1D1D' : '#1E293B'}
                    stroke={hasStructural ? '#EF4444' : '#475569'}
                    strokeWidth={1.6}
                  />
                  <text x={430} y={164} textAnchor="middle" fill={hasStructural ? '#FECACA' : '#CBD5E1'} className="text-[10px] font-mono font-bold">
                    {hasStructural
                      ? `CONFLICT: ${snapshot.structuralConflict?.memInstId} (MEM) & ${snapshot.structuralConflict?.ifInstId} (IF)`
                      : 'SHARED INSTRUCTION + DATA MEMORY'}
                  </text>
                  <path
                    d="M 84 102 L 84 160 L 315 160"
                    fill="none"
                    stroke={hasStructural ? '#EF4444' : '#64748B'}
                    strokeWidth={hasStructural ? 2.2 : 1.3}
                    className={hasStructural ? 'animate-signal-flow' : ''}
                  />
                  <path
                    d="M 594 102 L 594 160 L 545 160"
                    fill="none"
                    stroke={hasStructural ? '#EF4444' : '#64748B'}
                    strokeWidth={hasStructural ? 2.2 : 1.3}
                    className={hasStructural ? 'animate-signal-flow' : ''}
                  />
                </>
              ) : (
                <>
                  <rect x={28} y={149} width={112} height={22} rx={5} fill="#0F172A" stroke="#16A34A" strokeWidth={1.4} />
                  <text x={84} y={163} textAnchor="middle" fill="#86EFAC" className="text-[9.5px] font-mono font-bold">
                    I-MEM (PORT A)
                  </text>
                  <rect x={538} y={149} width={112} height={22} rx={5} fill="#0F172A" stroke="#16A34A" strokeWidth={1.4} />
                  <text x={594} y={163} textAnchor="middle" fill="#86EFAC" className="text-[9.5px] font-mono font-bold">
                    D-MEM (PORT B)
                  </text>
                </>
              )}
            </g>
          )}

          {/* Data Forwarding Bypass Arc (EX/MEM or MEM/WB -> EX) */}
          {forwarding && activeForwarding.length > 0 && (
            <g>
              <path
                d={
                  activeForwarding[0].resolvedBy === 'MEM->EX'
                    ? 'M 764 40 C 764 16, 424 16, 424 40'
                    : 'M 594 40 C 594 18, 424 18, 424 40'
                }
                fill="none"
                stroke="#22D3EE"
                strokeWidth={2.4}
                className="animate-signal-flow"
              />
              <rect x={428} y={4} width={174} height={17} rx={4} fill="#14213D" stroke="#22D3EE" strokeWidth={0.9} />
              <text x={515} y={16} textAnchor="middle" fill="#22D3EE" className="text-[9.5px] font-mono font-bold">
                FORWARD {activeForwarding[0].reg} ({activeForwarding[0].resolvedBy})
              </text>
            </g>
          )}

          {/* Stalled RAW Dependency Arc (EX/MEM -> ID) */}
          {stalledData.length > 0 && (
            <g>
              <path
                d="M 424 40 C 424 18, 254 18, 254 40"
                fill="none"
                stroke="#F59E0B"
                strokeWidth={2.4}
                className="animate-signal-flow"
              />
              <rect x={269} y={4} width={140} height={17} rx={4} fill="#14213D" stroke="#F59E0B" strokeWidth={0.9} />
              <text x={339} y={16} textAnchor="middle" fill="#FCD34D" className="text-[9.5px] font-mono font-bold">
                RAW STALL ON {stalledData[0].reg}
              </text>
            </g>
          )}

          {/* Control Branch Redirect Arc */}
          {activeControl && activeControl.outcome === 'taken' && (
            <g>
              <path
                d={`M ${activeControl.resolvedAtStage === 'EX' ? 424 : 254} 102 C 350 132, 160 132, 84 102`}
                fill="none"
                stroke="#EF4444"
                strokeWidth={2.2}
                className="animate-signal-flow"
              />
              <rect x={162} y={121} width={184} height={18} rx={4} fill="#14213D" stroke="#EF4444" strokeWidth={0.9} />
              <text x={254} y={133} textAnchor="middle" fill="#FCA5A5" className="text-[9.5px] font-mono font-bold">
                BRANCH TAKEN → PC={activeControl.targetPc ?? 'END'}
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Live Cycle Hazard Alerts (Paired with explicit icons & text labels) */}
      {(hasStructural || activeForwarding.length > 0 || stalledData.length > 0 || activeControl) && (
        <div className="space-y-2">
          {snapshot.structuralConflict && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 px-3.5 py-2.5 text-xs text-rose-800 dark:text-rose-200">
              <AlertTriangle className="h-4 w-4 text-[#EF4444] shrink-0 mt-0.5" />
              <span>
                <strong>Structural Hazard:</strong> {snapshot.structuralConflict.message}
              </span>
            </div>
          )}
          {activeForwarding.map((dh, i) => (
            <div
              key={`${dh.producerId}-${dh.consumerId}-${i}`}
              className="flex items-start gap-2 rounded-lg border border-cyan-200 dark:border-cyan-800 bg-cyan-50 dark:bg-cyan-950/30 px-3.5 py-2.5 text-xs text-cyan-900 dark:text-cyan-200"
            >
              <Zap className="h-4 w-4 text-[#2563EB] dark:text-[#22D3EE] shrink-0 mt-0.5" />
              <span>
                <strong>Forwarding Active:</strong> {dh.message}
              </span>
            </div>
          ))}
          {stalledData.map((dh, i) => (
            <div
              key={`stall-${dh.producerId}-${dh.consumerId}-${i}`}
              className="flex items-start gap-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-3.5 py-2.5 text-xs text-amber-900 dark:text-amber-200"
            >
              <PauseCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>Data Hazard (RAW):</strong> {dh.message}
              </span>
            </div>
          ))}
          {activeControl && (
            <div
              className={`flex items-start gap-2 rounded-lg border px-3.5 py-2.5 text-xs ${
                activeControl.outcome === 'taken'
                  ? 'border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200'
                  : 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200'
              }`}
            >
              {activeControl.outcome === 'taken' ? (
                <AlertTriangle className="h-4 w-4 text-[#EF4444] shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-[#16A34A] shrink-0 mt-0.5" />
              )}
              <span>
                <strong>Control Hazard:</strong> {activeControl.message}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
