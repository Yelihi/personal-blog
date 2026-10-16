import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { NoteIndex } from './interface';
import { BATCH, SLOT, calculateTimelineFrame, clamp } from './timeline';
import { readReturnPosition, saveReturnPosition } from './returnPosition';
import type { NoteReturnPosition } from './returnPosition';

export function useNoteTimeline(
  index: NoteIndex,
  scrollRef: RefObject<HTMLDivElement | null>,
  listRef: RefObject<HTMLOListElement | null>,
  progressRef: RefObject<HTMLSpanElement | null>
) {
  const [selectedId, setSelectedId] = useState(index.notes[0]?.id ?? null);
  const [revealedCount, setRevealedCount] = useState(index.notes.length);
  const [enhanced, setEnhanced] = useState(false);
  const save = useRef(() => {});
  const focus = useRef((_id: string) => {});
  const selected = useRef(0);
  const count = useRef(index.notes.length);
  count.current = revealedCount;
  useEffect(() => {
    const scroller = scrollRef.current;
    const list = listRef.current;
    if (!scroller || !list) return;
    const mobile = matchMedia('(max-width: 760px)');
    let frame = 0;
    let disposed = false;
    let entry = '';
    let snapshot: NoteReturnPosition | null = null;
    try {
      const state = history.state ?? {};
      entry =
        typeof state.notesEntryId === 'string'
          ? state.notesEntryId
          : crypto.randomUUID();
      if (state.notesEntryId) snapshot = readReturnPosition(entry);
      history.replaceState({ ...state, notesEntryId: entry }, '');
    } catch {
      /* Navigation remains available if storage or history is blocked. */
    }
    const mode = () =>
      mobile.matches ? ('mobile' as const) : ('desktop' as const);
    const root = () => (mobile.matches ? document.documentElement : scroller);
    const top = () => (mobile.matches ? window.scrollY : scroller.scrollTop);
    const height = () =>
      mobile.matches ? window.innerHeight : scroller.clientHeight;
    const marker = () =>
      mobile.matches ? window.innerHeight / 2 : scroller.clientHeight / 2;
    const firstCenter = () => {
      const listRect = list.getBoundingClientRect();
      return (
        listRect.top +
        top() -
        (mobile.matches ? 0 : scroller.getBoundingClientRect().top) +
        parseFloat(getComputedStyle(list).paddingTop) +
        SLOT / 2
      );
    };
    const scrollTo = (value: number) => {
      const y = clamp(value, 0, Math.max(0, root().scrollHeight - height()));
      if (mobile.matches) window.scrollTo({ top: y, behavior: 'instant' });
      else scroller.scrollTop = y;
    };
    let savedAnchor: NoteReturnPosition | null = null;
    function flush() {
      frame = 0;
      if (disposed) return;
      const result = calculateTimelineFrame({
        scrollTop: top(),
        viewportHeight: height(),
        fullScrollHeight: root().scrollHeight,
        firstCenter: firstCenter(),
        markerOffset: marker(),
        total: index.notes.length,
        previousIndex: selected.current,
      });
      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${result.progress})`;
        progressRef.current.dataset.progress = String(result.progress);
      }
      if (result.selectedIndex !== null) {
        selected.current = result.selectedIndex;
        setSelectedId(index.notes[result.selectedIndex].id);
      }
      setRevealedCount((n) => Math.max(n, result.requiredCount));
      savedAnchor = makeSnapshot();
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(flush);
    }
    const makeSnapshot = (): NoteReturnPosition => ({
      version: 1,
      revision: index.revision,
      selectedId: index.notes[selected.current]?.id ?? null,
      scrollTop: top(),
      anchorOffset: firstCenter() + selected.current * SLOT - top() - marker(),
      mode: mode(),
      viewportWidth: innerWidth,
      revealedCount: count.current,
      focusedNoteId:
        (document.activeElement as HTMLElement | null)?.dataset.noteId ?? null,
    });
    save.current = () => {
      if (entry) saveReturnPosition(entry, makeSnapshot());
    };
    focus.current = (id) => {
      const i = index.notes.findIndex((n) => n.id === id);
      if (i < 0) return;
      selected.current = i;
      setSelectedId(id);
      scrollTo(firstCenter() + i * SLOT - marker());
      schedule();
    };
    if (!snapshot) scrollTo(0);
    const restore = (p: NoteReturnPosition, keepAnchor = false) => {
      const i = index.notes.findIndex((n) => n.id === p.selectedId);
      selected.current = Math.max(0, i);
      const y =
        !keepAnchor &&
        p.mode === mode() &&
        p.viewportWidth === innerWidth &&
        p.revision === index.revision
          ? p.scrollTop
          : i >= 0
            ? firstCenter() + i * SLOT - marker() - p.anchorOffset
            : p.scrollTop;
      scrollTo(y);
    };
    // All slots are present on the server; replacing the tail keeps identical geometry.
    const initial = calculateTimelineFrame({
      scrollTop: snapshot?.scrollTop ?? top(),
      viewportHeight: height(),
      fullScrollHeight: root().scrollHeight,
      firstCenter: firstCenter(),
      markerOffset: marker(),
      total: index.notes.length,
    });
    const focusedIndex = index.notes.findIndex(
      (n) => n.id === (document.activeElement as HTMLElement)?.dataset.noteId
    );
    setRevealedCount(
      Math.min(
        index.notes.length,
        Math.max(
          BATCH,
          initial.requiredCount,
          snapshot?.revealedCount ?? 0,
          focusedIndex + 1
        )
      )
    );
    if (snapshot) {
      restore(snapshot);
      if (snapshot.focusedNoteId)
        list
          .querySelector<HTMLAnchorElement>(
            `a[data-note-id="${CSS.escape(snapshot.focusedNoteId)}"]`
          )
          ?.focus({ preventScroll: true });
      restore(snapshot);
    }
    setEnhanced(true);
    flush();
    let oldWidth = innerWidth;
    let oldHeight = innerHeight;
    savedAnchor = makeSnapshot();
    const resize = () => {
      if (oldWidth === innerWidth && oldHeight === innerHeight) return;
      if (savedAnchor) restore(savedAnchor, true);
      oldWidth = innerWidth;
      oldHeight = innerHeight;
      schedule();
    };
    const onScroll = () => {
      schedule();
    };
    const pagehide = () => {
      save.current();
      cancelAnimationFrame(frame);
      frame = 0;
    };
    const pageshow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        history.scrollRestoration = 'manual';
        schedule();
      }
    };
    const observer = new ResizeObserver(resize);
    observer.observe(scroller);
    scroller.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', resize);
    window.addEventListener('pagehide', pagehide);
    window.addEventListener('pageshow', pageshow);
    mobile.addEventListener('change', resize);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      scroller.removeEventListener('scroll', onScroll);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pagehide', pagehide);
      window.removeEventListener('pageshow', pageshow);
      mobile.removeEventListener('change', resize);
      save.current = () => {};
      focus.current = () => {};
    };
  }, [index, scrollRef, listRef, progressRef]);
  return {
    selectedId,
    revealedCount,
    enhanced,
    onBeforeNavigate: () => save.current(),
    onNoteFocus: (id: string) => focus.current(id),
    onRevealMore: () =>
      setRevealedCount((n) => Math.min(index.notes.length, n + BATCH)),
  };
}
