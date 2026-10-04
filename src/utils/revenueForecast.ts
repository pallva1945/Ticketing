/** Compare a full-season revenue forecast with the same full-season budget. */
export function compareRevenueForecast(projected: number, target: number, available = true) {
  if (!available || !Number.isFinite(projected) || !Number.isFinite(target) || target <= 0) {
    return { available: false, difference: null, percent: null, onTarget: false };
  }
  const difference = projected - target;
  return { available: true, difference, percent: difference / target * 100, onTarget: difference >= 0 };
}