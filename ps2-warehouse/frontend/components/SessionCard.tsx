"use client";
import StatusBadge from "./StatusBadge";
import { API } from "@/lib/api";

interface SessionData {
  id: number;
  operator_id: string;
  batch_id: string;
  started_at: string;
  stopped_at: string | null;
  final_box_count: number;
  status: string;
}

interface Props {
  session: SessionData;
}

export default function SessionCard({ session }: Props) {
  const startDate = new Date(session.started_at);

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 hover:bg-white/8 transition-all duration-200 group">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-gray-400">Session #{session.id}</p>
          <p className="text-lg font-bold text-white">{session.batch_id}</p>
        </div>
        <StatusBadge status={session.status} />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <p className="text-[11px] text-gray-500 uppercase tracking-wider">Operator</p>
          <p className="text-sm text-gray-200 font-medium">{session.operator_id}</p>
        </div>
        <div>
          <p className="text-[11px] text-gray-500 uppercase tracking-wider">Box Count</p>
          <p className="text-sm text-green-400 font-bold">{session.final_box_count}</p>
        </div>
        <div>
          <p className="text-[11px] text-gray-500 uppercase tracking-wider">Date</p>
          <p className="text-sm text-gray-200">{startDate.toLocaleDateString()}</p>
        </div>
        <div>
          <p className="text-[11px] text-gray-500 uppercase tracking-wider">Time</p>
          <p className="text-sm text-gray-200">{startDate.toLocaleTimeString()}</p>
        </div>
      </div>

      {session.status === "completed" && (
        <div className="flex gap-2 pt-3 border-t border-white/5">
          <a
            href={API.challanUrl(session.id)}
            target="_blank"
            className="flex-1 text-center text-xs font-semibold py-2 rounded-lg bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 border border-blue-500/20 transition-all"
          >
            📄 Challan
          </a>
          <a
            href={API.videoUrl(session.id)}
            target="_blank"
            className="flex-1 text-center text-xs font-semibold py-2 rounded-lg bg-purple-500/15 text-purple-400 hover:bg-purple-500/25 border border-purple-500/20 transition-all"
          >
            🎬 Video
          </a>
        </div>
      )}
    </div>
  );
}
