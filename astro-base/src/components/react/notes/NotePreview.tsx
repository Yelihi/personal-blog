import type { NoteImage, NoteSummary } from './interface';
import NoteCover from './NoteCover';
import EmptyNoteLottie from './EmptyNoteLottie';
export default function NotePreview({
  note,
  fallback,
  onBeforeNavigate,
}: {
  note: NoteSummary | null;
  fallback: NoteImage | null;
  onBeforeNavigate: () => void;
}) {
  if (!note)
    return (
      <aside
        className="note-preview note-preview-empty"
        aria-label="노트 미리보기"
      >
        <div className="note-preview-meta">
          <span>THOUGHT NOTES</span>
          <span>미리보기</span>
        </div>
        <div className="note-preview-empty-content">
          <div className="note-preview-empty-paper">
            <EmptyNoteLottie variant="preview" />
          </div>
          <h2>생각을 펼쳐 볼 자리</h2>
          <p>
            왼쪽에 노트가 쌓이면,
            <br />
            이곳에서 제목과 사진을 먼저 만날 수 있어요.
          </p>
        </div>
      </aside>
    );
  return (
    <aside className="note-preview" aria-label="선택한 노트 미리보기">
      <div className="note-preview-meta">
        <span>THOUGHT NOTES</span>
        <time dateTime={note.dateISO}>{note.dateLabel}</time>
      </div>
      <h2>
        <a href={note.href} onClick={onBeforeNavigate}>
          {note.title}
        </a>
      </h2>
      <NoteCover
        image={note.cover}
        fallback={fallback}
        href={note.href}
        label={`${note.title} 상세 읽기`}
        priority
        onNavigate={onBeforeNavigate}
      />
      <div className="note-excerpt">
        <p>{note.excerpt}</p>
      </div>
      <a className="note-read" href={note.href} onClick={onBeforeNavigate}>
        이어서 읽기 <span aria-hidden="true">↗</span>
      </a>
    </aside>
  );
}
