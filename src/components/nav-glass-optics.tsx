"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";

type Lens = { width: number; height: number; map: string };

// A capsule-shaped refraction field: only the rounded bevel displaces the backdrop.
// The center stays clear, and the actual navigation icons never pass through the filter.
function makeLens(width: number, height: number): Lens | null {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return null;
  const pixels = context.createImageData(width, height);
  const radius = height / 2;
  const bevel = Math.min(14, radius * .48);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x + .5 - Math.max(radius, Math.min(width - radius, x + .5));
      const dy = y + .5 - radius;
      const distance = Math.hypot(dx, dy);
      const depth = radius - distance;
      const bend = depth > 0 && depth < bevel ? Math.sin(Math.PI * depth / bevel) : 0;
      const offset = (y * width + x) * 4;
      pixels.data[offset] = 128 + (distance ? dx / distance : 0) * bend * 127;
      pixels.data[offset + 1] = 128 + (distance ? dy / distance : 0) * bend * 127;
      pixels.data[offset + 2] = 128;
      pixels.data[offset + 3] = 255;
    }
  }
  context.putImageData(pixels, 0, 0);
  return { width, height, map: canvas.toDataURL() };
}

export default function NavGlassOptics() {
  const id = `nav-glass-${useId().replace(/[^a-zA-Z0-9-]/g, "")}`;
  const svg = useRef<SVGSVGElement>(null);
  const [lenses, setLenses] = useState<Record<string, Lens>>({});

  useLayoutEffect(() => {
    if (!CSS.supports("backdrop-filter", 'url("#glass")')) return;
    const nav = svg.current?.closest("nav");
    const targets = [nav?.querySelector<HTMLElement>(".bottom-nav-tabs"), nav?.querySelector<HTMLElement>(".bottom-nav-add")];
    const dimensions = new Map<HTMLElement, string>();
    const observers = targets.map((target, index) => {
      if (!target) return null;
      const update = () => {
        const width = Math.round(target.clientWidth);
        const height = Math.round(target.clientHeight);
        const size = `${width}:${height}`;
        if (!width || !height || dimensions.get(target) === size) return;
        const lens = makeLens(width, height);
        if (!lens) return;
        dimensions.set(target, size);
        setLenses(current => ({ ...current, [index]: lens }));
        target.style.setProperty("--nav-refraction", `url("#${id}-${index}")`);
      };
      const observer = new ResizeObserver(update);
      observer.observe(target);
      update();
      return observer;
    });
    return () => {
      observers.forEach(observer => observer?.disconnect());
      targets.forEach(target => target?.style.removeProperty("--nav-refraction"));
    };
  }, [id]);

  return <svg ref={svg} className="nav-glass-optics" width="0" height="0" aria-hidden="true" focusable="false">
    <defs>{Object.entries(lenses).map(([key, lens]) => <filter key={key} id={`${id}-${key}`} x="0" y="0" width={lens.width} height={lens.height} filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
      <feImage href={lens.map} x="0" y="0" width={lens.width} height={lens.height} result="bevel" />
      <feDisplacementMap in="SourceGraphic" in2="bevel" scale="20" xChannelSelector="R" yChannelSelector="G" />
    </filter>)}</defs>
  </svg>;
}
