"use client";
import StatusBadge from "./StatusBadge";
import { API } from "@/lib/api";
import { FileDown, Play, User, Box, Calendar, Clock } from "lucide-react";

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
    <div className="bg-[#0A0A0A] border border-neutral-800 rounded-lg p-6 hover:border-neutral-700 transition-colors duration-200 flex flex-col h-full group">
     
      {/* Header Area */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-neutral-700 rounded-sm inline-block" />
            SYS.ID <span className="text-neutral-400">#{session.id}</span>
          </p>
          <p className="text-xs font-mono font-medium text-neutral-300 bg-neutral-900 border border-neutral-800 rounded px-2 py-1 inline-block">
            {session.batch_id}
          </p>
        </div>
        <StatusBadge status={session.status} />
      </div>

      {/* Telemetry Data Grid */}
      <div className="grid grid-cols-2 gap-y-5 gap-x-4 mb-6 flex-1">
        <div>
          <p className="text-[10px] text-neutral-600 font-mono uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
            <User className="w-3 h-3" /> Operator
          </p>
          <p className="text-xs text-neutral-200 font-medium">{session.operator_id}</p>
        </div>
        <div>
          <p className="text-[10px] text-neutral-600 font-mono uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
            <Box className="w-3 h-3" /> Payload
          </p>
          <p className="text-xs font-mono text-neutral-200 font-medium">
            {session.final_box_count} <span className="text-neutral-600 text-[10px]">UNITS</span>
          </p>
        </div>
        <div>
          <p className="text-[10px] text-neutral-600 font-mono uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3 h-3" /> Date
          </p>
          <p className="text-xs font-mono text-neutral-400">
            {startDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-neutral-600 font-mono uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
            <Clock className="w-3 h-3" /> Time
          </p>
          <p className="text-xs font-mono text-neutral-400">
            {startDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      {/* Action Buttons (Appears only when completed) */}
      {session.status === "completed" && (
        <div className="flex gap-2 pt-4 border-t border-neutral-800 mt-auto">
          <a
            href={API.challanUrl(session.id)}
            target="_blank"
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded border border-neutral-800 bg-[#050505] text-[10px] font-mono tracking-widest uppercase text-neutral-400 hover:text-neutral-200 hover:border-neutral-600 transition-all group/btn"
          >
            <FileDown className="w-3.5 h-3.5 group-hover/btn:-translate-y-0.5 transition-transform" /> Manifest
          </a>
          <a
            href={API.videoUrl(session.id)}
            target="_blank"
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded border border-neutral-800 bg-[#050505] text-[10px] font-mono tracking-widest uppercase text-neutral-400 hover:text-neutral-200 hover:border-neutral-600 transition-all group/btn"
          >
            <Play className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" /> Playback
          </a>
        </div>
      )}
    </div>
  );
}
