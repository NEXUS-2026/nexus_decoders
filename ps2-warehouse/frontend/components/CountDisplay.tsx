"use client";

interface Props {
  count: number;
  visible: number;
  active: boolean;
}

export default function CountDisplay({ count, visible, active }: Props) {
  return (
    <div
      className={`bg-panel border border-border rounded-2xl p-8 text-center ${
        active ? "animate-pulse_ring" : ""
      }`}
    >
      <p className="text-muted text-xs tracking-widest uppercase mb-4">
        BOXES COUNTED
      </p>
      <span
        key={count}
        className="font-display font-black text-8xl text-success leading-none inline-block animate-count_pop"
      >
        {count}
      </span>
      <p className="text-muted text-sm mt-3">unique boxes detected</p>
      <p className="text-text-secondary text-sm mt-1">
        {visible} visible in frame
      </p>
    </div>
  );
}
