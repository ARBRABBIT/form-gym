"use client";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { Droplet, BookOpen, Watch, X } from "./icons";
import { lockModalBackground, useModalViewport } from "./modal-environment";
const items = [
  ["water", "Water", Droplet],
  ["planner", "Journal", BookOpen],
  ["connections", "Devices", Watch],
] as const;
export default function TrainerMoreMenu({
  open,
  id,
  trigger,
  onClose,
  onSelect,
}: {
  open: boolean;
  id: string;
  trigger: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  onSelect: (page: string) => void;
}) {
  const [present, setPresent] = useState(open);
  const overlay = useRef<HTMLDivElement>(null),
    panel = useRef<HTMLElement>(null),
    selection = useRef<string | null>(null);
  const callbacks = useRef({ onClose, onSelect });
  callbacks.current = { onClose, onSelect };
  useEffect(() => {
    if (open) setPresent(true);
  }, [open]);
  useModalViewport(overlay, present);
  useLayoutEffect(() => {
    if (!present) return;
    const restore = lockModalBackground();
    panel.current
      ?.querySelector<HTMLButtonElement>("button")
      ?.focus({ preventScroll: true });
    return () => {
      restore();
      if (!selection.current) trigger.current?.focus({ preventScroll: true });
    };
  }, [present, trigger]);
  useLayoutEffect(() => {
    if (!present) return;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    if (preference.matches) {
      if (!open) setPresent(false);
      return;
    }
    let active = true;
    const animation = panel.current?.animate(
      open
        ? [
            { opacity: 0, transform: "translateY(16px) scale(.96)" },
            { opacity: 1, transform: "translateY(0) scale(1)" },
          ]
        : [
            { opacity: 1, transform: "translateY(0) scale(1)" },
            { opacity: 0, transform: "translateY(10px) scale(.97)" },
          ],
      {
        duration: open ? 210 : 150,
        easing: "cubic-bezier(.16,1,.3,1)",
        fill: "both",
        id: "trainer-more-panel",
      },
    );
    const shade = overlay.current?.animate(
      open
        ? [{ opacity: 0 }, { opacity: 1 }]
        : [{ opacity: 1 }, { opacity: 0 }],
      { duration: open ? 160 : 150, fill: "both", id: "trainer-more-overlay" },
    );
    if (!open)
      void animation?.finished
        .then(() => {
          if (active) setPresent(false);
        })
        .catch(() => {});
    const finish = () => {
      if (preference.matches) {
        animation?.finish();
        shade?.finish();
      }
    };
    preference.addEventListener("change", finish);
    return () => {
      active = false;
      animation?.cancel();
      shade?.cancel();
      preference.removeEventListener("change", finish);
    };
  }, [open, present]);
  useEffect(() => {
    if (!present && selection.current) {
      const page = selection.current;
      selection.current = null;
      callbacks.current.onSelect(page);
      requestAnimationFrame(() =>
        document
          .getElementById("member-page-title")
          ?.focus({ preventScroll: true }),
      );
    }
  }, [present]);
  if (!present) return null;
  return createPortal(
    <div
      ref={overlay}
      id={id}
      className="trainer-more-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="More member tools"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) callbacks.current.onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          callbacks.current.onClose();
          return;
        }
        if (event.key !== "Tab") return;
        const targets = overlay.current?.querySelectorAll<HTMLButtonElement>(
          "button:not(:disabled)",
        );
        if (!targets?.length) return;
        const first = targets[0],
          last = targets[targets.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }}
    >
      <nav
        ref={panel}
        className="trainer-more-popover"
        aria-label="Additional member sections"
      >
        {items.map(([page, label, Icon]) => (
          <button
            type="button"
            key={page}
            className="trainer-more-tile"
            aria-label={label}
            title={label}
            disabled={!open}
            onClick={() => {
              selection.current = page;
              callbacks.current.onClose();
            }}
          >
            <span>
              <Icon size={30} />
            </span>
          </button>
        ))}
      </nav>
      <button
        type="button"
        className="trainer-more-close"
        aria-label="Close More menu"
        onClick={() => callbacks.current.onClose()}
      >
        <X size={25} />
      </button>
    </div>,
    document.body,
  );
}
