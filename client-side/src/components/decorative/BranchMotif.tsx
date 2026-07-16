interface BranchMotifProps {
  className?: string;
}

/** Декоративная веточка с листьями — тонкая линия, цвет через currentColor. */
export function BranchMotif({ className = "" }: BranchMotifProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      aria-hidden="true"
    >
      <path d="M170 20 C 140 60, 120 90, 60 170" />
      <path d="M130 55 C 115 45, 100 48, 92 62" />
      <path d="M130 55 C 140 42, 155 42, 165 52" />
      <path d="M105 85 C 90 75, 75 78, 67 92" />
      <path d="M105 85 C 115 72, 130 72, 140 82" />
      <path d="M80 118 C 65 108, 50 111, 42 125" />
      <path d="M80 118 C 90 105, 105 105, 115 115" />
      <circle cx="170" cy="20" r="3" fill="currentColor" stroke="none" />
    </svg>
  );
}
