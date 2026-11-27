"use client";
import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { daysInMonth, formatDate, type Store } from "@/lib/model";
const minimum = "0001-01-01",
  maximum = "2100-12-31";
export function shiftTrainerDate(value: string, amount: number) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}
export default function TrainerDateStrip({
  value,
  onChange,
  data,
}: {
  value: string;
  onChange: (value: string) => void;
  data: Store;
}) {
  const month = value.slice(0, 7);
  const days = Array.from(
    { length: daysInMonth(month) },
    (_, index) => `${month}-${String(index + 1).padStart(2, "0")}`,
  );
  const track = useRef<HTMLDivElement>(null);
  const previous = useRef(value),
    selectionAnimation = useRef<Animation | null>(null);
  const scrollingTo = useRef<number | null>(null);
  const drag = useRef<{
    x: number;
    left: number;
    pointer: number;
    moved: boolean;
  } | null>(null);
  const suppressClick = useRef(false);
  const hasEntry = (day: string) =>
    !!(
      data.plans[`alex:${day}`] ||
      data.logs[`alex:${day}`] ||
      data.nutrition[day] ||
      data.weights.some((entry) => entry.date === day) ||
      data.bodyCompositionScans?.some((scan) => scan.date === day) ||
      data.planner[day]?.trim() ||
      data.habits.some((habit) => habit.marks.includes(day))
    );

  useLayoutEffect(() => {
    const container = track.current,
      selected = container?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!container || !selected) return;
    const changed = previous.current !== value;
    const sameMonth = previous.current.slice(0, 7) === month;
    previous.current = value;
    const center = (animate: boolean) => {
      gsap.killTweensOf(container);
      const target = Math.max(
        0,
        Math.min(
          container.scrollWidth - container.clientWidth,
          selected.offsetLeft -
            (container.clientWidth - selected.offsetWidth) / 2,
        ),
      );
      scrollingTo.current = target;
      if (!animate || matchMedia("(prefers-reduced-motion: reduce)").matches) {
        container.style.scrollSnapType = "";
        container.scrollLeft = target;
        scrollingTo.current = null;
        return;
      }
      container.style.scrollSnapType = "none";
      gsap.to(container, {
        scrollLeft: target,
        duration: 0.48,
        ease: "power3.out",
        overwrite: true,
        onComplete: () => {
          scrollingTo.current = null;
          container.style.scrollSnapType = "";
        },
      });
    };
    center(changed && sameMonth);
    if (changed && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      selectionAnimation.current = selected.animate(
        [
          { transform: "scale(.92)", opacity: 0.72 },
          { transform: "scale(1)", opacity: 1 },
        ],
        {
          duration: 240,
          easing: "cubic-bezier(.16,1,.3,1)",
          id: "trainer-date-selection",
        },
      );
    }
    let width = container.clientWidth;
    const resize = new ResizeObserver(() => {
      if (container.clientWidth !== width) {
        width = container.clientWidth;
        center(false);
      }
    });
    resize.observe(container);
    return () => {
      resize.disconnect();
      gsap.killTweensOf(container);
      selectionAnimation.current?.cancel();
    };
  }, [value, month]);

  useEffect(() => {
    const container = track.current;
    if (!container) return;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const cancel = () => {
      gsap.killTweensOf(container);
      selectionAnimation.current?.cancel();
      scrollingTo.current = null;
      container.style.scrollSnapType = "";
    };
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey) return;
      if (Math.abs(event.deltaX) >= Math.abs(event.deltaY)) {
        cancel();
        return;
      }
      const delta =
        event.deltaY *
        (event.deltaMode === 1
          ? 16
          : event.deltaMode === 2
            ? container.clientWidth
            : 1);
      const maximumScroll = container.scrollWidth - container.clientWidth;
      if (
        (delta < 0 && container.scrollLeft <= 0) ||
        (delta > 0 && container.scrollLeft >= maximumScroll - 1)
      )
        return;
      event.preventDefault();
      const target = Math.max(
        0,
        Math.min(
          maximumScroll,
          (scrollingTo.current ?? container.scrollLeft) + delta,
        ),
      );
      gsap.killTweensOf(container);
      scrollingTo.current = target;
      if (preference.matches) {
        container.scrollLeft = target;
        scrollingTo.current = null;
        return;
      }
      container.style.scrollSnapType = "none";
      gsap.to(container, {
        scrollLeft: target,
        duration: 0.34,
        ease: "power3.out",
        overwrite: true,
        onComplete: () => {
          scrollingTo.current = null;
          container.style.scrollSnapType = "";
        },
      });
    };
    const stopDrag = () => {
      drag.current = null;
      container.removeAttribute("data-dragging");
      container.style.scrollSnapType = "";
    };
    const reduce = () => {
      if (preference.matches) {
        const target = scrollingTo.current;
        cancel();
        if (target !== null) container.scrollLeft = target;
      }
    };
    container.addEventListener("wheel", wheel, { passive: false });
    window.addEventListener("blur", stopDrag);
    preference.addEventListener("change", reduce);
    return () => {
      container.removeEventListener("wheel", wheel);
      window.removeEventListener("blur", stopDrag);
      preference.removeEventListener("change", reduce);
      cancel();
    };
  }, []);

  const finishDrag = (element: HTMLDivElement, pointer: number) => {
    drag.current = null;
    element.removeAttribute("data-dragging");
    element.style.scrollSnapType = "";
    if (element.hasPointerCapture(pointer))
      element.releasePointerCapture(pointer);
  };
  return (
    <section className="trainer-date-strip" aria-label="Member date navigation">
      <div
        ref={track}
        className="trainer-date-days"
        role="group"
        aria-label="Month dates"
        onPointerDown={(event) => {
          gsap.killTweensOf(event.currentTarget);
          scrollingTo.current = null;
          event.currentTarget.style.scrollSnapType = "";
          suppressClick.current = false;
          if (event.pointerType === "mouse" && event.button === 0)
            drag.current = {
              x: event.clientX,
              left: event.currentTarget.scrollLeft,
              pointer: event.pointerId,
              moved: false,
            };
        }}
        onPointerMove={(event) => {
          const gesture = drag.current;
          if (!gesture || gesture.pointer !== event.pointerId) return;
          const distance = event.clientX - gesture.x;
          if (!gesture.moved && Math.abs(distance) < 5) return;
          gesture.moved = true;
          suppressClick.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
          event.currentTarget.dataset.dragging = "true";
          event.currentTarget.style.scrollSnapType = "none";
          event.currentTarget.scrollLeft = gesture.left - distance;
        }}
        onPointerUp={(event) =>
          finishDrag(event.currentTarget, event.pointerId)
        }
        onPointerCancel={(event) =>
          finishDrag(event.currentTarget, event.pointerId)
        }
        onLostPointerCapture={(event) =>
          finishDrag(event.currentTarget, event.pointerId)
        }
        onClickCapture={(event) => {
          if (suppressClick.current) {
            event.preventDefault();
            event.stopPropagation();
            suppressClick.current = false;
          }
        }}
        onKeyDown={(event) => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
            return;
          event.preventDefault();
          const next =
            event.key === "Home"
              ? days[0]
              : event.key === "End"
                ? days[days.length - 1]
                : shiftTrainerDate(value, event.key === "ArrowLeft" ? -1 : 1);
          if (next >= minimum && next <= maximum) {
            onChange(next);
            requestAnimationFrame(() =>
              track.current
                ?.querySelector<HTMLButtonElement>('[aria-pressed="true"]')
                ?.focus({ preventScroll: true }),
            );
          }
        }}
      >
        {days.map((day) => (
          <button
            key={day}
            type="button"
            data-date={day}
            tabIndex={day === value ? 0 : -1}
            aria-label={`${formatDate(day)}${hasEntry(day) ? ", has entries" : ""}`}
            aria-pressed={day === value}
            onClick={() => onChange(day)}
          >
            <span>{formatDate(day, { weekday: "short" })}</span>
            <strong>{Number(day.slice(-2))}</strong>
            <i
              className={hasEntry(day) ? "has-entry" : ""}
              aria-hidden="true"
            />
          </button>
        ))}
      </div>
    </section>
  );
}
