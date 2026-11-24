"use client";
import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";

/** The raster supplies realistic materials; this mechanical dial stays live. */
export default function OnboardingScale({
  weight = "",
  className = "",
}: {
  weight?: string;
  className?: string;
}) {
  const input = Number(weight);
  const valid =
    weight.trim() !== "" && Number.isFinite(input) && input > 0 && input <= 700;
  const value = valid ? input : 0;
  const capacity = Math.max(200, Math.ceil((value + 1) / 100) * 100);
  const dial = useRef<SVGGElement>(null);
  const animated = useRef({ value });
  const mounted = useRef(false);
  const [reading, setReading] = useState(value);
  useLayoutEffect(() => {
    const element = dial.current;
    if (!element) return;
    const rotation = (-value / capacity) * 360;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!mounted.current || reduced) {
      gsap.set(element, { rotation, svgOrigin: "130 195" });
      animated.current.value = value;
      setReading(value);
      mounted.current = true;
      return;
    }
    const timeline = gsap.timeline();
    timeline
      .to(
        element,
        {
          rotation,
          svgOrigin: "130 195",
          duration: 1.05,
          ease: "power3.out",
          overwrite: "auto",
        },
        0,
      )
      .to(
        animated.current,
        {
          value,
          duration: 1.05,
          ease: "power3.out",
          onUpdate: () => setReading(animated.current.value),
        },
        0,
      );
    return () => {
      timeline.kill();
    };
  }, [value, capacity]);
  return (
    <div
      className={`onboarding-scale ${className}`}
      aria-hidden="true"
      data-illustration="weight"
      data-weight={valid ? value : ""}
    >
      <div className="onboarding-scale-pose">
        <img
          src="/images/onboarding-scale.webp"
          width={640}
          height={640}
          alt=""
          draggable={false}
        />
        <div className="onboarding-scale-window">
          <svg viewBox="0 0 260 140" fill="none" className="scale-live-dial">
            <defs>
              <linearGradient
                id="scale-face"
                x1="130"
                y1="0"
                x2="130"
                y2="140"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#e2d9c7" />
                <stop offset=".22" stopColor="#fbf6e8" />
                <stop offset="1" stopColor="#e7ddc8" />
              </linearGradient>
            </defs>
            <rect width="260" height="140" rx="5" fill="url(#scale-face)" />
            <g ref={dial} className="scale-dial-wheel">
              {Array.from({ length: 40 }, (_, index) => (
                <g key={index} transform={`rotate(${index * 9} 130 195)`}>
                  <path
                    d={`M130 19V${index % 4 === 0 ? 39 : index % 2 === 0 ? 32 : 28}`}
                    stroke="#595248"
                    strokeWidth={index % 4 === 0 ? 2.7 : 1.4}
                  />
                  {index % 4 === 0 && (
                    <text
                      x="130"
                      y="65"
                      textAnchor="middle"
                      fill="#343029"
                      fontFamily="Helvetica, Arial, sans-serif"
                      fontSize="24"
                    >
                      {(index / 40) * capacity}
                    </text>
                  )}
                </g>
              ))}
            </g>
            <path d="M123 1H137L130 32Z" fill="#262626" />
            <path d="M129 2H131L130 24Z" fill="#999a94" />
            <path d="M25 89H235" stroke="#c4bba8" strokeWidth="1" />
            <text
              x="130"
              y="120"
              textAnchor="middle"
              fill="#292923"
              fontFamily="Helvetica, Arial, sans-serif"
              fontSize="31"
              fontWeight="500"
              className="scale-live-reading"
            >
              {valid ? reading.toFixed(1) : "—"}
              <tspan fontSize="15" dx="7">
                kg
              </tspan>
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
}
