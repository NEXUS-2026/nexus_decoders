"use client";

interface Props {
  value: number;
  onChange: (v: number) => void;
}

export default function ConfidenceSlider({ value, onChange }: Props) {
  const pct = ((value - 0.1) / (0.95 - 0.1)) * 100;

  return (
    <div className="bg-panel border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="font-display text-xs tracking-widest text-muted uppercase">
          Detection Confidence
        </span>
        <span className="bg-accent/10 text-accent border border-accent/20 rounded-full px-3 py-0.5 text-sm font-display font-bold">
          {value.toFixed(2)}
        </span>
      </div>
      <input
        id="confidence-slider"
        type="range"
        min={0.1}
        max={0.95}
        step={0.05}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
        style={{
          background: `linear-gradient(to right, #38bdf8 ${pct}%, #1f2d44 ${pct}%)`,
        }}
      />
      <div className="flex justify-between mt-1.5">
        <span className="text-[10px] text-muted">0.10</span>
        <span className="text-[10px] text-muted">0.95</span>
      </div>
    </div>
  );
}
