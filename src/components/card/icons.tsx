// Small inline icons that match the wireframes' strokes.

export function Flame({ fill, stroke, size = 14 }: { fill: string; stroke: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" strokeWidth={2} strokeLinejoin="round">
      <path
        d="M12 2.5c.6 3.2 4.8 5 4.8 10.1a4.8 4.8 0 0 1-9.6 0c0-2.6 1.4-4.3 2.7-5.4.1 1.9.9 3.1 2 3.1 0-3.1-1.2-5.2.1-7.8z"
        fill={fill}
        stroke={stroke}
      />
    </svg>
  );
}

export function Snowflake({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#2F6BD9" strokeWidth={2} strokeLinecap="round">
      <path d="M12 2v20M4 7l16 10M20 7L4 17M9 3.5l3 2.5 3-2.5M9 20.5l3-2.5 3 2.5" />
    </svg>
  );
}

export function Moon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#5B6170" strokeWidth={2} strokeLinejoin="round">
      <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
    </svg>
  );
}
