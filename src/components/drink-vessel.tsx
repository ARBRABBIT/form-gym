import { useId } from "react";

export default function DrinkVessel({ kind }: { kind: "glass" | "mug" | "bottle" }) {
  const id = useId().replace(/:/g, "");
  const shape = kind === "bottle"
    ? "M66 22H94V43Q94 49 107 59Q112 63 112 73V132Q112 144 100 144H60Q48 144 48 132V73Q48 63 53 59Q66 49 66 43Z"
    : "M38 37H122L113 131Q80 146 47 131Z";
  return <svg className={`drink-vessel drink-vessel-${kind}`} viewBox="0 0 160 160" aria-hidden="true">
    <defs>
      <linearGradient id={`${id}-glass`}><stop stopColor="#fff" stopOpacity=".42" /><stop offset=".25" stopColor="#fff" stopOpacity=".06" /><stop offset=".75" stopColor="#fff" stopOpacity=".16" /><stop offset="1" stopColor="#fff" stopOpacity=".55" /></linearGradient>
      <linearGradient id={`${id}-water`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fff" stopOpacity=".04" /><stop offset="1" stopColor="#fff" stopOpacity=".3" /></linearGradient>
      <clipPath id={`${id}-clip`}><path d={shape} /></clipPath>
    </defs>
    {kind === "mug" && <path d="M119 62C159 46 160 113 118 113L120 102C145 101 145 66 119 74Z" fill={`url(#${id}-glass)`} stroke="#fff" strokeOpacity=".55" strokeWidth="2" />}
    <path d={shape} fill={`url(#${id}-glass)`} stroke="#fff" strokeOpacity=".55" strokeWidth="1.4" />
    <g clipPath={`url(#${id}-clip)`}>
      <path d="M25 79Q80 68 135 79V150H25Z" fill={`url(#${id}-water)`} />
      <ellipse cx="80" cy="79" rx="47" ry="8" fill="#fff" fillOpacity=".13" stroke="#fff" strokeOpacity=".5" />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(index => <circle key={index} cx={53 + index * 19 % 54} cy={91 + index * 11 % 40} r={index % 3 === 0 ? 1.6 : .8} fill="none" stroke="#fff" strokeOpacity=".65" strokeWidth=".7" />)}
      <path d="M45 43 53 128M115 43 107 127" stroke="#fff" strokeOpacity=".5" strokeWidth="2" />
    </g>
    {kind === "bottle" ? <rect x="63" y="16" width="34" height="12" rx="4" fill="#fff" fillOpacity=".3" stroke="#fff" strokeOpacity=".6" /> : <>
      <ellipse cx="80" cy="37" rx="42" ry="8" fill="#fff" fillOpacity=".12" stroke="#fff" strokeOpacity=".75" strokeWidth="1.5" />
      <ellipse cx="80" cy="37" rx="36" ry="5" fill="none" stroke="#fff" strokeOpacity=".35" />
    </>}
    <path d="M50 133Q80 145 110 133" fill="none" stroke="#fff" strokeOpacity=".6" strokeWidth="2" />
  </svg>;
}
