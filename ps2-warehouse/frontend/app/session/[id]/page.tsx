"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Square,
  Loader2,
  CheckCircle2,
  FileDown,
  Video,
  Terminal,
  User,
  Database,
  Clock,
  Activity,
  ArrowRight
} from "lucide-react";
import VideoFeed from "@/components/VideoFeed";
import CountDisplay from "@/components/CountDisplay";
import ConfidenceSlider from "@/components/ConfidenceSlider";
import { API } from "@/lib/api";
import Link from "next/link";

interface SessionInfo {
  id: number;
  operator_id: string;
  batch_id: string;
  started_at: string;
  status: string;
  input_mode: string;
  final_box_count: number;
}

interface SessionResult {
  session_id: number;
  final_box_count: number;
  challan_url: string;
  video_url: string;
}

export default function SessionPage() {
  const params = useParams();
  const sessionId = Number(params.id);

  const [count, setCount] = useState(0);
  const [visible, setVisible] = useState(0);
  const [conf, setConf] = useState(0.45);
  const [stopped, setStopped] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [result, setResult] = useState<SessionResult | null>(null);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // --- LOGIC REMAINS UNCHANGED ---
  useEffect(() => {
    API.getSession(sessionId)
      .then((data) => {
        setSessionInfo(data);
        if (data.status === "completed") {
          setStopped(true);
          setResult({
            session_id: data.id,
            final_box_count: data.final_box_count,
            challan_url: `/api/files/challan/${data.id}`,
            video_url: `/api/files/video/${data.id}`,
          });
        }
      })
      .catch(console.error);
  }, [sessionId]);

  useEffect(() => {
    if (!sessionInfo || sessionInfo.input_mode !== "upload" || stopped) return;

    const interval = setInterval(async () => {
      try {
        const status = await API.getDetectionStatus(sessionId);
        if (status.count !== undefined) setCount(status.count);
        if (status.visible !== undefined) setVisible(status.visible);

        if (status.status === "completed") {
          clearInterval(interval);
          const session = await API.getSession(sessionId);
          setStopped(true);
          setResult({
            session_id: session.id,
            final_box_count: session.final_box_count,
            challan_url: `/api/files/challan/${session.id}`,
            video_url: `/api/files/video/${session.id}`,
          });
          setCount(session.final_box_count);
        }
      } catch {
        /* ignore */
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionId, sessionInfo, stopped]);

  useEffect(() => {
    if (stopped) return;
    const interval = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [stopped]);

  const formatElapsed = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleCountUpdate = useCallback((c: number) => setCount(c), []);
  const handleVisibleUpdate = useCallback((v: number) => setVisible(v), []);

  async function handleStop() {
    setStopping(true);
    try {
      const data = await API.stopSession(sessionId);
      setResult(data);
      setStopped(true);
      setCount(data.final_box_count);
    } catch (err) {
      console.error("Failed to stop session:", err);
    }
    setStopping(false);
  }

  const isLive = sessionInfo?.input_mode === "live";
  // --------------------------------------

  return (
    <main className="min-h-screen bg-black text-neutral-200 font-sans selection:bg-neutral-800 relative flex flex-col">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none fixed" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none fixed" />

      {/* System HUD Navbar */}
      <nav className="fixed top-0 w-full border-b border-neutral-800 bg-black/50 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
         
          {/* Left: Branding & ID */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-5 h-5 bg-neutral-100 rounded-sm flex items-center justify-center">
                <Terminal className="w-3 h-3 text-black" />
              </div>
              <span className="font-semibold text-sm tracking-wide text-neutral-100 hidden sm:inline-block">
                DECODERS
              </span>
            </Link>
            <div className="h-4 w-px bg-neutral-800" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 bg-neutral-900 border border-neutral-800 px-2 py-1 rounded">
              SYS.ID <span className="text-white">#{sessionId}</span>
            </span>
          </div>

          {/* Center: Status Indicator */}
          {!stopped && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${sessionInfo?.input_mode === "upload" ? "bg-amber-400" : "bg-emerald-400"}`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${sessionInfo?.input_mode === "upload" ? "bg-amber-500" : "bg-emerald-500"}`} />
              </span>
              <span className={`text-[10px] font-mono tracking-widest uppercase ${sessionInfo?.input_mode === "upload" ? "text-amber-500" : "text-emerald-500"}`}>
                {sessionInfo?.input_mode === "upload" ? "ANALYZING PAYLOAD" : "LIVE TELEMETRY"}
              </span>
            </div>
          )}

          {/* Right: Actions */}
          <div className="flex items-center gap-4">
            {!stopped && isLive && (
              <button
                onClick={handleStop}
                disabled={stopping}
                className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] font-mono uppercase tracking-widest px-4 py-2 rounded transition-all disabled:opacity-50"
              >
                {stopping ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    TERMINATING...
                  </>
                ) : (
                  <>
                    <Square className="w-3 h-3 fill-current" />
                    TERMINATE UPLINK
                  </>
                )}
              </button>
            )}
            {stopped && (
              <Link
                href="/history"
                className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 hover:text-white transition-colors flex items-center gap-2"
              >
                RETURN TO LOGS <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Main Layout Grid */}
      <div className="max-w-7xl w-full mx-auto p-6 pt-24 pb-16 flex-1 flex flex-col relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
         
          {/* Left Column (Video & Inputs) - 7 cols */}
          <div className="lg:col-span-7 space-y-6 flex flex-col">
            {!stopped && (
              <VideoFeed
                sessionId={sessionId}
                onCountUpdate={handleCountUpdate}
                onVisibleUpdate={handleVisibleUpdate}
              />
            )}

            {!stopped && isLive && (
              <ConfidenceSlider value={conf} onChange={setConf} />
            )}

            {!stopped && sessionInfo?.input_mode === "upload" && (
              <UploadProgress sessionId={sessionId} />
            )}
          </div>

          {/* Right Column (Telemetry & Logs) - 5 cols */}
          <div className="lg:col-span-5 space-y-6">
           
            <CountDisplay count={count} visible={visible} active={!stopped} />

            {/* Session Info Box */}
            {!stopped ? (
              <div className="bg-[#0A0A0A] border border-neutral-800 rounded-xl p-6">
                <div className="grid grid-cols-3 gap-4 divide-x divide-neutral-800">
                  <div className="text-center px-2">
                    <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-2 flex items-center justify-center gap-1.5">
                      <User className="w-3 h-3" /> Operator
                    </p>
                    <p className="font-mono font-medium text-neutral-200 text-sm truncate">
                      {sessionInfo?.operator_id || "—"}
                    </p>
                  </div>
                  <div className="text-center px-2">
                    <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-2 flex items-center justify-center gap-1.5">
                      <Database className="w-3 h-3" /> Batch
                    </p>
                    <p className="font-mono font-medium text-neutral-200 text-sm truncate bg-neutral-900 border border-neutral-800 rounded px-1 py-0.5 inline-block">
                      {sessionInfo?.batch_id || "—"}
                    </p>
                  </div>
                  <div className="text-center px-2">
                    <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-2 flex items-center justify-center gap-1.5">
                      <Clock className="w-3 h-3" /> Elapsed
                    </p>
                    <p className="font-mono font-medium text-blue-400 text-sm">
                      {formatElapsed(elapsedSeconds)}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Session Complete Panel */
              result && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="bg-[#0A0A0A] border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.05)] rounded-xl p-8 flex flex-col relative overflow-hidden"
                >
                  <div className="absolute top-0 inset-x-0 h-1 bg-emerald-500" />
                 
                  <div className="flex items-center gap-3 mb-8">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    <h2 className="font-mono text-sm tracking-widest uppercase text-emerald-500 font-semibold">
                      Pipeline Terminated Successfully
                    </h2>
                  </div>

                  <div className="text-center mb-10 relative">
                     <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                     <p className="font-mono text-7xl font-medium text-white tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(16,185,129,0.3)] relative z-10">
                      {result.final_box_count}
                     </p>
                     <p className="text-[10px] font-mono text-neutral-500 tracking-widest uppercase mt-4">
                      Total Units Indexed
                     </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-auto">
                    <a
                      href={API.challanUrl(sessionId)}
                      target="_blank"
                      className="flex items-center justify-center gap-2 bg-[#050505] border border-neutral-800 hover:border-neutral-600 text-neutral-300 font-mono text-[10px] uppercase tracking-widest rounded-lg py-3 transition-colors group"
                    >
                      <FileDown className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
                      Manifest
                    </a>
                    <a
                      href={API.videoUrl(sessionId)}
                      target="_blank"
                      className="flex items-center justify-center gap-2 bg-[#050505] border border-neutral-800 hover:border-neutral-600 text-neutral-300 font-mono text-[10px] uppercase tracking-widest rounded-lg py-3 transition-colors group"
                    >
                      <Video className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
                      Playback
                    </a>
                  </div>
                </motion.div>
              )
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

/* Updated Upload Progress Component */
function UploadProgress({ sessionId }: { sessionId: number }) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("processing");

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const data = await API.getDetectionStatus(sessionId);
        setProgress(data.progress || 0);
        setStatus(data.status || "unknown");
        if (data.status === "completed" || data.status === "error") {
          clearInterval(interval);
        }
      } catch {
        /* ignore */
      }
    }, 500);
    return () => clearInterval(interval);
  }, [sessionId]);

  return (
    <div className="bg-[#0A0A0A] border border-neutral-800 rounded-xl p-6 relative overflow-hidden">
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-500 animate-pulse" />
          <span className="font-mono text-[10px] tracking-widest text-neutral-400 uppercase">
            Inference Pipeline Status
          </span>
        </div>
        <span className="text-xs font-mono text-blue-400 tabular-nums">
          {progress.toFixed(0)}%
        </span>
      </div>
     
      <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden mb-3 relative z-10">
        <div
          className="bg-blue-500 h-full rounded-full transition-all duration-300 relative"
          style={{ width: `${progress}%` }}
        >
          {/* Shine effect on progress bar */}
          <div className="absolute top-0 right-0 bottom-0 w-10 bg-gradient-to-r from-transparent to-white/30" />
        </div>
      </div>
     
      <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest relative z-10">
        <span className="text-blue-500 mr-2">❯</span>
        {status === "running"
          ? "Processing tensor graph..."
          : status === "completed"
          ? "Extraction complete. Terminating."
          : status === "error"
          ? "Pipeline encountered an error."
          : "Initializing matrices..."}
      </p>
    </div>
  );
}
