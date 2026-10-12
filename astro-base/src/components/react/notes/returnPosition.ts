export interface NoteReturnPosition {
  version: 1;
  revision: string;
  selectedId: string | null;
  scrollTop: number;
  anchorOffset: number;
  mode: 'desktop' | 'mobile';
  viewportWidth: number;
  revealedCount: number;
  focusedNoteId: string | null;
}
export function parsePosition(raw: string | null): NoteReturnPosition | null {
  try {
    const p = JSON.parse(raw ?? 'null');
    if (
      !p ||
      p.version !== 1 ||
      typeof p.revision !== 'string' ||
      !['desktop', 'mobile'].includes(p.mode)
    )
      return null;
    if (
      ![p.scrollTop, p.viewportWidth, p.revealedCount].every(
        (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0
      )
    )
      return null;
    if (
      !Number.isFinite(p.anchorOffset) ||
      Math.abs(p.anchorOffset) > 100000 ||
      !Number.isInteger(p.revealedCount)
    )
      return null;
    if (
      ![p.selectedId, p.focusedNoteId].every(
        (v) => v === null || typeof v === 'string'
      )
    )
      return null;
    return p;
  } catch {
    return null;
  }
}
export function readReturnPosition(entry: string): NoteReturnPosition | null {
  try {
    return parsePosition(sessionStorage.getItem(`notes:return:v1:${entry}`));
  } catch {
    return null;
  }
}
export function saveReturnPosition(
  entry: string,
  position: NoteReturnPosition
): boolean {
  try {
    sessionStorage.setItem(
      `notes:return:v1:${entry}`,
      JSON.stringify(position)
    );
    return true;
  } catch {
    return false;
  }
}
