import { useEffect, useRef, useState } from 'react';
import type { NoteImage } from './interface';
interface Props {
  image: NoteImage;
  fallback: NoteImage | null;
  href?: string;
  label?: string;
  noteId?: string;
  priority?: boolean;
  thumbnail?: boolean;
  selected?: boolean;
  onNavigate?: () => void;
  onFocus?: () => void;
}
export default function NoteCover(props: Props) {
  return <CoverImage key={props.image.src} {...props} />;
}
function CoverImage({
  image,
  fallback,
  href,
  label,
  noteId,
  priority,
  thumbnail,
  selected,
  onNavigate,
  onFocus,
}: Props) {
  const [stage, setStage] = useState<'original' | 'fallback' | 'empty'>(
    'original'
  );
  const [ready, setReady] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  const active = stage === 'original' ? image : fallback;
  const fail = () => {
    setReady(false);
    setStage((s) =>
      s === 'original' && fallback && fallback.src !== image.src
        ? 'fallback'
        : 'empty'
    );
  };
  useEffect(() => {
    const img = ref.current;
    if (!img || stage === 'empty') return;
    let alive = true;
    const error = () => {
      if (alive) fail();
    };
    const load = () => {
      if (!img.naturalWidth) {
        error();
        return;
      }
      img
        .decode()
        .then(() => {
          if (alive) setReady(true);
        })
        .catch(error);
    };
    img.addEventListener('load', load);
    img.addEventListener('error', error);
    if (img.complete) {
      if (img.naturalWidth) load();
      else error();
    }
    return () => {
      alive = false;
      img.removeEventListener('load', load);
      img.removeEventListener('error', error);
    };
  }, [active?.src, stage]);
  const visual = (
    <span
      className="note-image-frame"
      data-image-state={
        stage === 'empty' ? 'empty' : ready ? 'ready' : 'pending'
      }
    >
      {stage !== 'empty' && active ? (
        <img
          ref={ref}
          src={thumbnail ? (active.thumbnailSrc ?? active.src) : active.src}
          width={active.width}
          height={active.height}
          alt={href ? '' : active.alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className={ready ? 'is-ready' : ''}
        />
      ) : (
        <span
          className="note-image-placeholder"
          role="img"
          aria-label="사진을 불러올 수 없습니다"
        >
          사진을 불러올 수 없습니다
        </span>
      )}
    </span>
  );
  return (
    <figure className="note-cover">
      {href ? (
        <a
          className="note-photo-link"
          href={href}
          aria-label={label}
          aria-current={selected ? 'true' : undefined}
          data-note-id={noteId}
          onClick={onNavigate}
          onFocus={(event) => {
            if (event.currentTarget.matches(':focus-visible')) onFocus?.();
          }}
        >
          {visual}
        </a>
      ) : (
        visual
      )}
      {active?.attribution && stage !== 'empty' && (
        <figcaption className="note-credit">
          Photo by{' '}
          <a
            href={active.attribution.photographerUrl}
            target="_blank"
            rel="noreferrer"
          >
            {active.attribution.photographer}
          </a>{' '}
          on{' '}
          <a
            href={active.attribution.photoUrl}
            target="_blank"
            rel="noreferrer"
          >
            Unsplash
          </a>
        </figcaption>
      )}
    </figure>
  );
}
