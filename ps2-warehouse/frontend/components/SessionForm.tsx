"use client";
import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { User, Hash, Loader2, Upload, Radio, Film } from "lucide-react";
import { API } from "@/lib/api";

export default function SessionForm() {
  const router = useRouter();
  const [operatorId, setOperatorId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [loading, setLoading] = useState(false);
  const [inputMode, setInputMode] = useState<"upload" | "live">("upload");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files?.[0] && files[0].type.startsWith("video/")) {
      setVideoFile(files[0]);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setVideoFile(file);
  };

  async function handleStart() {
    if (!operatorId || !batchId) return;
    if (inputMode === "upload" && !videoFile) return;

    setLoading(true);
    try {
      const session = await API.startSession(operatorId, batchId, inputMode);
      const sessionId = session.session_id;

      if (inputMode === "upload" && videoFile) {
        await API.uploadVideo(sessionId, videoFile);
      }

      router.push(`/session/${sessionId}`);
    } catch (err) {
      console.error("Failed to start session:", err);
      setLoading(false);
    }
  }

  const canStart =
    operatorId &&
    batchId &&
    (inputMode === "live" || (inputMode === "upload" && videoFile));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="w-full max-w-md"
    >
      <div className="bg-panel border border-border rounded-2xl p-8 shadow-panel">
        <p className="text-accent text-xs font-semibold tracking-widest uppercase mb-6">
          NEW SESSION
        </p>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setInputMode("upload")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              inputMode === "upload"
                ? "bg-accent/15 text-accent border border-accent/30"
                : "bg-surface border border-border text-muted hover:text-text-primary"
            }`}
          >
            <Upload className="w-4 h-4" />
            Upload Video
          </button>
          <button
            onClick={() => setInputMode("live")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              inputMode === "live"
                ? "bg-accent/15 text-accent border border-accent/30"
                : "bg-surface border border-border text-muted hover:text-text-primary"
            }`}
          >
            <Radio className="w-4 h-4" />
            Live Feed
          </button>
        </div>

        <div className="space-y-4">
          {/* Operator ID */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
              <User className="w-4 h-4" />
            </div>
            <input
              id="operator-id"
              className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-3 text-text-primary font-body placeholder:text-muted focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
              placeholder="e.g. OP-001"
              value={operatorId}
              onChange={(e) => setOperatorId(e.target.value)}
            />
          </div>

          {/* Batch ID */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
              <Hash className="w-4 h-4" />
            </div>
            <input
              id="batch-id"
              className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-3 text-text-primary font-body placeholder:text-muted focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
              placeholder="e.g. BATCH-042"
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
            />
          </div>

          {/* Video Upload Zone */}
          {inputMode === "upload" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                  dragActive
                    ? "border-accent bg-accent/5"
                    : videoFile
                    ? "border-success/40 bg-success/5"
                    : "border-border hover:border-muted"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {videoFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <Film className="w-5 h-5 text-success" />
                    <div className="text-left">
                      <p className="text-sm text-text-primary font-medium truncate max-w-[200px]">
                        {videoFile.name}
                      </p>
                      <p className="text-xs text-muted">
                        {(videoFile.size / (1024 * 1024)).toFixed(1)} MB
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setVideoFile(null);
                      }}
                      className="text-muted hover:text-red-400 text-xs ml-2"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-muted mx-auto mb-2" />
                    <p className="text-sm text-muted">
                      Drag & drop video file or{" "}
                      <span className="text-accent">browse</span>
                    </p>
                    <p className="text-xs text-muted/60 mt-1">
                      MP4, AVI, MOV supported
                    </p>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {/* Live Feed Note */}
          {inputMode === "live" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-surface border border-border rounded-xl p-4"
            >
              <p className="text-xs text-text-secondary">
                <Radio className="w-3.5 h-3.5 inline mr-1.5 text-accent" />
                Start the session, then run the detection engine on your Linux machine pointing to this session ID.
              </p>
            </motion.div>
          )}

          {/* Start Button */}
          <button
            id="start-session-btn"
            className="w-full bg-accent text-bg font-display font-bold text-base rounded-xl py-4 hover:bg-sky-300 transition-all shadow-glow-blue active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed mt-2"
            onClick={handleStart}
            disabled={loading || !canStart}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin w-4 h-4" />
                Initializing...
              </span>
            ) : (
              "Start Session"
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
