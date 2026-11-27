"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { MoveHorizontal, RotateCcw } from "./icons";
import { measurements, monthLabel } from "@/lib/model";
import {
  baselineValue,
  measurementChange,
  measurementUnit,
  previousMeasurementMonth,
} from "@/lib/measurement-comparison";
import type { ScreenProps } from "./journal-app";

const points: Record<string, [number, number]> = {
  Neck: [50, 14],
  Shoulders: [70, 19],
  Chest: [50, 24],
  Bicep: [77, 29],
  Waist: [50, 37],
  Hip: [59, 46],
  Thigh: [60, 59],
  Calf: [61, 79],
};

export default function BodyComparison({ p }: { p: ScreenProps }) {
  const body = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState("Waist");
  const [angle, setAngle] = useState(0);
  const previousMonth = previousMeasurementMonth(p.data.month);
  const now = p.data.measurements[p.data.month] || {};
  const previous = p.data.measurements[previousMonth] || {};

  function tilt(x: number, y = 0) {
    if (!body.current) return;
    gsap.to(body.current, {
      rotateY: x,
      rotateX: y,
      duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? 0
        : 0.55,
      ease: "power3.out",
      overwrite: true,
    });
  }

  return (
    <section
      className="body-comparison panel"
      aria-labelledby="body-comparison-title"
    >
      <header className="body-comparison-heading">
        <div>
          <h2 id="body-comparison-title">
            {p.trainerMode
              ? "Body measurements over time"
              : "Your body, over time"}
          </h2>
          <p>Compare your measurements for {monthLabel(p.data.month)}.</p>
        </div>
        <span className="body-comparison-legend">
          Change = selected month − comparison
        </span>
      </header>
      <div className="body-comparison-layout">
        <div className="body-history body-before">
          <header>
            <h3>Before</h3>
            <p>Your starting measurements</p>
          </header>
          <div className="body-column-labels">
            <span>Measurement</span>
            <span>Change</span>
          </div>
          {measurements.map((name) => {
            const value = baselineValue(p.data, name);
            const change = measurementChange(now[name], value);
            return (
              <div
                className={`body-measure-row ${active === name ? "is-active" : ""}`}
                key={name}
                onMouseEnter={() => setActive(name)}
              >
                <label>
                  <span>
                    {name}{" "}
                    <small>
                      {name === "Body Fat %" ? "" : measurementUnit(name)}
                    </small>
                  </span>
                  <input
                    aria-label={`${name} Before`}
                    type="number"
                    min="0"
                    step="any"
                    placeholder="—"
                    value={value}
                    onFocus={() => setActive(name)}
                    onChange={(event) =>
                      p.update((s) => ({
                        ...s,
                        baselineMeasurements: {
                          ...s.baselineMeasurements,
                          [name]: event.target.value,
                        },
                      }))
                    }
                  />
                </label>
                <span
                  className="body-delta"
                  aria-label={`${name} change since before`}
                >
                  {change === null
                    ? "—"
                    : `${change} ${name === "Body Fat %" ? "pp" : measurementUnit(name)}`}
                </span>
              </div>
            );
          })}
          <p className="body-history-note">
            Add the measurements you recorded when you started.
          </p>
        </div>
        <figure className="anatomy-figure">
          <div
            className="anatomy-stage"
            onPointerMove={(event) => {
              if (
                event.pointerType !== "mouse" ||
                window.matchMedia("(prefers-reduced-motion: reduce)").matches
              )
                return;
              const rect = event.currentTarget.getBoundingClientRect();
              tilt(
                angle + ((event.clientX - rect.left) / rect.width - 0.5) * 12,
                -((event.clientY - rect.top) / rect.height - 0.5) * 5,
              );
            }}
            onPointerLeave={() => tilt(angle)}
          >
            <div className="anatomy-body" ref={body}>
              <Image
                src="/images/anatomy-front.png"
                width={736}
                height={1472}
                sizes="(max-width: 700px) 280px, 380px"
                alt="Front view of the body's muscles, used as a measurement reference"
                priority
                draggable={false}
              />
              {Object.entries(points).map(([name, [x, y]]) => (
                <button
                  key={name}
                  type="button"
                  className={`anatomy-point ${active === name ? "is-active" : ""}`}
                  style={{ left: `${x}%`, top: `${y}%` }}
                  aria-label={`Show ${name} measurement`}
                  aria-pressed={active === name}
                  onClick={() => setActive(name)}
                >
                  <span />
                </button>
              ))}
            </div>
            <span className="anatomy-floor" aria-hidden="true" />
          </div>
          <figcaption>
            <strong>{active}</strong>
            <span>
              {now[active]?.trim()
                ? `${now[active]} ${measurementUnit(active)} this month`
                : "No measurement this month"}
            </span>
          </figcaption>
          <div className="anatomy-controls">
            <MoveHorizontal size={17} aria-hidden="true" />
            <label>
              <span className="sr-only">Body tilt</span>
              <input
                aria-label="Body tilt"
                type="range"
                min="-15"
                max="15"
                value={angle}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  setAngle(value);
                  tilt(value);
                }}
              />
            </label>
            <button
              type="button"
              className="icon-button"
              aria-label="Reset body view"
              onClick={() => {
                setAngle(0);
                tilt(0);
              }}
            >
              <RotateCcw size={17} />
            </button>
          </div>
          <p className="anatomy-caption">Anatomy reference · tilt to explore</p>
        </figure>
        <div className="body-history body-last-month">
          <header>
            <h3>Last month</h3>
            <p>{monthLabel(previousMonth)}</p>
          </header>
          <div className="body-column-labels">
            <span>Measurement</span>
            <span>Change</span>
          </div>
          {measurements.map((name) => {
            const value = previous[name];
            const change = measurementChange(now[name], value);
            return (
              <div
                className={`body-measure-row ${active === name ? "is-active" : ""}`}
                key={name}
                onMouseEnter={() => setActive(name)}
              >
                <button
                  type="button"
                  className="body-measure-value"
                  onClick={() => setActive(name)}
                >
                  <span>
                    {name}{" "}
                    <small>
                      {name === "Body Fat %" ? "" : measurementUnit(name)}
                    </small>
                  </span>
                  <strong>{value?.trim() || "—"}</strong>
                </button>
                <span
                  className="body-delta"
                  aria-label={`${name} change since last month`}
                >
                  {change === null
                    ? "—"
                    : `${change} ${name === "Body Fat %" ? "pp" : measurementUnit(name)}`}
                </span>
              </div>
            );
          })}
          <p className="body-history-note">
            {Object.values(previous).some((v) => v.trim())
              ? "Saved values from the previous calendar month."
              : "No measurements saved for this month yet."}
          </p>
        </div>
      </div>
      <p className="body-comparison-footnote">
        Body fat changes are in percentage points (pp). The anatomy image is a
        visual reference; it does not change shape with your measurements.
      </p>
    </section>
  );
}
