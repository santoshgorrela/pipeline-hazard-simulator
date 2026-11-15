import { useCallback, useEffect, useState } from 'react';

export function usePipelinePlayback(totalCycles: number) {
  const [currentCycle, setCurrentCycle] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(1000);

  useEffect(() => {
    setCurrentCycle((c) => Math.min(c, totalCycles));
  }, [totalCycles]);

  useEffect(() => {
    if (!isPlaying) return;
    if (currentCycle >= totalCycles) {
      setIsPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setCurrentCycle((c) => {
        const next = Math.min(totalCycles, c + 1);
        if (next >= totalCycles) {
          setIsPlaying(false);
        }
        return next;
      });
    }, speedMs);

    return () => window.clearTimeout(timer);
  }, [isPlaying, currentCycle, totalCycles, speedMs]);

  const play = useCallback(() => {
    if (totalCycles <= 0) return;
    if (currentCycle >= totalCycles) {
      setCurrentCycle(0);
    }
    setIsPlaying(true);
  }, [currentCycle, totalCycles]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const step = useCallback(() => {
    setIsPlaying(false);
    setCurrentCycle((c) => Math.min(totalCycles, c + 1));
  }, [totalCycles]);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setCurrentCycle(0);
  }, []);

  return {
    currentCycle,
    isPlaying,
    speedMs,
    setSpeedMs,
    play,
    pause,
    step,
    reset,
    setCurrentCycle,
  };
}
