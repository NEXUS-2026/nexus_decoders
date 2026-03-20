"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Package,
  Square,
  Loader2,
  CheckCircle2,
  FileDown,
  Video,
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

  // Fetch session info
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

  // Poll detection status for upload mode
  useEffect(() => {
    if (!sessionInfo || sessionInfo.input_mode !== "upload" || stopped) return;

    const interval = setInterval(async () => {
      try {
        const status = await API.getDetectionStatus(sessionId);
        if (status.count !== undefined) setCount(status.count);
        if (status.visible !== undefined) setVisible(status.visible);

        if (status.status === "completed") {
          clearInterval(interval);
          // Fetch final session data
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

  // Elapsed timer
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

  return (
    <div className="min-h-screen bg-bg">
      {/* Sticky Navbar */}
      <nav className="sticky top-0 z-50 bg-bg/80 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Left */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <Package className="w-5 h-5 text-accent" />
              <span className="font-display font-bold text-sm tracking-wider text-text-primary">
                PACKTRAQ
              </span>
            </Link>
            <span className="bg-surface border border-border rounded-full px-3 py-1 text-xs font-display text-text-secondary">
              Session #{sessionId}
            </span>
          </div>

          {/* Center — Live indicator */}
          {!stopped && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse inline-block" />
              <span className="text-success text-xs font-semibold tracking-widest uppercase">
                {sessionInfo?.input_mode === "upload" ? "PROCESSING" : "LIVE"}
              </span>
            </div>
          )}

          {/* Right */}
          {!stopped && isLive && (
            <button
              onClick={handleStop}
              disabled={stopping}
              className="bg-red-600/90 hover:bg-red-500 text-white font-display font-semibold rounded-xl px-6 py-2 transition-all active:scale-95 flex items-center gap-2 text-sm disabled:opacity-50"
            >
              {stopping ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Stopping...
                </>
              ) : (
                <>
                  <Square className="w-3.5 h-3.5" />
                  Stop Session
                </>
              )}
            </button>
          )}
          {stopped && (
            <Link
              href="/history"
              className="text-sm text-muted hover:text-text-primary transition-colors"
            >
              View History →
            </Link>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-3 space-y-6">
          {/* Video Feed */}
          {!stopped && (
            <VideoFeed
              sessionId={sessionId}
              onCountUpdate={handleCountUpdate}
              onVisibleUpdate={handleVisibleUpdate}
            />
          )}

          {/* Confidence Slider */}
          {!stopped && isLive && (
            <ConfidenceSlider value={conf} onChange={setConf} />
          )}

          {/* Processing progress for upload mode */}
          {!stopped && sessionInfo?.input_mode === "upload" && (
            <UploadProgress sessionId={sessionId} />
          )}
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Count Display */}
          <CountDisplay count={count} visible={visible} active={!stopped} />

          {/* Session Info or Complete Panel */}
          {!stopped ? (
            <div className="bg-panel border border-border rounded-2xl p-5">
              <div className="grid grid-cols-3 gap-4 divide-x divide-border">
                <div className="text-center">
                  <p className="text-muted text-xs uppercase tracking-wide">
                    Operator
                  </p>
                  <p className="font-display font-semibold text-text-primary text-sm mt-1">
                    {sessionInfo?.operator_id || "—"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-muted text-xs uppercase tracking-wide">
                    Batch
                  </p>
                  <p className="font-display font-semibold text-text-primary text-sm mt-1">
                    {sessionInfo?.batch_id || "—"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-muted text-xs uppercase tracking-wide">
                    Elapsed
                  </p>
                  <p className="font-display font-semibold text-text-primary text-sm mt-1 font-mono">
                    {formatElapsed(elapsedSeconds)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-panel border border-success/30 rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-5">
                  <CheckCircle2 className="w-8 h-8 text-success" />
                  <h2 className="font-display font-bold text-xl text-text-primary">
                    SESSION COMPLETE
                  </h2>
                </div>

                <p className="font-display text-5xl font-black text-success text-center mb-6">
                  {result.final_box_count}
                </p>
                <p className="text-muted text-sm text-center mb-6">
                  boxes counted
                </p>

                <div className="space-y-3">
                  <a
                    href={API.challanUrl(sessionId)}
                    target="_blank"
                    className="w-full flex items-center justify-center gap-2 bg-accent text-bg font-display font-bold rounded-xl py-3.5 hover:bg-sky-300 transition-all active:scale-95"
                  >
                    <FileDown className="w-4 h-4" />
                    Download Challan PDF
                  </a>
                  <a
                    href={API.videoUrl(sessionId)}
                    target="_blank"
                    className="w-full flex items-center justify-center gap-2 border border-border text-text-primary hover:bg-surface font-display font-semibold rounded-xl py-3.5 transition-all"
                  >
                    <Video className="w-4 h-4" />
                    Download Session Video
                  </a>
                </div>

                <video
                  src={API.videoUrl(sessionId)}
                  controls
                  className="w-full rounded-xl mt-5 border border-border"
                />
              </motion.div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

/* Upload Progress Component */
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
    <div className="bg-panel border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="font-display text-xs tracking-widest text-muted uppercase">
          Detection Progress
        </span>
        <span className="text-xs text-accent font-display font-bold">
          {progress}%
        </span>
      </div>
      <div className="w-full bg-surface rounded-full h-2 overflow-hidden">
        <div
          className="bg-accent h-full rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-muted mt-2">
        {status === "running"
          ? "Analyzing video frames..."
          : status === "completed"
          ? "Detection complete!"
          : status === "error"
          ? "An error occurred"
          : "Initializing..."}
      </p>
    </div>
  );
}
