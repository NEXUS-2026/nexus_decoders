"use client";

interface Props {
  status: string;
}

export default function StatusBadge({ status }: Props) {
  const isActive = status === "active" || status === "processing";
  const isProcessing = status === "processing";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-display font-semibold border tracking-widest inline-flex items-center gap-1.5 ${
        isActive
          ? "bg-accent/10 text-accent border-accent/20 animate-pulse"
          : "bg-success/10 text-success border-success/20"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isActive ? "bg-accent" : "bg-success"
        }`}
      />
      {isProcessing ? "PROCESSING" : isActive ? "● LIVE" : "✓ DONE"}
    </span>
  );
}
