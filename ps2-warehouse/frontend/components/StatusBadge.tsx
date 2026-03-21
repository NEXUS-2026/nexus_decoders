"use client";

interface Props {
  status: string;
}

export default function StatusBadge({ status }: Props) {
  const normalizedStatus = status.toLowerCase();

  // Define our enterprise color palette for statuses
  let config = {
    bg: "bg-neutral-500/10",
    border: "border-neutral-500/20",
    text: "text-neutral-400",
    dot: "bg-neutral-500",
    label: normalizedStatus.toUpperCase(),
    animate: false,
  };

  if (normalizedStatus === "active" || normalizedStatus === "live") {
    config = {
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      text: "text-blue-400",
      dot: "bg-blue-500",
      label: "LIVE",
      animate: true,
    };
  } else if (normalizedStatus === "processing") {
    config = {
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      text: "text-amber-400",
      dot: "bg-amber-500",
      label: "PROCESSING",
      animate: true, // Pulses to show it's working
    };
  } else if (normalizedStatus === "completed" || normalizedStatus === "done") {
    config = {
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      text: "text-emerald-400",
      dot: "bg-emerald-500",
      label: "COMPLETED",
      animate: false,
    };
  } else if (normalizedStatus === "error" || normalizedStatus === "failed") {
    config = {
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      text: "text-red-400",
      dot: "bg-red-500",
      label: "FAILED",
      animate: false,
    };
  }

  return (
    <span
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md border ${config.bg} ${config.border} ${config.text} font-mono text-[10px] font-semibold uppercase tracking-widest transition-colors`}
    >
      <span className="relative flex h-1.5 w-1.5">
        {/* The radar ping animation for active states */}
        {config.animate && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.dot}`}
          ></span>
        )}
        {/* The solid center dot */}
        <span
          className={`relative inline-flex rounded-full h-1.5 w-1.5 ${config.dot}`}
        ></span>
      </span>
      {config.label}
    </span>
  );
}
