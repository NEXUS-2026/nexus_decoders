"use client";

interface Props {
  count: number;
  label?: string;
}

export default function CountDisplay({ count, label = "Box Count" }: Props) {
  return (
    <div className="text-center py-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 mb-2">{label}</p>
      <div className="relative inline-block">
        <p className="text-8xl font-black tabular-nums bg-gradient-to-b from-green-300 to-green-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(74,222,128,0.3)]">
          {count}
        </p>
      </div>
    </div>
  );
}
