"use client";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useId,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { lockModalBackground, useModalViewport } from "./modal-environment";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Check,
} from "./icons";
import { TODAY, formatDate, monthLabel } from "@/lib/model";

const keyFor = (date: Date) =>
  `${String(date.getFullYear()).padStart(4, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const MONTHS = Array.from({ length: 12 }, (_, i) =>
  new Date(2026, i, 1).toLocaleDateString("en-US", { month: "long" }),
);
export default function DatePicker({
  value,
  onChange,
  max = TODAY,
  label = "Dashboard date",
  showValue = false,
  iconOnly = false,
  disabled = false,
}: {
  value: string;
  onChange: (date: string) => void;
  max?: string;
  label?: string;
  showValue?: boolean;
  iconOnly?: boolean;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false),
    [month, setMonth] = useState(value.slice(0, 7)),
    [choosingMonth, setChoosingMonth] = useState(false),
    [year, setYear] = useState(value.slice(0, 4)),
    [focusDate, setFocusDate] = useState(value),
    [position, setPosition] = useState({ top: 0, left: 0 });
  const trigger = useRef<HTMLButtonElement>(null),
    dialog = useRef<HTMLDivElement>(null),
    yearInput = useRef<HTMLInputElement>(null),
    days = useRef<Record<string, HTMLButtonElement | null>>({});
  const id = useId(),
    maxYear = Number(max.slice(0, 4)),
    yearNumber = Number(year),
    validYear =
      /^\d{1,4}$/.test(year) && yearNumber >= 1 && yearNumber <= maxYear;
  const close = () => setOpen(false);
  const choose = (date: string) => {
    if (date <= max) {
      onChange(date);
      close();
    }
  };
  const shiftMonth = (step: number) => {
    const next = new Date(month + "-01T12:00:00");
    next.setMonth(next.getMonth() + step);
    const key = keyFor(next).slice(0, 7);
    if (key >= "0001-01" && key <= max.slice(0, 7)) setMonth(key);
  };
  useModalViewport(dialog, open);
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      if (!trigger.current || !dialog.current) return;
      const rect = trigger.current.getBoundingClientRect(),
        height = dialog.current.offsetHeight,
        width = dialog.current.offsetWidth;
      setPosition({
        top:
          rect.bottom + 10 + height <=
          (window.visualViewport?.offsetTop ?? 0) +
            (window.visualViewport?.height ?? window.innerHeight) -
            14
            ? rect.bottom + 10
            : Math.max(
                (window.visualViewport?.offsetTop ?? 0) + 14,
                rect.top - height - 10,
              ),
        left: Math.max(
          14,
          Math.min(rect.right - width, innerWidth - width - 14),
        ),
      });
    };
    place();
    window.addEventListener("resize", place);
    window.visualViewport?.addEventListener("resize", place);
    return () => {
      window.removeEventListener("resize", place);
      window.visualViewport?.removeEventListener("resize", place);
    };
  }, [open, choosingMonth]);
  useEffect(() => {
    if (!open) return;
    const restoreBackground = lockModalBackground();
    return () => {
      restoreBackground();
      trigger.current?.focus({ preventScroll: true });
    };
  }, [open]);
  useEffect(() => {
    if (!open) return;
    if (choosingMonth) {
      yearInput.current?.focus();
      return;
    }
    const key = focusDate.startsWith(month)
      ? focusDate
      : value.startsWith(month)
        ? value
        : month + "-01";
    days.current[key]?.focus();
  }, [open, month, choosingMonth, focusDate]);
  const dialogKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close();
    }
    if (event.key === "Tab") {
      const nodes = dialog.current?.querySelectorAll<HTMLElement>(
        "button:not(:disabled),input:not(:disabled)",
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
  const dayKey = (event: KeyboardEvent<HTMLButtonElement>, date: string) => {
    const step = (
      { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 } as Record<
        string,
        number
      >
    )[event.key];
    if (step === undefined) return;
    event.preventDefault();
    const next = new Date(date + "T12:00:00");
    next.setDate(next.getDate() + step);
    const key = keyFor(next);
    if (key > max || key < "0001-01-01") return;
    if (key.slice(0, 7) !== month) setMonth(key.slice(0, 7));
    setFocusDate(key);
  };
  const first = new Date(month + "-01T12:00:00"),
    start = new Date(first);
  start.setDate(1 - first.getDay());
  return (
    <>
      <button
        type="button"
        ref={trigger}
        disabled={disabled}
        className={`date-control custom-date-trigger${iconOnly ? " date-icon-only" : ""}`}
        aria-label={label}
        aria-describedby={`${id}-value`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? `${id}-dialog` : undefined}
        data-date={value}
        onClick={() => {
          if (!open) {
            setMonth(value.slice(0, 7));
            setYear(value.slice(0, 4));
            setChoosingMonth(false);
            setFocusDate(value);
          }
          setOpen(!open);
        }}
      >
        <CalendarDays size={17} />
        {!iconOnly && (
          <span>
            {showValue
              ? formatDate(value, {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "Change date"}
          </span>
        )}
        <span className="sr-only" id={`${id}-value`}>
          {formatDate(value)}
        </span>
      </button>
      {open &&
        createPortal(
          <>
            <div
              className="month-picker-backdrop date-picker-backdrop"
              aria-hidden="true"
              onClick={close}
            />
            <div
              ref={dialog}
              className="month-picker-dialog date-picker-dialog"
              id={`${id}-dialog`}
              style={
                {
                  "--month-picker-top": `${position.top}px`,
                  "--month-picker-left": `${position.left}px`,
                } as CSSProperties
              }
              role="dialog"
              aria-modal="true"
              aria-labelledby={`${id}-title`}
              onKeyDown={dialogKey}
            >
              <div className="month-picker-handle" />
              <div className="month-picker-heading">
                <h2 id={`${id}-title`}>Choose date</h2>
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Close date selector"
                  onClick={close}
                >
                  <X size={19} />
                </button>
              </div>
              <div className="picker-body">
                {choosingMonth ? (
                  <>
                    <div className="month-picker-year">
                      <button
                        type="button"
                        className="icon-button"
                        aria-label="Previous year"
                        disabled={validYear && yearNumber <= 1}
                        onClick={() =>
                          setYear(
                            String(
                              Math.max(
                                1,
                                (validYear
                                  ? yearNumber
                                  : Number(month.slice(0, 4))) - 1,
                              ),
                            ),
                          )
                        }
                      >
                        <ChevronLeft size={19} />
                      </button>
                      <input
                        ref={yearInput}
                        type="number"
                        aria-label="Year"
                        min="1"
                        max={maxYear}
                        value={year}
                        aria-invalid={!validYear}
                        onChange={(e) => setYear(e.target.value)}
                      />
                      <button
                        type="button"
                        className="icon-button"
                        aria-label="Next year"
                        disabled={validYear && yearNumber >= maxYear}
                        onClick={() =>
                          setYear(
                            String(
                              Math.min(
                                maxYear,
                                (validYear
                                  ? yearNumber
                                  : Number(month.slice(0, 4))) + 1,
                              ),
                            ),
                          )
                        }
                      >
                        <ChevronRight size={19} />
                      </button>
                    </div>
                    <div
                      className="month-picker-grid"
                      role="group"
                      aria-label="Months"
                    >
                      {MONTHS.map((name, i) => {
                        const key = `${String(yearNumber).padStart(4, "0")}-${String(i + 1).padStart(2, "0")}`;
                        return (
                          <button
                            type="button"
                            key={name}
                            disabled={!validYear || key > max.slice(0, 7)}
                            aria-label={`${name} ${year}`}
                            aria-pressed={key === month}
                            className={key === month ? "selected" : ""}
                            onClick={() => {
                              setMonth(key);
                              setChoosingMonth(false);
                            }}
                          >
                            {name.slice(0, 3)}
                            {key === month && <Check size={13} />}
                          </button>
                        );
                      })}
                    </div>
                    {!validYear && (
                      <p className="month-picker-error" role="status">
                        Enter a year from 1 to {maxYear}.
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <div className="date-picker-month">
                      <button
                        type="button"
                        className="icon-button"
                        aria-label="Previous month"
                        disabled={month <= "0001-01"}
                        onClick={() => shiftMonth(-1)}
                      >
                        <ChevronLeft size={19} />
                      </button>
                      <button
                        type="button"
                        className="date-picker-month-label"
                        aria-label="Choose calendar month and year"
                        onClick={() => {
                          setYear(month.slice(0, 4));
                          setChoosingMonth(true);
                        }}
                      >
                        {monthLabel(month)}
                        <ChevronDown size={15} />
                      </button>
                      <button
                        type="button"
                        className="icon-button"
                        aria-label="Next month"
                        disabled={month >= max.slice(0, 7)}
                        onClick={() => shiftMonth(1)}
                      >
                        <ChevronRight size={19} />
                      </button>
                    </div>
                    <div className="date-picker-weekdays" aria-hidden="true">
                      {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                        <span key={i}>{day}</span>
                      ))}
                    </div>
                    <div
                      className="date-picker-days"
                      role="group"
                      aria-label={`Dates in ${monthLabel(month)}`}
                    >
                      {Array.from({ length: 42 }, (_, i) => {
                        const date = new Date(start);
                        date.setDate(start.getDate() + i);
                        const key = keyFor(date);
                        return (
                          <button
                            type="button"
                            key={key}
                            ref={(node) => {
                              days.current[key] = node;
                            }}
                            disabled={key > max || key < "0001-01-01"}
                            aria-label={formatDate(key)}
                            aria-pressed={key === value}
                            aria-current={key === TODAY ? "date" : undefined}
                            className={`${key === value ? "selected" : ""} ${key.slice(0, 7) !== month ? "outside-month" : ""} ${key === TODAY ? "is-today" : ""}`}
                            onClick={() => choose(key)}
                            onKeyDown={(e) => dayKey(e, key)}
                          >
                            {date.getDate()}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
              <div className="month-picker-footer">
                <button type="button" onClick={close}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="month-picker-current"
                  onClick={() => choose(TODAY)}
                >
                  Today <CalendarDays size={15} />
                </button>
              </div>
            </div>
          </>,
          document.body,
        )}
    </>
  );
}
