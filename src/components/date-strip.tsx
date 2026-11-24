"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import gsap from "gsap";
import { TODAY, daysInMonth, formatDate } from "@/lib/model";

export default function DateStrip({ value, onChange, hasPlan }: {
  value: string;
  onChange: (date: string) => void;
  hasPlan: (date: string) => boolean;
}) {
  const month = value.slice(0, 7);
  const selected = Number(value.slice(8)) - 1;
  const count = month === TODAY.slice(0, 7)
    ? Math.min(daysInMonth(month), Math.max(6, Number(TODAY.slice(8)) + 2))
    : daysInMonth(month);
  const track = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ first: false, last: true });
  const isInitialMount = useRef(true);
  const prevSelectedRef = useRef(selected);
  const prevMonthRef = useRef(month);
  const keyboardSelection = useRef(false);
  const wheelTarget = useRef<number | null>(null);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const [dragging, setDragging] = useState(false);

  const keyFor = (index: number) => `${month}-${String(index + 1).padStart(2, "0")}`;

  const updateEdges = () => {
    const el = track.current;
    if (el) {
      const next = { first: el.scrollLeft < 2, last: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2 };
      setEdges(previous => previous.first === next.first && previous.last === next.last ? previous : next);
    }
  };

  useLayoutEffect(() => {
    const el = track.current;
    if (!el) return;

    const centerSelection = (smooth: boolean) => {
      const day = el.querySelectorAll<HTMLElement>(".week-day")[selected];
      if (!day) return;
      const target = day.offsetLeft - (el.clientWidth - day.offsetWidth) / 2;
      const maxScroll = el.scrollWidth - el.clientWidth;
      const clamped = Math.max(0, Math.min(maxScroll, target));

      if (!smooth || matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.killTweensOf(el);
        el.style.scrollSnapType = "";
        el.scrollLeft = clamped;
        updateEdges();
      } else {
        gsap.to(el, {
          scrollLeft: clamped,
          duration: 0.45,
          ease: "power2.out",
          onStart: () => {
            el.style.scrollSnapType = "none";
          },
          onUpdate: updateEdges,
          onComplete: () => {
            el.style.scrollSnapType = "";
            updateEdges();
          },
          overwrite: "auto",
        });
      }
    };

    if (isInitialMount.current || prevMonthRef.current !== month) {
      isInitialMount.current = false;
      prevMonthRef.current = month;
      prevSelectedRef.current = selected;
      centerSelection(false);
    } else if (prevSelectedRef.current !== selected) {
      prevSelectedRef.current = selected;
      centerSelection(!keyboardSelection.current);
      keyboardSelection.current = false;
    }

    // ResizeObserver runs once on subscription too; that is not a resize and
    // must not cancel the selection tween that just started.
    let width = el.clientWidth;
    const observer = new ResizeObserver(() => {
      if (el.clientWidth === width) return;
      width = el.clientWidth;
      centerSelection(false);
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      gsap.killTweensOf(el);
    };
  }, [selected, month, count]);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? el.clientWidth : 1);
      const max = el.scrollWidth - el.clientWidth;
      if ((delta < 0 && el.scrollLeft <= 0) || (delta > 0 && el.scrollLeft >= max - 1)) return;
      event.preventDefault();
      wheelTarget.current = Math.max(0, Math.min(max, (wheelTarget.current ?? el.scrollLeft) + delta));
      el.style.scrollSnapType = "none";
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
        el.scrollLeft = wheelTarget.current;
        wheelTarget.current = null;
        el.style.scrollSnapType = "";
        updateEdges();
      } else gsap.to(el, {
        scrollLeft: wheelTarget.current, duration: .35, ease: "power2.out", overwrite: "auto",
        onUpdate: updateEdges,
        onComplete: () => { wheelTarget.current = null; el.style.scrollSnapType = ""; updateEdges(); },
      });
    };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => el.removeEventListener("wheel", wheel);
  }, [month, count]);

  const scroll = (direction: number) => {
    wheelTarget.current = null;
    const el = track.current;
    if (!el) return;
    const step = (el.querySelector<HTMLElement>(".week-day")?.offsetWidth || 44) + parseFloat(getComputedStyle(el).columnGap);
    const target = el.scrollLeft + direction * step * 3;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const clamped = Math.max(0, Math.min(maxScroll, target));

    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.scrollLeft = clamped;
      updateEdges();
    } else {
      gsap.to(el, {
        scrollLeft: clamped,
        duration: 0.45,
        ease: "power2.out",
        onStart: () => {
          el.style.scrollSnapType = "none";
        },
        onUpdate: updateEdges,
        onComplete: () => {
          el.style.scrollSnapType = "";
          updateEdges();
        },
        overwrite: "auto",
      });
    }
  };

  return <div className="week-strip scrollable-date-strip">
    <button className="icon-button" aria-label="Earlier dates" disabled={edges.first} onClick={() => scroll(-1)}><ChevronLeft size={18}/></button>
    <div className="date-strip-window" data-first={edges.first} data-last={edges.last}>
    <div className="date-strip-track" ref={track} role="group" aria-label={`Dates for ${formatDate(value, { month:"long", year:"numeric" })}`} onScroll={updateEdges}
      data-dragging={dragging}
      onPointerDown={event => {
        wheelTarget.current = null;
        gsap.killTweensOf(event.currentTarget);
        event.currentTarget.style.scrollSnapType = "";
        suppressClick.current = false;
        if (event.pointerType === "mouse" && event.button === 0)
          drag.current = { x: event.clientX, left: event.currentTarget.scrollLeft, moved: false };
      }}
      onPointerMove={event => {
        const gesture = drag.current;
        if (!gesture) return;
        const distance = event.clientX - gesture.x;
        if (!gesture.moved && Math.abs(distance) < 5) return;
        gesture.moved = true;
        suppressClick.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        event.currentTarget.style.scrollSnapType = "none";
        event.currentTarget.scrollLeft = gesture.left - distance;
        setDragging(true);
      }}
      onPointerUp={event => {
        drag.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
        event.currentTarget.style.scrollSnapType = "";
        setDragging(false);
      }}
      onPointerCancel={event => { drag.current = null; event.currentTarget.style.scrollSnapType = ""; setDragging(false); }}
      onClickCapture={event => { if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false; } }}>
      {Array.from({length:count}, (_, i) => {
        const key = keyFor(i);
        return <button key={key} type="button" className={`week-day ${value === key ? "selected" : ""}`} disabled={key > TODAY}
          data-distance={Math.min(Math.abs(i - selected), 3)}
          title={hasPlan(key) ? "Workout planned" : undefined}
          aria-label={formatDate(key)} aria-current={key === TODAY ? "date" : undefined} aria-pressed={value === key} tabIndex={value === key ? 0 : -1}
          onClick={() => onChange(key)}
          onKeyDown={event => {
            const last = month === TODAY.slice(0, 7) ? Number(TODAY.slice(8)) - 1 : count - 1;
            const next = { ArrowLeft:Math.max(0,i-1), ArrowRight:Math.min(last,i+1), Home:0, End:last }[event.key];
            if (next !== undefined) {
              event.preventDefault();
              keyboardSelection.current = true;
              onChange(keyFor(next));
              track.current?.querySelectorAll<HTMLButtonElement>(".week-day")[next]?.focus({preventScroll:true});
            }
          }}>
          <span>{formatDate(key, {weekday:"short"})}</span><strong>{String(i + 1).padStart(2, "0")}</strong><i className={hasPlan(key) ? "has-plan" : ""}/>
        </button>;
      })}
    </div>
    </div>
    <button className="icon-button" aria-label="Later dates" disabled={edges.last} onClick={() => scroll(1)}><ChevronRight size={18}/></button>
    <span className="week-month">{formatDate(value,{weekday:"long"})} · {formatDate(value,{month:"long",year:"numeric"})}</span>
  </div>;
}
