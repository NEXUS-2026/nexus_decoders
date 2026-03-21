"use client";
import { motion } from "framer-motion";
import { ScanLine, Box } from "lucide-react";

interface Props {
  count: number;
  visible: number;
  active: boolean;
}

export default function CountDisplay({ count, visible, active }: Props) {
  return (
    <div
      className={`relative bg-[#0A0A0A] border rounded-xl p-8 flex flex-col items-center justify-center overflow-hidden transition-all duration-500 ${
        active
          ? "border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.05)]"
          : "border-neutral-800"
      }`}
    >
      {/* Dynamic Scanning Laser Effect (Visible only when active) */}
      {active && (
        <>
          <div className="absolute top-0 inset-x-0 h-[1px] bg-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,1)] animate-[scan_3s_ease-in-out_infinite]" />
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/[0.02] to-transparent pointer-events-none" />
        </>
      )}

      {/* Header Label */}
      <div className="flex items-center gap-2 mb-6 relative z-10">
        <ScanLine
          className={`w-4 h-4 ${
            active ? "text-emerald-500 animate-pulse" : "text-neutral-600"
          }`}
        />
        <p className="text-[10px] text-neutral-500 font-mono tracking-widest uppercase">
          Total Payload Indexed
        </p>
      </div>

      {/* The Main Counter */}
      <motion.div
        key={count} // Triggers animation every time the count changes
        initial={{ scale: 0.85, filter: "blur(4px)", opacity: 0.5 }}
        animate={{ scale: 1, filter: "blur(0px)", opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 25,
          mass: 0.5,
        }}
        className="relative z-10 mb-8"
      >
        <span
          className={`font-mono text-8xl md:text-9xl font-medium tracking-tighter tabular-nums ${
            active ? "text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" : "text-neutral-500"
          }`}
        >
          {count}
        </span>
      </motion.div>

      {/* Sub-Telemetry Grid */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-[240px] relative z-10 border-t border-white/[0.05] pt-5">
        <div className="text-center">
          <p className="text-[9px] text-neutral-600 font-mono uppercase tracking-widest mb-1.5 flex items-center justify-center gap-1">
            <Box className="w-3 h-3" /> Unique
          </p>
          <p className="text-sm font-mono text-neutral-300 tabular-nums">
            {count}
          </p>
        </div>
        <div className="text-center border-l border-white/[0.05]">
          <p className="text-[9px] text-neutral-600 font-mono uppercase tracking-widest mb-1.5 flex items-center justify-center gap-1">
            <ScanLine className="w-3 h-3" /> Active FOV
          </p>
          <p
            className={`text-sm font-mono tabular-nums transition-colors ${
              visible > 0 ? "text-emerald-400 font-semibold" : "text-neutral-500"
            }`}
          >
            {visible}
          </p>
        </div>
      </div>
    </div>
  );
}
