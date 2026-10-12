import { useRef } from 'react';
import type { NoteIndex } from './interface';
import NoteTimeline from './NoteTimeline';
import NotePreview from './NotePreview';
import EmptyNoteLottie from './EmptyNoteLottie';
import { useNoteTimeline } from './useNoteTimeline';
export default function NotesExplorer({ index }: { index: NoteIndex }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const state = useNoteTimeline(index, scrollRef, listRef, progressRef);
  const note = index.notes.find((n) => n.id === state.selectedId) ?? null;
  const isEmpty = index.notes.length === 0;
  return (
    <main
      className="notes-explorer"
      data-enhanced={state.enhanced}
      data-empty={isEmpty}
    >
      <section className="note-timeline" aria-label="노트 목록">
        <div className="note-timeline-heading">
          <h1>
            NOTES <span>/ 생각의 기록</span>
          </h1>
          <p>완성되지 않은 생각도 남겨두기</p>
        </div>
        <div
          className="note-scroll"
          ref={scrollRef}
          tabIndex={isEmpty ? undefined : 0}
          aria-label="시간순 노트 스크롤"
        >
          {isEmpty ? (
            <div className="notes-empty">
              <EmptyNoteLottie variant="mark" />
              <p className="note-empty-kicker">아직 쓰이지 않은 페이지</p>
              <h2>아직 기록된 노트가 없어요.</h2>
              <p>
                일하며 떠오른 질문과 생각들이
                <br />
                이곳에 하나씩 쌓일 예정입니다.
              </p>
              <a className="note-read" href="/articles">
                먼저 다른 글 읽기 <span aria-hidden="true">↗</span>
              </a>
            </div>
          ) : (
            <NoteTimeline
              index={index}
              selectedId={state.selectedId}
              revealedCount={state.revealedCount}
              listRef={listRef}
              onBeforeNavigate={state.onBeforeNavigate}
              onNoteFocus={state.onNoteFocus}
            />
          )}
        </div>
        {!isEmpty && (
          <>
            <div className="note-selection-line" aria-hidden="true">
              <span ref={progressRef} />
            </div>
            {note && (
              <div className="note-selected-label">
                <a href={note.href} onClick={state.onBeforeNavigate}>
                  {note.title}
                </a>
                <time dateTime={note.dateISO}>{note.dateLabel}</time>
              </div>
            )}
            <div className="note-timeline-footer">
              <span>
                {String(
                  index.notes.findIndex((n) => n.id === state.selectedId) + 1
                ).padStart(2, '0')}{' '}
                / {index.notes.length}
              </span>
              {state.revealedCount < index.notes.length ? (
                <button onClick={state.onRevealMore}>다음 노트 더 보기</button>
              ) : (
                <span>모든 기록</span>
              )}
            </div>
          </>
        )}
      </section>
      <NotePreview
        note={note}
        fallback={index.fallbackCover}
        onBeforeNavigate={state.onBeforeNavigate}
      />
    </main>
  );
}
