"use client";
import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, UploadCloud, Radio, X, FileVideo } from "lucide-react";
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

  // --- LOGIC REMAINS EXACTLY UNCHANGED ---
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
  // --------------------------------------

  return (
    <div className="bg-[#0A0A0A] border border-neutral-800 rounded-lg shadow-2xl overflow-hidden">
      {/* Segmented Control Header */}
      <div className="p-1 border-b border-neutral-800 bg-neutral-900/30">
        <div className="flex relative bg-neutral-950 rounded-md p-1">
          {/* Sliding Background Indicator */}
          <div
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-neutral-800 rounded shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              inputMode === "upload" ? "translate-x-0" : "translate-x-[calc(100%+8px)]"
            }`}
          />
         
          <button
            onClick={() => setInputMode("upload")}
            className={`relative z-10 flex-1 py-2 text-xs font-medium tracking-wide transition-colors duration-200 ${
              inputMode === "upload" ? "text-neutral-100" : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            Batch Upload
          </button>
          <button
            onClick={() => setInputMode("live")}
            className={`relative z-10 flex-1 py-2 text-xs font-medium tracking-wide transition-colors duration-200 ${
              inputMode === "live" ? "text-neutral-100" : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            Live Stream
          </button>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* Identifiers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="operator-id" className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest">
              Operator ID
            </label>
            <input
              id="operator-id"
              className="w-full bg-transparent border-b border-neutral-800 py-2 text-sm text-neutral-200 font-mono placeholder:text-neutral-700 focus:border-neutral-400 focus:outline-none transition-colors"
              placeholder="OP-001"
              value={operatorId}
              onChange={(e) => setOperatorId(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="batch-id" className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest">
              Batch ID
            </label>
            <input
              id="batch-id"
              className="w-full bg-transparent border-b border-neutral-800 py-2 text-sm text-neutral-200 font-mono placeholder:text-neutral-700 focus:border-neutral-400 focus:outline-none transition-colors"
              placeholder="BATCH-042"
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
            />
          </div>
        </div>

        {/* Dynamic Source Input Area */}
        <div className="min-h-[140px] flex flex-col justify-end">
          <AnimatePresence mode="wait">
            {inputMode === "upload" ? (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <div
                  className={`h-full border border-dashed rounded-md p-6 flex flex-col items-center justify-center transition-colors cursor-pointer ${
                    dragActive
                      ? "border-neutral-400 bg-neutral-900"
                      : videoFile
                      ? "border-neutral-600 bg-neutral-900/50"
                      : "border-neutral-800 hover:border-neutral-600 bg-neutral-950/50"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileChange} className="hidden" />
                 
                  {videoFile ? (
                    <div className="flex items-center gap-4 w-full">
                      <div className="p-3 bg-neutral-800 rounded border border-neutral-700">
                        <FileVideo className="w-5 h-5 text-neutral-300" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-sm text-neutral-200 font-medium truncate">{videoFile.name}</p>
                        <p className="text-xs text-neutral-500 font-mono mt-0.5">{(videoFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setVideoFile(null); }}
                        className="p-2 text-neutral-500 hover:text-neutral-200 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <UploadCloud className="w-6 h-6 text-neutral-600 mx-auto mb-3" />
                      <p className="text-sm text-neutral-400">
                        Drop video file here or <span className="text-neutral-200 underline decoration-neutral-700 underline-offset-4">browse</span>
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="live"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                className="h-full bg-neutral-950 border border-neutral-800 rounded-md p-6 flex items-start gap-4"
              >
                <Radio className="w-5 h-5 text-neutral-400 mt-0.5" />
                <div>
                  <h5 className="text-sm font-medium text-neutral-200 mb-1">Live Endpoint Standby</h5>
                  <p className="text-xs text-neutral-500 leading-relaxed max-w-sm">
                    Generate a session ID to initialize the socket. Point your local camera feed to the established endpoint.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer Action */}
      <div className="p-4 bg-neutral-900/50 border-t border-neutral-800 flex justify-end">
        <button
          className="px-6 py-2.5 bg-neutral-100 hover:bg-white text-black font-medium text-sm rounded transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
          onClick={handleStart}
          disabled={loading || !canStart}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin w-4 h-4" />
              Initializing
            </>
          ) : (
            "Deploy Session"
          )}
        </button>
      </div>
    </div>
  );
}
