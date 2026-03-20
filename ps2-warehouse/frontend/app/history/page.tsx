"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Package,
  Plus,
  User,
  FileDown,
  Play,
  Loader2,
} from "lucide-react";
import { API } from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import Link from "next/link";

interface SessionData {
  id: number;
  operator_id: string;
  batch_id: string;
  started_at: string;
  stopped_at: string | null;
  final_box_count: number;
  status: string;
  input_mode?: string;
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.getSessions()
      .then((data) => setSessions(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }) +
      ", " +
      d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="min-h-screen bg-bg">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-bg/80 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Package className="w-5 h-5 text-accent" />
            <span className="font-display font-bold text-sm tracking-wider text-text-primary">
              DECODERS
            </span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 bg-accent text-bg font-display font-semibold rounded-xl px-5 py-2 text-sm hover:bg-sky-300 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            New Session
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="font-display font-black text-3xl text-text-primary">
            SESSION HISTORY
          </h1>
          <p className="text-muted text-sm mt-1">
            {sessions.length} sessions recorded
          </p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Package className="w-16 h-16 text-muted mx-auto mb-4" />
            <p className="text-text-secondary text-lg font-medium">
              No sessions recorded yet
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 mt-4 text-accent hover:text-sky-300 text-sm font-semibold transition-colors"
            >
              Start your first packing session →
            </Link>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="mt-6"
          >
            <div className="bg-panel border border-border rounded-2xl overflow-hidden w-full">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface border-b border-border">
                    <th className="text-left px-4 py-3 text-muted text-xs uppercase tracking-widest font-display">
                      #
                    </th>
                    <th className="text-left px-4 py-3 text-muted text-xs uppercase tracking-widest font-display">
                      Operator
                    </th>
                    <th className="text-left px-4 py-3 text-muted text-xs uppercase tracking-widest font-display">
                      Batch ID
                    </th>
                    <th className="text-left px-4 py-3 text-muted text-xs uppercase tracking-widest font-display">
                      Date
                    </th>
                    <th className="text-left px-4 py-3 text-muted text-xs uppercase tracking-widest font-display">
                      Box Count
                    </th>
                    <th className="text-left px-4 py-3 text-muted text-xs uppercase tracking-widest font-display">
                      Status
                    </th>
                    <th className="text-right px-4 py-3 text-muted text-xs uppercase tracking-widest font-display">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-border/50 hover:bg-surface/60 transition-colors"
                    >
                      <td className="px-4 py-3.5 font-display font-bold text-accent">
                        {s.id}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-muted" />
                          <span className="text-text-primary text-sm">
                            {s.operator_id}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-mono bg-surface border border-border rounded px-2 py-0.5 text-sm text-text-secondary">
                          {s.batch_id}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-text-secondary text-sm">
                        {formatDate(s.started_at)}
                      </td>
                      <td className="px-4 py-3.5 font-display font-bold text-success text-lg">
                        {s.final_box_count}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          {s.status === "completed" && (
                            <>
                              <a
                                href={API.challanUrl(s.id)}
                                target="_blank"
                                className="p-2 rounded-lg hover:bg-surface border border-transparent hover:border-border text-muted hover:text-accent transition-all"
                                title="Download PDF"
                              >
                                <FileDown className="w-4 h-4" />
                              </a>
                              <a
                                href={API.videoUrl(s.id)}
                                target="_blank"
                                className="p-2 rounded-lg hover:bg-surface border border-transparent hover:border-border text-muted hover:text-accent transition-all"
                                title="Play Video"
                              >
                                <Play className="w-4 h-4" />
                              </a>
                            </>
                          )}
                          {(s.status === "active" ||
                            s.status === "processing") && (
                            <Link
                              href={`/session/${s.id}`}
                              className="text-xs text-accent hover:text-sky-300 font-semibold transition-colors"
                            >
                              View →
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
