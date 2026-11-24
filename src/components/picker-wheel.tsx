"use client";

import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";

const ROW = 40;

/** Native momentum scrolling and snap points, with a bounded DOM even for 9,999 years. */
export default function PickerWheel({ label, values, value, onChange }: {
  label: string;
  values: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  const selected = Math.max(0, values.indexOf(value));
  const [center, setCenter] = useState(selected);
  const scroller = useRef<HTMLDivElement>(null);
  const current = useRef(-1);
  const search = useRef({ text: "", time: 0 });
  const id = useId();
  // Keep the destination mounted before a keyboard jump so native snap can reach it.
  const visibleIndices = [...new Set([center, selected].flatMap(index =>
    Array.from({ length: 11 }, (_, offset) => index + offset - 5).filter(i => i >= 0 && i < values.length),
  ))].sort((a, b) => a - b);

  useLayoutEffect(() => {
    if (current.current !== selected) {
      current.current = selected;
      setCenter(selected);
      scroller.current?.scrollTo({ top: selected * ROW, behavior: "instant" });
    }
  }, [selected]);

  const choose = (index: number) => onChange(values[Math.max(0, Math.min(values.length - 1, index))]);
  const keyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const steps: Record<string, number> = { ArrowUp: -1, ArrowDown: 1, PageUp: -5, PageDown: 5 };
    if (event.key in steps) {
      event.preventDefault();
      choose(selected + steps[event.key]);
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      choose(event.key === "Home" ? 0 : values.length - 1);
    } else if (event.key.length === 1 && !event.altKey && !event.metaKey && !event.ctrlKey) {
      event.preventDefault();
      const now = Date.now();
      search.current.text = (now - search.current.time < 700 ? search.current.text : "") + event.key.toLowerCase();
      search.current.time = now;
      const match = values.findIndex(item => item.toLowerCase().startsWith(search.current.text));
      if (match >= 0) choose(match);
    }
  };

  return <div className="picker-wheel-column">
    <span className="picker-wheel-label" id={`${id}-label`}>{label}</span>
    <div ref={scroller} className="picker-wheel" role="listbox" aria-labelledby={`${id}-label`} aria-activedescendant={`${id}-${selected}`} tabIndex={0}
      onKeyDown={keyDown}
      onScroll={event => {
        const index = Math.max(0, Math.min(values.length - 1, Math.round(event.currentTarget.scrollTop / ROW)));
        setCenter(index);
        if (current.current !== index) {
          current.current = index;
          onChange(values[index]);
        }
      }}>
      <div className="picker-wheel-track" style={{height: (values.length + 4) * ROW}}>
        {visibleIndices.map(index => {
          const item = values[index];
          const distance = Math.min(3, Math.abs(index - center));
          return <div key={item} id={`${id}-${index}`} role="option" aria-selected={selected === index} aria-posinset={index + 1} aria-setsize={values.length}
            className={`picker-wheel-option ${selected === index ? "selected" : ""}`}
            style={{top: (index + 2) * ROW, transform:`scale(${1 - distance * .045})`}}
            onClick={() => { choose(index); scroller.current?.focus({preventScroll:true}); }}>
            {item}
          </div>;
        })}
      </div>
    </div>
  </div>;
}
