import type { CSSProperties, RefObject } from 'react';
import type { NoteIndex } from './interface';
import NoteCover from './NoteCover';
import { PATTERNS, SLOT } from './timeline';
interface Props {
  index: NoteIndex;
  selectedId: string | null;
  revealedCount: number;
  listRef: RefObject<HTMLOListElement | null>;
  onBeforeNavigate: () => void;
  onNoteFocus: (id: string) => void;
}
export default function NoteTimeline({
  index,
  selectedId,
  revealedCount,
  listRef,
  onBeforeNavigate,
  onNoteFocus,
}: Props) {
  return (
    <ol ref={listRef} className="note-entries" aria-label="최신순 생각 노트">
      {index.notes.slice(0, revealedCount).map((note, i) => {
        const [x, w, mx, mw] = PATTERNS[i % PATTERNS.length];
        return (
          <li
            key={note.id}
            className={`note-entry ${selectedId === note.id ? 'is-selected' : ''}`}
            style={
              {
                '--x': `${x}%`,
                '--w': `${w}%`,
                '--mobile-x': `${mx}%`,
                '--mobile-w': `${mw}%`,
              } as CSSProperties
            }
          >
            <div className="note-entry-photo">
              <NoteCover
                image={note.cover}
                fallback={index.fallbackCover}
                href={note.href}
                label={`${note.dateLabel} · ${note.title} · 상세 읽기`}
                noteId={note.id}
                thumbnail
                priority={i < 3}
                selected={selectedId === note.id}
                onNavigate={onBeforeNavigate}
                onFocus={() => onNoteFocus(note.id)}
              />
              <span className="note-entry-caption">
                <time dateTime={note.dateISO}>{note.dateLabel}</time> ·{' '}
                {note.title}
              </span>
            </div>
          </li>
        );
      })}
      {revealedCount < index.notes.length && (
        <li
          className="note-spacer"
          aria-hidden="true"
          style={{ height: (index.notes.length - revealedCount) * SLOT }}
        />
      )}
    </ol>
  );
}
