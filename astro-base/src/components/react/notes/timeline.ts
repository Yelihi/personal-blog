export const SLOT = 220;
export const BATCH = 10;
export const PATTERNS = [
  [7, 19, 9, 31],
  [27, 24, 40, 38],
  [1, 21, 3, 34],
  [34, 18, 55, 28],
  [16, 25, 20, 40],
  [39, 19, 48, 32],
] as const;
export const clamp = (value: number, low: number, high: number) =>
  Math.min(high, Math.max(low, value));
export function calculateTimelineFrame(m: {
  scrollTop: number;
  viewportHeight: number;
  fullScrollHeight: number;
  firstCenter: number;
  markerOffset: number;
  total: number;
  previousIndex?: number;
}) {
  const range = Math.max(0, m.fullScrollHeight - m.viewportHeight);
  const progress =
    range === 0
      ? 0
      : range - m.scrollTop <= 1
        ? 1
        : clamp(m.scrollTop / range, 0, 1);
  if (m.total === 0)
    return { progress: 0, selectedIndex: null, requiredCount: 0 };
  const position = (m.scrollTop + m.markerOffset - m.firstCenter) / SLOT;
  const nearest = clamp(Math.round(position), 0, m.total - 1);
  const previous = m.previousIndex ?? nearest;
  const selectedIndex =
    Math.abs(position - previous) === Math.abs(position - nearest)
      ? previous
      : nearest;
  const lastVisible = Math.max(
    selectedIndex + 2,
    Math.ceil((m.scrollTop + m.viewportHeight - m.firstCenter) / SLOT) + 2
  );
  return {
    progress,
    selectedIndex,
    requiredCount: Math.min(
      m.total,
      Math.max(BATCH, Math.ceil((lastVisible + 1) / BATCH) * BATCH)
    ),
  };
}
