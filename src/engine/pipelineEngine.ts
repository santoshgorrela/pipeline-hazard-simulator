export type StageName = 'IF' | 'ID' | 'EX' | 'MEM' | 'WB';

export const PIPELINE_STAGES: StageName[] = ['IF', 'ID', 'EX', 'MEM', 'WB'];

export const STAGE_LABELS: Record<StageName, string> = {
  IF: 'Instruction Fetch',
  ID: 'Instruction Decode',
  EX: 'Execute',
  MEM: 'Memory Access',
  WB: 'Write Back',
};

export interface ParsedInstruction {
  index: number;
  id: string;
  label?: string;
  pc: string;
  raw: string;
  displayText: string;
  opcode: string;
  dest: string | null;
  src1: string | null;
  src2: string | null;
  isLoad: boolean;
  isStore: boolean;
  isBranch: boolean;
  targetLabel?: string;
}

export type HazardEnableMode = 'ideal' | 'structural' | 'data' | 'control' | 'all';

export interface PipelineConfig {
  hazardMode: HazardEnableMode;
  sharedMemory: boolean;
  forwarding: boolean;
  branchOutcome: 'taken' | 'not-taken';
  branchResolutionStage: 'EX' | 'ID';
}

export interface StageSlotState {
  kind: 'empty' | 'instruction' | 'bubble' | 'stalled';
  instId: string | null;
  instructionText: string | null;
  pc: string | null;
  note: string | null;
}

export interface StructuralConflictInfo {
  memInstId: string;
  ifInstId: string;
  message: string;
}

export interface DataHazardInfo {
  producerId: string;
  consumerId: string;
  reg: string;
  type: 'RAW';
  resolvedBy: 'stall' | 'EX->EX' | 'MEM->EX' | 'WB->ID';
  causedStall: boolean;
  message: string;
}

export interface ControlHazardInfo {
  branchId: string;
  outcome: 'taken' | 'not-taken';
  resolvedAtStage: 'EX' | 'ID';
  targetId: string | null;
  targetPc: string | null;
  flushedIds: string[];
  message: string;
}

export type InstructionLifecycle = 'waiting' | 'active' | 'stalled' | 'flushed' | 'completed';

export interface PipelineCycleSnapshot {
  cycle: number;
  pc: string;
  stages: Record<StageName, StageSlotState>;
  instructionStatus: Record<string, { status: InstructionLifecycle; stage: StageName | null }>;
  structuralConflict: StructuralConflictInfo | null;
  dataHazards: DataHazardInfo[];
  controlHazard: ControlHazardInfo | null;
  stallsSoFar: number;
  flushesSoFar: number;
  completedSoFar: number;
  events: string[];
}

export type TimingCellState = StageName | 'STALL' | 'FLUSH' | '';

export interface TimingDiagramRow {
  instId: string;
  displayText: string;
  pc: string;
  cells: TimingCellState[];
  finalStatus: 'completed' | 'flushed';
}

export interface PerformanceMetrics {
  totalInstructions: number;
  completedInstructions: number;
  totalCycles: number;
  stallCycles: number;
  flushedInstructions: number;
  cpi: number;
}

export interface PipelineSimulationResult {
  program: ParsedInstruction[];
  config: PipelineConfig;
  cycles: PipelineCycleSnapshot[];
  timingRows: TimingDiagramRow[];
  metrics: PerformanceMetrics;
  assumptions: string[];
}

export interface ScenarioComparison {
  ideal: PipelineSimulationResult;
  withHazards: PipelineSimulationResult;
  withHandling: PipelineSimulationResult;
}

export interface ProgramPreset {
  id: 'playground' | 'structural' | 'data' | 'dataLoadUse' | 'control';
  name: string;
  summary: string;
  source: string;
  recommendedConfig: PipelineConfig;
}

export const PRESET_PROGRAMS: Record<ProgramPreset['id'], ProgramPreset> = {
  playground: {
    id: 'playground',
    name: 'Playground Sequence (5 Instructions)',
    summary: 'Mixed ALU, Load-Use dependency, and Store instructions from the Unit 4 demonstration set.',
    source: [
      'I1: ADD R1, R2, R3',
      'I2: SUB R4, R1, R5',
      'I3: LOAD R6, 0(R7)',
      'I4: ADD R8, R6, R9',
      'I5: STORE R8, 4(R7)',
    ].join('\n'),
    recommendedConfig: {
      hazardMode: 'all',
      sharedMemory: false,
      forwarding: true,
      branchOutcome: 'taken',
      branchResolutionStage: 'EX',
    },
  },
  structural: {
    id: 'structural',
    name: 'Example 1 — Structural Hazard (Shared Memory)',
    summary: 'LOAD in MEM competes with a later IF fetch when Instruction and Data share one memory port.',
    source: [
      'I1: LOAD R1, 0(R2)',
      'I2: ADD R3, R4, R5',
      'I3: SUB R6, R7, R8',
      'I4: ADD R9, R10, R11',
      'I5: MUL R12, R13, R14',
    ].join('\n'),
    recommendedConfig: {
      hazardMode: 'structural',
      sharedMemory: true,
      forwarding: true,
      branchOutcome: 'not-taken',
      branchResolutionStage: 'EX',
    },
  },
  data: {
    id: 'data',
    name: 'Example 2 — Data Hazard (RAW on R1)',
    summary: 'SUB depends on R1 produced by ADD; compare 2-cycle stall without forwarding vs 0 stalls with EX→EX forwarding.',
    source: [
      'I1: ADD R1, R2, R3',
      'I2: SUB R4, R1, R5',
      'I3: ADD R6, R1, R7',
      'I4: STORE R4, 0(R8)',
    ].join('\n'),
    recommendedConfig: {
      hazardMode: 'data',
      sharedMemory: false,
      forwarding: false,
      branchOutcome: 'not-taken',
      branchResolutionStage: 'EX',
    },
  },
  dataLoadUse: {
    id: 'dataLoadUse',
    name: 'Load-Use Data Hazard (Forwarding Limit)',
    summary: 'Demonstrates that even with forwarding enabled, LOAD followed immediately by SUB still needs 1 stall cycle.',
    source: [
      'I1: LOAD R1, 0(R2)',
      'I2: SUB R4, R1, R5',
      'I3: ADD R6, R4, R7',
    ].join('\n'),
    recommendedConfig: {
      hazardMode: 'data',
      sharedMemory: false,
      forwarding: true,
      branchOutcome: 'not-taken',
      branchResolutionStage: 'EX',
    },
  },
  control: {
    id: 'control',
    name: 'Example 3 — Control Hazard (Conditional Branch)',
    summary: 'BEQ resolves in EX; when Taken, sequential wrong-path instructions I2 and I3 are flushed and PC jumps to TARGET.',
    source: [
      'I1: BEQ R1, R2, TARGET',
      'I2: ADD R3, R4, R5',
      'I3: SUB R6, R7, R8',
      'TARGET: MUL R9, R10, R11',
      'I5: ADD R12, R9, R1',
    ].join('\n'),
    recommendedConfig: {
      hazardMode: 'control',
      sharedMemory: false,
      forwarding: true,
      branchOutcome: 'taken',
      branchResolutionStage: 'EX',
    },
  },
};

function cleanToken(tok: string): string {
  return tok.replace(/,/g, '').trim().toUpperCase();
}

function parseMemOperand(op: string): string | null {
  const match = op.match(/\((R\d+)\)/i);
  if (match) return match[1].toUpperCase();
  const regOnly = op.match(/^(R\d+)$/i);
  return regOnly ? regOnly[1].toUpperCase() : null;
}

export function parseProgram(source: string): ParsedInstruction[] {
  const lines = source
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('//') && !l.startsWith('#'));

  return lines.map((rawLine, index) => {
    let working = rawLine;
    let id = `I${index + 1}`;
    let label: string | undefined;

    // Strip optional "I1:" prefix
    const idMatch = working.match(/^(I\d+)\s*:\s*(.*)$/i);
    if (idMatch) {
      id = idMatch[1].toUpperCase();
      working = idMatch[2].trim();
    }

    // Extract optional branch target label like "TARGET: MUL R9, R10, R11"
    const labelMatch = working.match(/^([A-Z_][A-Z0-9_]*)\s*:\s*(.*)$/i);
    if (labelMatch) {
      label = labelMatch[1].toUpperCase();
      working = labelMatch[2].trim();
    }

    const parts = working.split(/[\s,]+/).filter(Boolean);
    const opcode = (parts[0] ?? 'NOP').toUpperCase();
    const args = parts.slice(1).map((a) => a.trim());

    let dest: string | null = null;
    let src1: string | null = null;
    let src2: string | null = null;
    let isLoad = false;
    let isStore = false;
    let isBranch = false;
    let targetLabel: string | undefined;

    if (opcode === 'LOAD' || opcode === 'LW' || opcode === 'LDR') {
      isLoad = true;
      dest = args[0] ? cleanToken(args[0]) : null;
      src1 = args[1] ? parseMemOperand(args[1]) : null;
    } else if (opcode === 'STORE' || opcode === 'SW' || opcode === 'STR') {
      isStore = true;
      src1 = args[0] ? cleanToken(args[0]) : null;
      src2 = args[1] ? parseMemOperand(args[1]) : null;
    } else if (opcode === 'BEQ' || opcode === 'BNE' || opcode === 'BLT' || opcode === 'BGE') {
      isBranch = true;
      src1 = args[0] ? cleanToken(args[0]) : null;
      src2 = args[1] ? cleanToken(args[1]) : null;
      targetLabel = args[2] ? cleanToken(args[2]) : undefined;
    } else if (opcode === 'B' || opcode === 'JMP' || opcode === 'J') {
      isBranch = true;
      targetLabel = args[0] ? cleanToken(args[0]) : undefined;
    } else if (opcode !== 'NOP') {
      dest = args[0] ? cleanToken(args[0]) : null;
      src1 = args[1] ? cleanToken(args[1]) : null;
      src2 = args[2] ? cleanToken(args[2]) : null;
    }

    const pcHex = `0x${(0x100 + index * 4).toString(16).toUpperCase()}`;
    const displayText = label ? `${label}: ${working}` : working;

    return {
      index,
      id,
      label,
      pc: pcHex,
      raw: rawLine,
      displayText,
      opcode,
      dest,
      src1,
      src2,
      isLoad,
      isStore,
      isBranch,
      targetLabel,
    };
  });
}

function emptySlot(): StageSlotState {
  return {
    kind: 'empty',
    instId: null,
    instructionText: null,
    pc: null,
    note: null,
  };
}

function bubbleSlot(note: string): StageSlotState {
  return {
    kind: 'bubble',
    instId: null,
    instructionText: 'BUBBLE (NOP)',
    pc: null,
    note,
  };
}

function instSlot(inst: ParsedInstruction, note: string | null = null): StageSlotState {
  return {
    kind: 'instruction',
    instId: inst.id,
    instructionText: inst.displayText,
    pc: inst.pc,
    note,
  };
}

function stalledSlot(inst: ParsedInstruction, note: string): StageSlotState {
  return {
    kind: 'stalled',
    instId: inst.id,
    instructionText: inst.displayText,
    pc: inst.pc,
    note,
  };
}

function findMatchingReg(consumer: ParsedInstruction, producer: ParsedInstruction | null): string | null {
  if (!producer || !producer.dest) return null;
  if (consumer.src1 && consumer.src1 === producer.dest) return producer.dest;
  if (consumer.src2 && consumer.src2 === producer.dest) return producer.dest;
  return null;
}

export function simulatePipeline(
  program: ParsedInstruction[],
  config: PipelineConfig,
): PipelineSimulationResult {
  const checkStructural =
    (config.hazardMode === 'structural' || config.hazardMode === 'all') && config.sharedMemory;
  const checkData = config.hazardMode === 'data' || config.hazardMode === 'all';
  const checkControl = config.hazardMode === 'control' || config.hazardMode === 'all';

  const assumptions = [
    'Simplified 5-stage educational pipeline: IF → ID → EX → MEM → WB (1 clock cycle per stage).',
    config.sharedMemory
      ? 'Shared Memory mode: Single unified memory port causes a Structural Hazard when MEM (LOAD/STORE) and IF occur in the same cycle.'
      : 'Separate Instruction & Data Memories: Harvard-style split caches eliminate IF vs MEM structural conflicts.',
    config.forwarding
      ? 'Forwarding ON: EX→EX and MEM→EX bypass paths forward ALU results immediately; LOAD→Use still needs 1 stall cycle.'
      : 'Forwarding OFF: Split-cycle register file (write first half of WB, read second half of ID); dependent ID stalls while producer is in EX or MEM.',
    `Branch assumption: Conditional branches evaluate at ${config.branchResolutionStage} stage (${config.branchOutcome === 'taken' ? 'Branch Taken' : 'Branch Not Taken'}).`,
  ];

  if (program.length === 0) {
    const zeroSnap: PipelineCycleSnapshot = {
      cycle: 0,
      pc: '0x100',
      stages: { IF: emptySlot(), ID: emptySlot(), EX: emptySlot(), MEM: emptySlot(), WB: emptySlot() },
      instructionStatus: {},
      structuralConflict: null,
      dataHazards: [],
      controlHazard: null,
      stallsSoFar: 0,
      flushesSoFar: 0,
      completedSoFar: 0,
      events: ['No instructions loaded.'],
    };
    return {
      program,
      config,
      cycles: [zeroSnap],
      timingRows: [],
      metrics: {
        totalInstructions: 0,
        completedInstructions: 0,
        totalCycles: 0,
        stallCycles: 0,
        flushedInstructions: 0,
        cpi: 0,
      },
      assumptions,
    };
  }

  const instMap = new Map<string, ParsedInstruction>();
  for (const inst of program) instMap.set(inst.id, inst);

  const initialStatus: Record<string, { status: InstructionLifecycle; stage: StageName | null }> = {};
  for (const inst of program) {
    initialStatus[inst.id] = { status: 'waiting', stage: null };
  }

  const cycles: PipelineCycleSnapshot[] = [
    {
      cycle: 0,
      pc: program[0].pc,
      stages: { IF: emptySlot(), ID: emptySlot(), EX: emptySlot(), MEM: emptySlot(), WB: emptySlot() },
      instructionStatus: initialStatus,
      structuralConflict: null,
      dataHazards: [],
      controlHazard: null,
      stallsSoFar: 0,
      flushesSoFar: 0,
      completedSoFar: 0,
      events: [`Ready to simulate ${program.length} instructions starting at PC ${program[0].pc}.`],
    },
  ];

  // Track timing diagram cell per instruction per 1-indexed cycle
  const timingMap: Record<string, TimingCellState[]> = {};
  const finalStatusMap: Record<string, 'completed' | 'flushed'> = {};
  for (const inst of program) {
    timingMap[inst.id] = [];
    finalStatusMap[inst.id] = 'completed';
  }

  let fetchIdx = 0;
  let stallsSoFar = 0;
  let flushesSoFar = 0;
  let completedSoFar = 0;

  let prevStages: Record<StageName, StageSlotState> = {
    IF: emptySlot(),
    ID: emptySlot(),
    EX: emptySlot(),
    MEM: emptySlot(),
    WB: emptySlot(),
  };

  const completedIds = new Set<string>();
  const flushedIds = new Set<string>();
  let pendingBranchRedirect: {
    branchId: string;
    targetIdx: number;
    targetId: string | null;
    targetPc: string | null;
    resolvedAtStage: 'EX' | 'ID';
    flushStages: ('IF' | 'ID')[];
  } | null = null;

  const MAX_CYCLES = 48;

  for (let c = 1; c <= MAX_CYCLES; c++) {
    const events: string[] = [];
    let structuralConflict: StructuralConflictInfo | null = null;
    const dataHazards: DataHazardInfo[] = [];
    let controlHazard: ControlHazardInfo | null = null;

    // 1. Retire instruction from previous WB
    if (prevStages.WB.kind === 'instruction' && prevStages.WB.instId) {
      completedIds.add(prevStages.WB.instId);
      completedSoFar = completedIds.size;
      events.push(`${prevStages.WB.instId} completed Write Back (WB) and committed.`);
    }

    // 2. Advance MEM -> WB and EX -> MEM
    const nextWB: StageSlotState =
      prevStages.MEM.kind === 'instruction' && prevStages.MEM.instId
        ? instSlot(instMap.get(prevStages.MEM.instId)!, 'Writing result to register file')
        : prevStages.MEM.kind === 'bubble'
          ? bubbleSlot('Pipeline bubble')
          : emptySlot();

    const nextMEM: StageSlotState =
      prevStages.EX.kind === 'instruction' && prevStages.EX.instId
        ? (() => {
            const inst = instMap.get(prevStages.EX.instId)!;
            return instSlot(
              inst,
              inst.isLoad
                ? 'Reading operand from Data Memory'
                : inst.isStore
                  ? 'Writing operand to Data Memory'
                  : 'Passing ALU result through MEM',
            );
          })()
        : prevStages.EX.kind === 'bubble'
          ? bubbleSlot('Pipeline bubble')
          : emptySlot();

    let nextEX: StageSlotState = emptySlot();
    let nextID: StageSlotState = emptySlot();
    let nextIF: StageSlotState = emptySlot();

    // 3. Check pending branch redirect from previous cycle
    if (pendingBranchRedirect) {
      const flushedThisCycle: string[] = [];
      for (const stg of pendingBranchRedirect.flushStages) {
        const slot = prevStages[stg];
        if ((slot.kind === 'instruction' || slot.kind === 'stalled') && slot.instId) {
          flushedIds.add(slot.instId);
          finalStatusMap[slot.instId] = 'flushed';
          flushedThisCycle.push(slot.instId);
          timingMap[slot.instId][c - 1] = 'FLUSH';
        }
      }
      flushedThisCycle.sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
      flushesSoFar = flushedIds.size;

      if (pendingBranchRedirect.resolvedAtStage === 'EX') {
        nextEX = bubbleSlot('Flushed wrong-path slot');
        nextID = bubbleSlot('Flushed wrong-path slot');
      } else {
        nextEX =
          prevStages.ID.kind === 'instruction' && prevStages.ID.instId
            ? instSlot(instMap.get(prevStages.ID.instId)!, 'Branch resolved in ID')
            : emptySlot();
        nextID = bubbleSlot('Flushed wrong-path slot');
      }

      fetchIdx = pendingBranchRedirect.targetIdx;
      const targetInst = fetchIdx < program.length ? program[fetchIdx] : null;
      if (targetInst) {
        nextIF = instSlot(targetInst, `Fetched from redirected PC ${targetInst.pc}`);
        fetchIdx += 1;
      } else {
        nextIF = emptySlot();
      }

      controlHazard = {
        branchId: pendingBranchRedirect.branchId,
        outcome: 'taken',
        resolvedAtStage: pendingBranchRedirect.resolvedAtStage,
        targetId: pendingBranchRedirect.targetId,
        targetPc: pendingBranchRedirect.targetPc,
        flushedIds: flushedThisCycle,
        message: `Branch ${pendingBranchRedirect.branchId} Taken: flushed ${flushedThisCycle.join(', ') || 'wrong path'} and redirected PC to ${pendingBranchRedirect.targetPc ?? 'end'}.`,
      };
      events.push(controlHazard.message);
      pendingBranchRedirect = null;
    } else {
      // 4. Normal pipeline advancement: check Data Hazards on prevStages.ID
      const idInst =
        (prevStages.ID.kind === 'instruction' || prevStages.ID.kind === 'stalled') && prevStages.ID.instId
          ? instMap.get(prevStages.ID.instId)!
          : null;
      const exInst =
        prevStages.EX.kind === 'instruction' && prevStages.EX.instId
          ? instMap.get(prevStages.EX.instId)!
          : null;
      const memInst =
        prevStages.MEM.kind === 'instruction' && prevStages.MEM.instId
          ? instMap.get(prevStages.MEM.instId)!
          : null;

      let dataStallNeeded = false;

      if (checkData && idInst) {
        const regFromEx = findMatchingReg(idInst, exInst);
        const regFromMem = findMatchingReg(idInst, memInst);

        if (config.forwarding) {
          if (regFromEx && exInst) {
            if (exInst.isLoad) {
              // Load-Use hazard: cannot forward until after MEM
              dataStallNeeded = true;
              dataHazards.push({
                producerId: exInst.id,
                consumerId: idInst.id,
                reg: regFromEx,
                type: 'RAW',
                resolvedBy: 'stall',
                causedStall: true,
                message: `Load-Use RAW Hazard on ${regFromEx}: ${idInst.id} must stall 1 cycle until ${exInst.id} finishes MEM.`,
              });
            } else {
              dataHazards.push({
                producerId: exInst.id,
                consumerId: idInst.id,
                reg: regFromEx,
                type: 'RAW',
                resolvedBy: 'EX->EX',
                causedStall: false,
                message: `RAW Dependency on ${regFromEx} (${exInst.id} → ${idInst.id}): resolved via EX→EX forwarding (0 stalls).`,
              });
            }
          } else if (regFromMem && memInst) {
            dataHazards.push({
              producerId: memInst.id,
              consumerId: idInst.id,
              reg: regFromMem,
              type: 'RAW',
              resolvedBy: 'MEM->EX',
              causedStall: false,
              message: `RAW Dependency on ${regFromMem} (${memInst.id} → ${idInst.id}): resolved via MEM→EX forwarding (0 stalls).`,
            });
          }
        } else {
          // Forwarding OFF: stall if producer is in EX or MEM
          if (regFromEx && exInst) {
            dataStallNeeded = true;
            dataHazards.push({
              producerId: exInst.id,
              consumerId: idInst.id,
              reg: regFromEx,
              type: 'RAW',
              resolvedBy: 'stall',
              causedStall: true,
              message: `RAW Hazard on ${regFromEx}: ${idInst.id} stalls because ${exInst.id} is still in EX (forwarding disabled).`,
            });
          } else if (regFromMem && memInst) {
            dataStallNeeded = true;
            dataHazards.push({
              producerId: memInst.id,
              consumerId: idInst.id,
              reg: regFromMem,
              type: 'RAW',
              resolvedBy: 'stall',
              causedStall: true,
              message: `RAW Hazard on ${regFromMem}: ${idInst.id} stalls while ${memInst.id} finishes MEM (writes ${regFromMem} in WB).`,
            });
          }
        }
      }

      if (dataStallNeeded && idInst) {
        stallsSoFar += 1;
        nextEX = bubbleSlot(`Bubble inserted for ${idInst.id} RAW stall`);
        nextID = stalledSlot(idInst, dataHazards[0]?.message ?? `Stalled in ID`);
        if ((prevStages.IF.kind === 'instruction' || prevStages.IF.kind === 'stalled') && prevStages.IF.instId) {
          const ifInst = instMap.get(prevStages.IF.instId)!;
          nextIF = stalledSlot(ifInst, `Frozen in IF due to ${idInst.id} stall`);
        } else {
          nextIF = emptySlot();
        }
        events.push(dataHazards[0]?.message ?? `${idInst.id} stalled due to data hazard.`);
      } else {
        // ID advances to EX, IF advances to ID
        nextEX = idInst
          ? instSlot(
              idInst,
              dataHazards.length > 0
                ? dataHazards[0].message
                : idInst.isBranch
                  ? 'Evaluating branch condition'
                  : 'Executing ALU operation',
            )
          : prevStages.ID.kind === 'bubble'
            ? bubbleSlot('Pipeline bubble')
            : emptySlot();

        const ifInst =
          (prevStages.IF.kind === 'instruction' || prevStages.IF.kind === 'stalled') && prevStages.IF.instId
            ? instMap.get(prevStages.IF.instId)!
            : null;
        nextID = ifInst
          ? instSlot(ifInst, 'Decoding instruction & reading registers')
          : prevStages.IF.kind === 'bubble'
            ? bubbleSlot('Pipeline bubble')
            : emptySlot();

        // Check Structural Hazard: nextMEM accessing memory AND an instruction waiting to fetch in IF
        const memSlotInst =
          nextMEM.kind === 'instruction' && nextMEM.instId ? instMap.get(nextMEM.instId)! : null;
        const memUsesSharedPort = Boolean(memSlotInst && (memSlotInst.isLoad || memSlotInst.isStore));
        const candidateFetchInst = fetchIdx < program.length ? program[fetchIdx] : null;

        if (checkStructural && memUsesSharedPort && memSlotInst && candidateFetchInst) {
          stallsSoFar += 1;
          nextIF = bubbleSlot(`Stalled ${candidateFetchInst.id}: Shared Memory busy with ${memSlotInst.id}`);
          structuralConflict = {
            memInstId: memSlotInst.id,
            ifInstId: candidateFetchInst.id,
            message: `Structural Hazard at C${c}: ${memSlotInst.id} (MEM) and ${candidateFetchInst.id} (IF) compete for Shared Memory. ${candidateFetchInst.id} stalled.`,
          };
          timingMap[candidateFetchInst.id][c - 1] = 'STALL';
          events.push(structuralConflict.message);
        } else if (candidateFetchInst) {
          nextIF = instSlot(candidateFetchInst, `Fetched from PC ${candidateFetchInst.pc}`);
          fetchIdx += 1;
        } else {
          nextIF = emptySlot();
        }
      }

      // 5. Evaluate Branch if active in its resolution stage during this cycle
      if (checkControl) {
        const resStage = config.branchResolutionStage;
        const activeBranchSlot = resStage === 'EX' ? nextEX : nextID;
        if (activeBranchSlot.kind === 'instruction' && activeBranchSlot.instId) {
          const branchInst = instMap.get(activeBranchSlot.instId)!;
          if (branchInst.isBranch) {
            const targetIdx = branchInst.targetLabel
              ? program.findIndex((ins) => ins.label === branchInst.targetLabel)
              : -1;
            const resolvedTargetIdx = targetIdx >= 0 ? targetIdx : program.length;
            const targetInst = resolvedTargetIdx < program.length ? program[resolvedTargetIdx] : null;

            if (config.branchOutcome === 'taken') {
              pendingBranchRedirect = {
                branchId: branchInst.id,
                targetIdx: resolvedTargetIdx,
                targetId: targetInst ? targetInst.id : null,
                targetPc: targetInst ? targetInst.pc : null,
                resolvedAtStage: resStage,
                flushStages: resStage === 'EX' ? ['IF', 'ID'] : ['IF'],
              };
              controlHazard = {
                branchId: branchInst.id,
                outcome: 'taken',
                resolvedAtStage: resStage,
                targetId: targetInst ? targetInst.id : null,
                targetPc: targetInst ? targetInst.pc : null,
                flushedIds: [],
                message: `${branchInst.id} evaluated in ${resStage}: Branch TAKEN → jumping to ${targetInst ? `${targetInst.id} (${targetInst.pc})` : 'end'} next cycle.`,
              };
              events.push(controlHazard.message);
            } else {
              controlHazard = {
                branchId: branchInst.id,
                outcome: 'not-taken',
                resolvedAtStage: resStage,
                targetId: targetInst ? targetInst.id : null,
                targetPc: targetInst ? targetInst.pc : null,
                flushedIds: [],
                message: `${branchInst.id} evaluated in ${resStage}: Branch NOT TAKEN → sequential path continues with 0 flushes.`,
              };
              events.push(controlHazard.message);
            }
          }
        }
      }
    }

    const stages: Record<StageName, StageSlotState> = {
      IF: nextIF,
      ID: nextID,
      EX: nextEX,
      MEM: nextMEM,
      WB: nextWB,
    };

    // Record timing diagram cells for active/stalled instructions in stages
    const stageOrder: StageName[] = ['IF', 'ID', 'EX', 'MEM', 'WB'];
    for (const stg of stageOrder) {
      const slot = stages[stg];
      if (slot.kind === 'instruction' && slot.instId) {
        timingMap[slot.instId][c - 1] = stg;
      } else if (slot.kind === 'stalled' && slot.instId) {
        timingMap[slot.instId][c - 1] = 'STALL';
      }
    }

    // Build per-instruction lifecycle snapshot
    const instructionStatus: Record<string, { status: InstructionLifecycle; stage: StageName | null }> = {};
    for (const inst of program) {
      if (completedIds.has(inst.id)) {
        instructionStatus[inst.id] = { status: 'completed', stage: null };
      } else if (flushedIds.has(inst.id)) {
        instructionStatus[inst.id] = { status: 'flushed', stage: null };
      } else {
        let foundStage: StageName | null = null;
        let isStalledHere = false;
        for (const stg of stageOrder) {
          if (stages[stg].instId === inst.id) {
            foundStage = stg;
            isStalledHere = stages[stg].kind === 'stalled';
            break;
          }
        }
        if (foundStage) {
          instructionStatus[inst.id] = {
            status: isStalledHere ? 'stalled' : 'active',
            stage: foundStage,
          };
        } else if (structuralConflict?.ifInstId === inst.id) {
          instructionStatus[inst.id] = { status: 'stalled', stage: null };
        } else {
          instructionStatus[inst.id] = { status: 'waiting', stage: null };
        }
      }
    }

    const activePc =
      nextIF.pc ?? (fetchIdx < program.length ? program[fetchIdx].pc : program[program.length - 1].pc);

    if (events.length === 0) {
      const activeNames = stageOrder
        .filter((s) => stages[s].kind === 'instruction' && stages[s].instId)
        .map((s) => `${s}:${stages[s].instId}`);
      events.push(
        activeNames.length > 0
          ? `Pipeline active [${activeNames.join(' | ')}].`
          : 'Draining remaining pipeline stages.',
      );
    }

    cycles.push({
      cycle: c,
      pc: activePc,
      stages,
      instructionStatus,
      structuralConflict,
      dataHazards,
      controlHazard,
      stallsSoFar,
      flushesSoFar,
      completedSoFar,
      events,
    });

    prevStages = stages;

    const pipelineEmpty = stageOrder.every(
      (s) => stages[s].kind === 'empty' || stages[s].kind === 'bubble',
    );
    if (pipelineEmpty && fetchIdx >= program.length && !pendingBranchRedirect) {
      // Remove trailing empty drain cycle so totalCycles matches exact WB completion cycle
      cycles.pop();
      break;
    }

    // Also stop immediately once all instructions are either completed or flushed and no active instruction remains
    const allRetired = program.every(
      (inst) => completedIds.has(inst.id) || flushedIds.has(inst.id),
    );
    const anyInstructionInPipeline = stageOrder.some((s) => stages[s].kind === 'instruction');
    if (allRetired && !anyInstructionInPipeline) {
      break;
    }
  }

  const totalCycles = Math.max(0, cycles.length - 1);
  const completedInstructions = completedIds.size;
  const cpi = completedInstructions > 0 ? Number((totalCycles / completedInstructions).toFixed(2)) : 0;

  const timingRows: TimingDiagramRow[] = program.map((inst) => {
    const rowCells: TimingCellState[] = [];
    for (let c = 0; c < totalCycles; c++) {
      rowCells.push(timingMap[inst.id][c] ?? '');
    }
    return {
      instId: inst.id,
      displayText: inst.displayText,
      pc: inst.pc,
      cells: rowCells,
      finalStatus: finalStatusMap[inst.id],
    };
  });

  return {
    program,
    config,
    cycles,
    timingRows,
    metrics: {
      totalInstructions: program.length,
      completedInstructions,
      totalCycles,
      stallCycles: stallsSoFar,
      flushedInstructions: flushesSoFar,
      cpi,
    },
    assumptions,
  };
}

export function comparePipelineScenarios(
  program: ParsedInstruction[],
  mode: 'structural' | 'data' | 'control' | 'all',
): ScenarioComparison {
  const ideal = simulatePipeline(program, {
    hazardMode: 'ideal',
    sharedMemory: false,
    forwarding: true,
    branchOutcome: 'not-taken',
    branchResolutionStage: 'EX',
  });

  if (mode === 'structural') {
    const withHazards = simulatePipeline(program, {
      hazardMode: 'structural',
      sharedMemory: true,
      forwarding: true,
      branchOutcome: 'not-taken',
      branchResolutionStage: 'EX',
    });
    const withHandling = simulatePipeline(program, {
      hazardMode: 'structural',
      sharedMemory: false,
      forwarding: true,
      branchOutcome: 'not-taken',
      branchResolutionStage: 'EX',
    });
    return { ideal, withHazards, withHandling };
  }

  if (mode === 'data') {
    const withHazards = simulatePipeline(program, {
      hazardMode: 'data',
      sharedMemory: false,
      forwarding: false,
      branchOutcome: 'not-taken',
      branchResolutionStage: 'EX',
    });
    const withHandling = simulatePipeline(program, {
      hazardMode: 'data',
      sharedMemory: false,
      forwarding: true,
      branchOutcome: 'not-taken',
      branchResolutionStage: 'EX',
    });
    return { ideal, withHazards, withHandling };
  }

  if (mode === 'control') {
    const withHazards = simulatePipeline(program, {
      hazardMode: 'control',
      sharedMemory: false,
      forwarding: true,
      branchOutcome: 'taken',
      branchResolutionStage: 'EX',
    });
    const withHandling = simulatePipeline(program, {
      hazardMode: 'control',
      sharedMemory: false,
      forwarding: true,
      branchOutcome: 'taken',
      branchResolutionStage: 'ID',
    });
    return { ideal, withHazards, withHandling };
  }

  // 'all' playground comparison
  const withHazards = simulatePipeline(program, {
    hazardMode: 'all',
    sharedMemory: true,
    forwarding: false,
    branchOutcome: 'taken',
    branchResolutionStage: 'EX',
  });
  const withHandling = simulatePipeline(program, {
    hazardMode: 'all',
    sharedMemory: false,
    forwarding: true,
    branchOutcome: 'taken',
    branchResolutionStage: 'ID',
  });
  return { ideal, withHazards, withHandling };
}
