// remotion/lib/loop.js — varratmentes loop segédfüggvények (plain ESM)
export function loopProgress(frame, period) {
  if (period <= 0) return 0;
  return ((frame % period) + period) % period / period;
}

export function seamlessSine(frame, period, amplitude = 1, phase = 0) {
  return amplitude * Math.sin((frame / period) * Math.PI * 2 + phase);
}

export function pingPong(frame, period) {
  const p = loopProgress(frame, period); // 0..1
  return 1 - Math.abs(p * 2 - 1);
}
