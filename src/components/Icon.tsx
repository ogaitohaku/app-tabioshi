const PATHS = {
  play: "M7 5v14l11-7z",
  home: "M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  map: "M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14",
  bookmark: "M6 3h12v18l-6-4-6 4z",
  copy: "M8 8h11v11H8zM5 16V5h11",
  check: "M5 12l5 5L20 7",
  pin: "M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21zM12 7.3a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 0 0 0-4.4z",
  bed: "M3 18V7M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5M7 11.5a1.5 1.5 0 1 0 0-.01",
  food: "M7 3v8a2 2 0 0 0 2 2v8M11 3v8M7 7h4M17 3c-2 2-2 6 0 8v10",
  gift: "M4 10h16v10H4zM3 7h18v3H3zM12 7v13M12 7c-2-4-6-3-5 0M12 7c2-4 6-3 5 0",
  spot: "M3 19l6-9 4 5 3-4 5 8z",
  arrow: "M5 12h14M13 6l6 6-6 6",
  back: "M15 5l-7 7 7 7",
  external: "M7 17L17 7M8 7h9v9",
  star: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z",
  share: "M12 3v12M7 8l5-5 5 5M5 14v6h14v-6",
  globe: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, className = "h-5 w-5", fill = false }: { name: IconName; className?: string; fill?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill={fill ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={fill ? 0 : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
