'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { Badge } from './Badge';
import { CardLink } from './CardLink';

type ContinueSwiperItem = {
  comicId: number;
  comicTitle: string;
  authorName: string | null;
  coverUrl: string | null;
  chapterId: number;
  chapterNumber: number;
  page: number | null;
  totalPages: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function pct(page: number, total: number) {
  if (!total || total <= 0) return 0;
  return clamp(Math.round((page / total) * 100), 0, 100);
}

const DRAG_THRESHOLD = 6;
const CUE_WIDTH = 72;
const MIN_CUE_THUMB_WIDTH = 20;

export function ContinueSwiper({ items }: { items: ContinueSwiperItem[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({
    pointerId: -1,
    startX: 0,
    scrollLeft: 0,
    moved: false,
    captured: false,
  });
  const blockClickRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const [cue, setCue] = useState({ width: CUE_WIDTH, offset: 0 });
  const showCue = items.length > 3;

  const updateCue = useCallback(
    (track = trackRef.current) => {
      if (!track || !showCue) return;

      const maxScroll = track.scrollWidth - track.clientWidth;

      if (maxScroll <= 0) {
        setCue({ width: CUE_WIDTH, offset: 0 });
        return;
      }

      const width = clamp((track.clientWidth / track.scrollWidth) * CUE_WIDTH, MIN_CUE_THUMB_WIDTH, CUE_WIDTH);
      const offset = ((CUE_WIDTH - width) * track.scrollLeft) / maxScroll;

      setCue((current) => {
        if (Math.abs(current.width - width) < 0.5 && Math.abs(current.offset - offset) < 0.5) {
          return current;
        }

        return { width, offset };
      });
    },
    [showCue]
  );

  function cancelMotion() {
    setIsDragging(false);
  }

  function finishDrag() {
    const track = trackRef.current;
    const drag = dragRef.current;

    if (track && drag.pointerId !== -1 && drag.captured && track.hasPointerCapture(drag.pointerId)) {
      track.releasePointerCapture(drag.pointerId);
    }

    blockClickRef.current = drag.moved;
    drag.pointerId = -1;
    setIsDragging(false);
  }

  useEffect(() => {
    if (!showCue) return;

    const track = trackRef.current;
    if (!track) return;

    updateCue(track);

    const resizeObserver = new ResizeObserver(() => updateCue(track));
    resizeObserver.observe(track);

    return () => {
      resizeObserver.disconnect();
    };
  }, [showCue, updateCue]);

  return (
    <div className={`home-continueSwiper${showCue ? ' has-cue' : ''}`}>
      <div
        ref={trackRef}
        className={`home-continueTrack${isDragging ? ' is-dragging' : ''}`}
        tabIndex={0}
        aria-label="Продолжить чтение"
        onScroll={(event) => updateCue(event.currentTarget)}
        onPointerDown={(event) => {
          if (event.pointerType === 'mouse' && event.button !== 0) return;

          const track = event.currentTarget;

          cancelMotion();
          blockClickRef.current = false;
          dragRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            scrollLeft: track.scrollLeft,
            moved: false,
            captured: false,
          };
        }}
        onPointerMove={(event) => {
          const drag = dragRef.current;
          if (drag.pointerId !== event.pointerId) return;

          const deltaX = event.clientX - drag.startX;
          if (!drag.moved && Math.abs(deltaX) <= DRAG_THRESHOLD) return;

          if (!drag.moved) {
            drag.moved = true;
            drag.captured = true;
            event.currentTarget.setPointerCapture(event.pointerId);
            setIsDragging(true);
          }

          const maxScroll = event.currentTarget.scrollWidth - event.currentTarget.clientWidth;
          const nextScrollLeft = clamp(drag.scrollLeft - deltaX, 0, maxScroll);
          event.currentTarget.scrollLeft = nextScrollLeft;
          updateCue(event.currentTarget);
        }}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        onClickCapture={(event) => {
          if (!blockClickRef.current) return;

          event.preventDefault();
          event.stopPropagation();
          blockClickRef.current = false;
        }}
        onDragStart={(event) => event.preventDefault()}
      >
        {items.map((it) => {
          const currentPage = it.page ?? 1;
          const total = it.totalPages ?? 0;
          const progressPercent = total > 0 ? pct(currentPage, total) : 0;

          return (
            <div className="home-continueSlide" key={`${it.comicId}-${it.chapterId}`}>
              <CardLink
                href={`/comics/${it.comicId}/chapters/${it.chapterId}?page=${currentPage}`}
                title={it.comicTitle}
                subtitle={`${it.authorName ?? 'Автор неизвестен'} • Глава ${it.chapterNumber} • стр ${currentPage}/${total}`}
                coverUrl={it.coverUrl}
                badges={<Badge icon="⏳">{progressPercent}%</Badge>}
                progress={progressPercent}
              />
            </div>
          );
        })}
      </div>
      {showCue && (
        <div className="home-continueCue" aria-hidden="true">
          <span style={{ width: cue.width, transform: `translateX(${cue.offset}px)` }} />
        </div>
      )}
    </div>
  );
}
