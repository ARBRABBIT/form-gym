type MobileNavIconProps = {
  name: string;
  active: boolean;
};

/** Reference-matched navigation silhouettes, on a consistent 32px grid. */
export default function MobileNavIcon({ name, active }: MobileNavIconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {name === "overview" && (
        <path
          d="M5 14.2a4 4 0 0 1 1.3-3L13.4 5a4 4 0 0 1 5.2 0l7.1 6.2a4 4 0 0 1 1.3 3V25a2 2 0 0 1-2 2h-5v-8.2a1.2 1.2 0 0 0-1.2-1.2h-5.6a1.2 1.2 0 0 0-1.2 1.2V27H7a2 2 0 0 1-2-2Z"
          fill={active ? "currentColor" : "none"}
          strokeWidth={active ? "2.8" : "1.8"}
        />
      )}
      {name === "nutrition" && (
        <g transform="rotate(-22 16 16)">
          <path d="M14 4.5C7.5 4.5 4 9.7 4 16s3.5 11.5 10 11.5" />
          <path d="M20 4.5c5.1 1.4 8 5.7 8 11.5s-2.9 10.1-8 11.5c-3.1-3.7-4.7-7.6-4.7-11.5S16.9 8.2 20 4.5Z" />
        </g>
      )}
      {name === "workout" && (
        <>
          <circle cx="21.5" cy="5.5" r="2.7" />
          <path d="m6 14 5-4 6.5 2.5 3.5 5 5-2.5M17.5 12.5l-5 7 6 4 1.5 6M12.5 19.5 8 24l-6-1.5" />
          <path d="m12 10 4.5-2 2.5 2" />
        </>
      )}
      {name === "menu" && (
        <>
          <circle cx="16" cy="9" r="5" />
          <path d="M5 27v-2c0-4.5 4.9-7 11-7s11 2.5 11 7v2Z" />
        </>
      )}
      {name === "trainer" && (
        <>
          <circle cx="12" cy="10" r="4.5" />
          <path d="M3 27v-3c0-4 4-6 9-6s9 2 9 6v3ZM23 6a4.5 4.5 0 0 1 0 9m1 4c4 .7 5 2.7 5 5v3" />
        </>
      )}
    </svg>
  );
}
