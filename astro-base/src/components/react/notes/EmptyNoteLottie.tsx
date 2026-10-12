import { useEffect, useRef } from 'react';
import type { AnimationItem } from 'lottie-web';
import animationData from '@/data/empty-note-lottie.json';

export default function EmptyNoteLottie({
  variant,
}: {
  variant: 'mark' | 'preview';
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const art = container.parentElement;
    if (!art) return;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let disposed = false;
    let loading = false;
    let animation: AnimationItem | undefined;

    const load = async () => {
      if (loading || animation || reducedMotion.matches) return;
      loading = true;
      try {
        const { default: lottie } = await import(
          'lottie-web/build/player/lottie_light'
        );
        loading = false;
        if (disposed || reducedMotion.matches) return;
        animation = lottie.loadAnimation({
          container,
          renderer: 'svg',
          loop: false,
          autoplay: true,
          animationData: structuredClone(animationData),
        });
        animation.addEventListener('DOMLoaded', () => {
          if (!reducedMotion.matches) art.dataset.ready = 'true';
        });
      } catch {
        loading = false; // Keep the inline SVG if the player cannot load.
      }
    };

    const onMotionChange = () => {
      if (reducedMotion.matches) {
        animation?.stop();
        art.dataset.ready = 'false';
      } else if (animation) {
        art.dataset.ready = 'true';
        animation.goToAndPlay(0, true);
      } else {
        void load();
      }
    };
    reducedMotion.addEventListener('change', onMotionChange);
    void load();
    return () => {
      disposed = true;
      reducedMotion.removeEventListener('change', onMotionChange);
      animation?.destroy();
    };
  }, []);

  return (
    <div
      className={`empty-note-art empty-note-art--${variant}`}
      aria-hidden="true"
    >
      <svg
        className="empty-note-art-fallback"
        viewBox="0 0 320 220"
        fill="none"
      >
        <path
          d="M37 48 150 54 158 175 37 168Z M158 55 282 47 282 168 158 175Z"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path d="M158 55V175" stroke="var(--note-accent)" strokeWidth="2.5" />
        <path
          d="m56 90 77 4m-77 17 79 4m-79 17 65 3m57-43 81-5m-80 27 81-5m-80 27 63-4"
          stroke="currentColor"
          strokeOpacity=".55"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <path
          d="m39 175 118 8 123-8m-13-127v18l15-2"
          stroke="currentColor"
          strokeOpacity=".45"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <path
          d="m57 73 29 1m95 0 36-2m32 122 42-17"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="m231 50v33l6-6 6 6V49"
          stroke="var(--note-accent)"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="m249 194-6 4 4-7"
          stroke="currentColor"
          strokeOpacity=".55"
          strokeWidth="1.2"
        />
      </svg>
      <div className="empty-note-art-player" ref={containerRef} />
    </div>
  );
}
