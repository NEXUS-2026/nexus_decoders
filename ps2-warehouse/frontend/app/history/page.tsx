"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  User,
  FileDown,
  Play,
  Loader2,
  Terminal,
  Database,
  Inbox
} from "lucide-react";
import { API } from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";

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
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        console.log("Fetching sessions...");
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/sessions/`);
        console.log("Response status:", response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("Sessions data:", data);
        setSessions(data);
      } catch (error) {
        console.error("Error fetching sessions:", error);
        // Try the test endpoint to debug
        try {
          const testResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/test/test-db`);
          const testData = await testResponse.json();
          console.log("Database test:", testData);
        } catch (testError) {
          console.error("Database test failed:", testError);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchSessions();
  }, []);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return (
      d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }) +
      ", " +
      d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    );
  };

  return (
    <ProtectedRoute requiredRole="viewer">
      <main className="min-h-screen bg-black text-neutral-200 font-sans selection:bg-neutral-800 relative">
      {/* Subtle Technical Background - EXACT MATCH to page.tsx */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none fixed" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808025_1px,transparent_1px),linear-gradient(to_bottom,#80808025_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none fixed" />

      {/* Top Navigation Bar */}
      <Navbar title="Session History" />

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 pt-32 pb-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mb-8"
        >
          <h1 className="text-3xl font-medium tracking-tight text-neutral-100 mb-2 flex items-center gap-3">
            <Database className="w-7 h-7 text-neutral-600" />
            Deployment Logs
          </h1>
          <p className="text-sm text-neutral-500">
            {sessions.length} recorded inference sessions in the current environment.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 border border-neutral-800 rounded-lg bg-[#0A0A0A]/50">
            <Loader2 className="w-6 h-6 text-neutral-400 animate-spin mb-4" />
            <p className="text-[10px] text-neutral-500 font-mono tracking-widest uppercase">Fetching Records...</p>
          </div>
        ) : sessions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-32 border border-dashed border-neutral-800 rounded-lg bg-[#0A0A0A]/50"
          >
            <div className="w-12 h-12 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center mb-4">
              <Inbox className="w-5 h-5 text-neutral-500" />
            </div>
            <p className="text-neutral-200 text-sm font-medium mb-1">No sessions recorded yet</p>
            <p className="text-neutral-500 text-xs mb-6 text-center">Start your first packing session to generate telemetry.</p>
            <Link
              href="/"
              className="text-xs font-medium text-neutral-300 hover:text-white underline decoration-neutral-700 underline-offset-4 transition-colors"
            >
              Initialize a new session →
            </Link>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="w-full overflow-x-auto pb-4"
          >
            <div className="bg-[#0A0A0A] border border-neutral-800 rounded-lg shadow-2xl overflow-hidden min-w-[800px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-900/30 border-b border-neutral-800">
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-neutral-500 font-semibold w-20">ID</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-neutral-500 font-semibold">Operator</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-neutral-500 font-semibold">Batch ID</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-neutral-500 font-semibold">Date</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-neutral-500 font-semibold text-center">Box Count</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-neutral-500 font-semibold">Status</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-neutral-500 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/50">
                  {sessions.map((s) => (
                    <tr
                      key={s.id}
                      className="group hover:bg-neutral-900/30 transition-colors duration-200"
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-neutral-400">#{s.id}</span>
                      </td>
                     
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <User className="w-3.5 h-3.5 text-neutral-600" />
                          <span className="text-neutral-200 text-sm">
                            {s.operator_id}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-neutral-400 bg-neutral-900 border border-neutral-800 rounded px-2 py-1">
                          {s.batch_id}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-xs text-neutral-500 font-mono tracking-tight">
                        {formatDate(s.started_at)}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className="font-mono text-sm font-medium text-neutral-200">
                          {s.final_box_count}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <StatusBadge status={s.status} />
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-3">
                          {s.status === "completed" && (
                            <>
                              <a
                                href={API.challanUrl(s.id)}
                                target="_blank"
                                className="text-neutral-500 hover:text-neutral-200 transition-colors"
                                title="Download Manifest"
                              >
                                <FileDown className="w-4 h-4" />
                              </a>
                              <a
                                href={API.videoUrl(s.id)}
                                target="_blank"
                                className="text-neutral-500 hover:text-neutral-200 transition-colors"
                                title="Playback Video"
                              >
                                <Play className="w-4 h-4" />
                              </a>
                            </>
                          )}
                          {(s.status === "active" || s.status === "processing") && (
                            <Link
                              href={`/session/${s.id}`}
                              className="text-xs font-medium text-neutral-400 hover:text-neutral-100 transition-colors"
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
    </main>
    </ProtectedRoute>
  );
}
