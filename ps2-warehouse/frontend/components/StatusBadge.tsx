"use client";

interface Props {
  status: string;
}

export default function StatusBadge({ status }: Props) {
  const isActive = status === "active";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
        isActive
          ? "bg-green-500/15 text-green-400 border border-green-500/20"
          : "bg-gray-500/15 text-gray-400 border border-gray-500/20"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-green-400 animate-pulse" : "bg-gray-400"}`} />
      {isActive ? "Active" : "Completed"}
    </span>
  );
}
