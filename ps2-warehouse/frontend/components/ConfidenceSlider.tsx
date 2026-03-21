"use client";
import { SlidersHorizontal } from "lucide-react";

interface Props {
  value: number;
  onChange: (v: number) => void;
}

export default function ConfidenceSlider({ value, onChange }: Props) {
  // Calculate percentage for the dynamic track fill
  const pct = ((value - 0.1) / (0.95 - 0.1)) * 100;

  return (
    <div className="bg-[#0A0A0A] border border-neutral-800 rounded-xl p-6 relative group hover:border-neutral-700 transition-colors duration-300">
     
      {/* Header & Value Display */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-neutral-600 group-hover:text-blue-500 transition-colors" />
          <span className="font-mono text-[10px] tracking-widest text-neutral-500 uppercase">
            Detection Threshold
          </span>
        </div>
       
        {/* Technical Value Readout */}
        <div className="bg-[#050505] border border-neutral-800 rounded flex items-center justify-center px-2.5 py-1 shadow-inner">
          <span className="text-xs font-mono text-blue-400 tabular-nums font-semibold tracking-wide shadow-[0_0_15px_rgba(59,130,246,0.1)]">
            {value.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Custom Slider Input */}
      <div className="relative w-full flex items-center py-2">
        <input
          id="confidence-slider"
          type="range"
          min={0.1}
          max={0.95}
          step={0.05}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-1.5 appearance-none rounded-full cursor-pointer outline-none
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                     [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#0A0A0A]
                     [&::-webkit-slider-thumb]:hover:scale-125 [&::-webkit-slider-thumb]:shadow-[0_0_15px_rgba(59,130,246,0.6)]
                     [&::-webkit-slider-thumb]:transition-transform
                     [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-blue-500
                     [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#0A0A0A] [&::-moz-range-thumb]:rounded-full
                     [&::-moz-range-thumb]:hover:scale-125 [&::-moz-range-thumb]:shadow-[0_0_15px_rgba(59,130,246,0.6)]
                     [&::-moz-range-thumb]:transition-transform"
          style={{
            // Dynamic linear gradient to color the track behind the thumb blue, and ahead of the thumb dark gray
            background: `linear-gradient(to right, #3b82f6 ${pct}%, #262626 ${pct}%)`,
          }}
        />
      </div>

      {/* Min/Max Boundary Labels */}
      <div className="flex justify-between mt-2 px-1 text-[9px] font-mono text-neutral-600 tracking-wider">
        <span>MIN 0.10</span>
        <span>MAX 0.95</span>
      </div>
    </div>
  );
}
