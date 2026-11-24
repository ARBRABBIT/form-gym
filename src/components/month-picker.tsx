"use client";

import {
  useEffect,
  useLayoutEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { lockModalBackground, useModalViewport } from "./modal-environment";
import {
  CalendarDays,
  ChevronDown,
  X,
} from "lucide-react";
import PickerWheel from "./picker-wheel";
import { TODAY, monthLabel } from "@/lib/model";

const MONTHS = Array.from({ length: 12 }, (_, i) =>
  new Date(2026, i, 1).toLocaleDateString("en-US", { month: "long" }),
);

const YEARS = Array.from({ length: 9999 }, (_, i) => String(i + 1));

export default function MonthPicker({
  label = "Month and year",
  value,
  onChange,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [open, setOpen] = useState(false),
    [year, setYear] = useState(String(Number(value.slice(0, 4)))),
    [month, setMonth] = useState(Number(value.split("-")[1]) - 1);
  const trigger = useRef<HTMLButtonElement>(null),
    dialog = useRef<HTMLDivElement>(null);
  const id = useId(),
    selectedYear = Number(value.split("-")[0]),
    selectedMonth = Number(value.split("-")[1]) - 1;

  useModalViewport(dialog, open);
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      if (!trigger.current || !dialog.current) return;
      const rect = trigger.current.getBoundingClientRect();
      const height = dialog.current.offsetHeight;
      const width = dialog.current.offsetWidth;
      const top =
        rect.bottom + 10 + height <=
        (window.visualViewport?.offsetTop ?? 0) +
          (window.visualViewport?.height ?? window.innerHeight) -
          14
          ? rect.bottom + 10
          : Math.max(
              (window.visualViewport?.offsetTop ?? 0) + 14,
              rect.top - height - 10,
            );
      setPosition({
        top,
        left: Math.max(14, Math.min(rect.left, window.innerWidth - width - 14)),
      });
    };
    place();
    window.addEventListener("resize", place);
    window.visualViewport?.addEventListener("resize", place);
    return () => {
      window.removeEventListener("resize", place);
      window.visualViewport?.removeEventListener("resize", place);
    };
  }, [open]);
  const close = () => setOpen(false);
  const select = (next: string) => {
    onChange(next);
    close();
  };
  useEffect(() => {
    if (!open) return;
    dialog.current?.querySelector<HTMLElement>('[role="listbox"]')?.focus({ preventScroll: true });
    const restoreBackground = lockModalBackground();
    return () => {
      restoreBackground();
      trigger.current?.focus({ preventScroll: true });
    };
  }, [open]);
  const keyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" && (event.target as HTMLElement).getAttribute("role") === "listbox") {
      event.preventDefault();
      select(`${year.padStart(4, "0")}-${String(month + 1).padStart(2, "0")}`);
      return;
    }
    if ((event.key === "ArrowLeft" || event.key === "ArrowRight") && (event.target as HTMLElement).getAttribute("role") === "listbox") {
      event.preventDefault();
      const wheels = dialog.current?.querySelectorAll<HTMLElement>('[role="listbox"]');
      wheels?.[event.key === "ArrowLeft" ? 0 : 1]?.focus({ preventScroll: true });
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close();
      return;
    }
    if (event.key === "Tab") {
      const nodes = dialog.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), [role="listbox"]',
      );
      const first = nodes?.[0],
        last = nodes?.[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
  };
  return (
    <div className={`month-picker ${open ? "is-open" : ""}`}>
      <span className="month-picker-label" id={`${id}-label`}>
        {label}
      </span>
      <button
        ref={trigger}
        type="button"
        className="month-picker-trigger"
        aria-label={label}
        aria-describedby={`${id}-value`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? `${id}-dialog` : undefined}
        onClick={() => {
          if (!open) { setYear(String(selectedYear)); setMonth(selectedMonth); }
          setOpen(!open);
        }}
      >
        <CalendarDays size={19} />
        <span id={`${id}-value`}>{monthLabel(value)}</span>
        <ChevronDown size={17} />
      </button>
      {open &&
        createPortal(
          <>
            <div
              className="month-picker-backdrop"
              aria-hidden="true"
              onClick={close}
            />
            <div
              className="month-picker-dialog wheel-month-dialog"
              style={
                {
                  "--month-picker-top": `${position.top}px`,
                  "--month-picker-left": `${position.left}px`,
                } as CSSProperties
              }
              ref={dialog}
              id={`${id}-dialog`}
              role="dialog"
              aria-modal="true"
              aria-labelledby={`${id}-title`}
              onKeyDown={keyDown}
            >
              <div className="month-picker-handle" />
              <div className="month-picker-heading">
                <h2 id={`${id}-title`}>Choose month and year</h2>
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Close month selector"
                  onClick={close}
                >
                  <X size={19} />
                </button>
              </div>
              <div className="picker-body wheel-picker-body">
                <div className="picker-wheels">
                  <div className="picker-wheel-highlight" aria-hidden="true" />
                  <PickerWheel label="Month" values={MONTHS} value={MONTHS[month]} onChange={v => setMonth(MONTHS.indexOf(v))} />
                  <PickerWheel label="Year" values={YEARS} value={year} onChange={setYear} />
                </div>
                <p className="sr-only" aria-live="polite">{MONTHS[month]} {year}</p>
              </div>
              <div className="month-picker-footer">
                <button type="button" onClick={close}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="month-picker-current"
                  onClick={() => select(TODAY.slice(0, 7))}
                >
                  This month
                </button>
                <button type="button" className="wheel-picker-done" onClick={() => select(`${year.padStart(4, "0")}-${String(month + 1).padStart(2, "0")}`)}>Done</button>
              </div>
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}
