"use client";

import { useEffect, useRef, type RefObject } from "react";

const active = new WeakMap<Element, Animation>();
const motionQuery = "(prefers-reduced-motion: reduce)";

export function cancelFeedback(element: Element | null) {
  if (element) active.get(element)?.cancel();
}

/** A new action replaces its previous feedback, never delaying the data update. */
export function playFeedback(element: Element | null, kind: "value" | "complete") {
  if (!element) return null;
  cancelFeedback(element);
  const preference = matchMedia(motionQuery);
  if (typeof element.animate !== "function" || preference.matches) return null;
  const frames: Keyframe[] = kind === "value"
    ? [{ opacity: .72, transform: "translateY(2px)" }, { opacity: 1, transform: "translateY(0)" }]
    : [{ boxShadow: "0 0 0 0 rgb(154 214 189 / 0)" }, { boxShadow: "0 0 0 5px rgb(154 214 189 / 28%)", offset: .35 }, { boxShadow: "0 0 0 8px rgb(154 214 189 / 0)" }];
  const animation = element.animate(frames, { duration: kind === "value" ? 220 : 280, easing: "cubic-bezier(.16,1,.3,1)", id: `form-${kind}-feedback` });
  active.set(element, animation);
  const stopIfReduced = () => { if (preference.matches) animation.cancel(); };
  preference.addEventListener("change", stopIfReduced);
  const release = () => {
    preference.removeEventListener("change", stopIfReduced);
    if (active.get(element) === animation) active.delete(element);
  };
  animation.onfinish = release;
  animation.oncancel = release;
  return animation;
}

/** Acknowledge changes, not initial render; announce the real value immediately. */
export function useValueFeedback(ref: RefObject<HTMLElement | null>, value: number) {
  const previous = useRef(value);
  useEffect(() => {
    if (Object.is(previous.current, value)) return;
    previous.current = value;
    const animation = playFeedback(ref.current, "value");
    return () => { animation?.cancel(); };
  }, [ref, value]);
}
