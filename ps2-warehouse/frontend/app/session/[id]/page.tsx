"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import VideoFeed from "@/components/VideoFeed";
import CountDisplay from "@/components/CountDisplay";
import ConfidenceSlider from "@/components/ConfidenceSlider";
import { API } from "@/lib/api";

interface SessionResult {
  session_id: number;
  final_box_count: number;
  challan_url: string;
  video_url: string;
}

export default function SessionPage() {
  const params = useParams();
  const sessionId = Number(params.id);
  const router = useRouter();

  const [count, setCount] = useState(0);
  const [conf, setConf] = useState(0.45);
  const [stopped, setStopped] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [result, setResult] = useState<SessionResult | null>(null);

  async function handleStop() {
    setStopping(true);
    try {
      const data = await API.stopSession(sessionId);
      setResult(data);
      setStopped(true);
    } catch (err) {
      console.error("Failed to stop session:", err);
    }
    setStopping(false);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-gray-500">Live Session</p>
          <h1 className="text-2xl font-bold tracking-tight">Session #{sessionId}</h1>
        </div>
        {!stopped && (
          <button
            id="stop-session-btn"
            className="bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/20 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
            onClick={handleStop}
            disabled={stopping}
          >
            {stopping ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Stopping...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="1" />
                </svg>
                Stop Session
              </span>
            )}
          </button>
        )}
      </div>

      {/* Video Feed */}
      <VideoFeed sessionId={sessionId} onCountUpdate={setCount} />

      {/* Count Display */}
      <CountDisplay count={count} />

      {/* Controls */}
      {!stopped && (
        <div className="mt-4">
          <ConfidenceSlider value={conf} onChange={setConf} />
        </div>
      )}

      {/* Completed State */}
      {stopped && result && (
        <div className="mt-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-green-500/15 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Session Complete</h2>
              <p className="text-sm text-gray-400">
                Final count: <span className="text-green-400 font-bold">{result.final_box_count}</span> boxes
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href={API.challanUrl(sessionId)}
              target="_blank"
              className="flex items-center justify-center gap-2 bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 border border-blue-500/20 py-3 rounded-xl font-semibold text-sm transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download Challan (PDF)
            </a>
            <button
              onClick={() => router.push("/history")}
              className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 py-3 rounded-xl font-semibold text-sm transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              View History
            </button>
          </div>

          {/* Recorded Video Playback */}
          <div className="mt-5">
            <p className="text-sm text-gray-400 mb-2">Recorded Video</p>
            <video
              src={API.videoUrl(sessionId)}
              controls
              className="w-full rounded-xl border border-white/10"
            />
          </div>
        </div>
      )}
    </div>
  );
}
