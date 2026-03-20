"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { API } from "@/lib/api";

export default function SessionForm() {
  const router = useRouter();
  const [operatorId, setOperatorId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleStart() {
    if (!operatorId || !batchId) return;
    setLoading(true);
    try {
      const session = await API.startSession(operatorId, batchId);
      router.push(`/session/${session.session_id}`);
    } catch (err) {
      console.error("Failed to start session:", err);
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">New Session</h2>
            <p className="text-sm text-gray-400">Start a packing session</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Operator ID</label>
            <input
              id="operator-id"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              placeholder="e.g. OP001"
              value={operatorId}
              onChange={(e) => setOperatorId(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Batch ID</label>
            <input
              id="batch-id"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              placeholder="e.g. BATCH-42"
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
            />
          </div>

          <button
            id="start-session-btn"
            className="w-full mt-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-xl px-6 py-3.5 font-semibold text-base transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 active:scale-[0.98]"
            onClick={handleStart}
            disabled={loading || !operatorId || !batchId}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Starting...
              </span>
            ) : (
              "Start Session"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
