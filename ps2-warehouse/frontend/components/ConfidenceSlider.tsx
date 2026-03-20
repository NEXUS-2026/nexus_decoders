"use client";

interface Props {
  value: number;
  onChange: (v: number) => void;
}

export default function ConfidenceSlider({ value, onChange }: Props) {
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-medium text-gray-300">
          Confidence Threshold
        </label>
        <span className="text-sm font-bold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-lg">
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
        className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer accent-blue-500"
      />
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-gray-600">0.10</span>
        <span className="text-[10px] text-gray-600">0.95</span>
      </div>
    </div>
  );
}
