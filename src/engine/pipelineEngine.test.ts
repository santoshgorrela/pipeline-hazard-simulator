import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PRESET_PROGRAMS,
  comparePipelineScenarios,
  parseProgram,
  simulatePipeline,
} from './pipelineEngine';

test('parseProgram extracts registers, loads, stores, and branch labels accurately', () => {
  const prog = parseProgram(PRESET_PROGRAMS.playground.source);
  assert.equal(prog.length, 5);
  assert.equal(prog[0].dest, 'R1');
  assert.equal(prog[0].src1, 'R2');
  assert.equal(prog[0].src2, 'R3');
  assert.equal(prog[2].isLoad, true);
  assert.equal(prog[2].dest, 'R6');
  assert.equal(prog[2].src1, 'R7');
  assert.equal(prog[4].isStore, true);
  assert.equal(prog[4].src1, 'R8');
  assert.equal(prog[4].src2, 'R7');
});

test('Structural Hazard: shared memory triggers conflict at C4 and increases cycles by 1', () => {
  const prog = parseProgram(PRESET_PROGRAMS.structural.source);
  const shared = simulatePipeline(prog, {
    hazardMode: 'structural',
    sharedMemory: true,
    forwarding: true,
    branchOutcome: 'not-taken',
    branchResolutionStage: 'EX',
  });
  const split = simulatePipeline(prog, {
    hazardMode: 'structural',
    sharedMemory: false,
    forwarding: true,
    branchOutcome: 'not-taken',
    branchResolutionStage: 'EX',
  });

  assert.equal(split.metrics.stallCycles, 0);
  assert.equal(split.metrics.totalCycles, 9);
  assert.equal(shared.metrics.stallCycles, 1);
  assert.equal(shared.metrics.totalCycles, 10);
  assert.equal(shared.cycles[4].structuralConflict?.memInstId, 'I1');
  assert.equal(shared.cycles[4].structuralConflict?.ifInstId, 'I4');
  assert.equal(shared.timingRows[3].cells[3], 'STALL');
});

test('Data Hazard: ADD->SUB stalls 2 cycles without forwarding and 0 cycles with forwarding', () => {
  const prog = parseProgram('I1: ADD R1, R2, R3\nI2: SUB R4, R1, R5');
  const noFwd = simulatePipeline(prog, {
    hazardMode: 'data',
    sharedMemory: false,
    forwarding: false,
    branchOutcome: 'not-taken',
    branchResolutionStage: 'EX',
  });
  const withFwd = simulatePipeline(prog, {
    hazardMode: 'data',
    sharedMemory: false,
    forwarding: true,
    branchOutcome: 'not-taken',
    branchResolutionStage: 'EX',
  });

  assert.equal(noFwd.metrics.stallCycles, 2);
  assert.equal(noFwd.metrics.totalCycles, 8);
  assert.equal(noFwd.metrics.cpi, 4);

  assert.equal(withFwd.metrics.stallCycles, 0);
  assert.equal(withFwd.metrics.totalCycles, 6);
  assert.equal(withFwd.metrics.cpi, 3);
  assert.equal(withFwd.cycles[4].dataHazards[0].resolvedBy, 'EX->EX');
});

test('Load-Use Data Hazard still requires 1 stall cycle even with forwarding enabled', () => {
  const prog = parseProgram(PRESET_PROGRAMS.dataLoadUse.source);
  const loadUse = simulatePipeline(prog, PRESET_PROGRAMS.dataLoadUse.recommendedConfig);
  assert.equal(loadUse.metrics.stallCycles, 1);
  assert.equal(loadUse.cycles[4].dataHazards[0].causedStall, true);
  assert.equal(loadUse.cycles[4].stages.EX.kind, 'bubble');
});

test('Control Hazard: Branch Taken flushes wrong-path instructions and redirects PC to TARGET', () => {
  const prog = parseProgram(PRESET_PROGRAMS.control.source);
  const taken = simulatePipeline(prog, {
    hazardMode: 'control',
    sharedMemory: false,
    forwarding: true,
    branchOutcome: 'taken',
    branchResolutionStage: 'EX',
  });
  const notTaken = simulatePipeline(prog, {
    hazardMode: 'control',
    sharedMemory: false,
    forwarding: true,
    branchOutcome: 'not-taken',
    branchResolutionStage: 'EX',
  });

  assert.equal(taken.metrics.flushedInstructions, 2);
  assert.equal(taken.metrics.completedInstructions, 3);
  assert.equal(taken.metrics.totalCycles, 9);
  assert.equal(taken.metrics.cpi, 3);
  assert.equal(taken.timingRows[1].finalStatus, 'flushed');
  assert.equal(taken.timingRows[2].finalStatus, 'flushed');
  assert.equal(taken.timingRows[3].cells[3], 'IF'); // TARGET fetched at C4

  assert.equal(notTaken.metrics.flushedInstructions, 0);
  assert.equal(notTaken.metrics.completedInstructions, 5);
  assert.equal(notTaken.metrics.cpi, 1.8);
});

test('comparePipelineScenarios computes accurate CPI differences across all modes', () => {
  const dataProg = parseProgram(PRESET_PROGRAMS.data.source);
  const comp = comparePipelineScenarios(dataProg, 'data');
  assert.ok(comp.withHazards.metrics.totalCycles > comp.withHandling.metrics.totalCycles);
  assert.equal(comp.ideal.metrics.stallCycles, 0);
});
