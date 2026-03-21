"use client";
import { useEffect, useRef, useState } from "react";
import { WifiOff, Loader2, MonitorPlay } from "lucide-react";
import { API } from "@/lib/api";

interface Props {
  sessionId: number;
  onCountUpdate: (count: number) => void;
  onVisibleUpdate?: (visible: number) => void;
}

export default function VideoFeed({
  sessionId,
  onCountUpdate,
  onVisibleUpdate,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [fps, setFps] = useState(0);
  const frameCountRef = useRef(0);

  useEffect(() => {
    const ws = new WebSocket(API.feedWsUrl(sessionId));
    wsRef.current = ws;
    ws.binaryType = "arraybuffer";

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    // FPS counter
    const fpsInterval = setInterval(() => {
      setFps(frameCountRef.current);
      frameCountRef.current = 0;
    }, 1000);

    ws.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        frameCountRef.current++;
        const blob = new Blob([event.data], { type: "image/jpeg" });
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const ctx = canvas.getContext("2d");
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);
          URL.revokeObjectURL(url);
        };
        img.src = url;
      } else {
        try {
          const data = JSON.parse(event.data);
          if (data.count !== undefined) onCountUpdate(data.count);
          if (data.visible !== undefined && onVisibleUpdate)
            onVisibleUpdate(data.visible);
        } catch {
          /* ignore */
        }
      }
    };

    // Keep-alive ping every 10s
    const ping = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.send("ping");
    }, 10000);

    return () => {
      clearInterval(ping);
      clearInterval(fpsInterval);
      ws.close();
    };
  }, [sessionId, onCountUpdate, onVisibleUpdate]);

  return (
    <div className="bg-[#0A0A0A] border border-neutral-800 rounded-xl overflow-hidden shadow-2xl flex flex-col relative group">
      {/* Background ambient glow behind the player */}
      <div className="absolute -inset-[1px] bg-gradient-to-b from-white/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Header Bar HUD */}
      <div className="bg-[#050505] px-4 py-3 flex items-center justify-between border-b border-neutral-800 relative z-10">
        {/* Top subtle highlight line */}
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

        <div className="flex items-center gap-2.5">
          <MonitorPlay className="w-4 h-4 text-neutral-500" />
          <span className="font-sans text-[10px] font-semibold tracking-widest text-neutral-300 uppercase">
            Live Feed
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-[10px] text-neutral-600 font-mono tracking-widest hidden sm:inline-block">
            640x480
          </span>
         
          {connected && (
            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded shadow-[0_0_10px_rgba(16,185,129,0.1)]">
              {fps} FPS
            </span>
          )}
         
          <div className="flex items-center gap-2 pl-4 border-l border-neutral-800">
            <span className="relative flex h-2 w-2">
              {connected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  connected ? "bg-emerald-500" : "bg-red-500"
                }`}
              ></span>
            </span>
            <span className={`text-[10px] font-mono uppercase tracking-widest ${connected ? "text-emerald-500" : "text-neutral-500"}`}>
              {connected ? "SYS.ONLINE" : "OFFLINE"}
            </span>
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="relative w-full aspect-video bg-black flex-1 overflow-hidden">
        {/* Abstract grid behind the canvas (visible before video loads or when transparent) */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        <canvas
          ref={canvasRef}
          className="w-full h-full object-contain relative z-10"
        />

        {/* Disconnected / Awaiting Uplink Overlay */}
        {!connected && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#050505]/80 backdrop-blur-md z-20">
            <div className="text-center flex flex-col items-center">
              {/* Custom animated scanner icon */}
              <div className="w-14 h-14 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center mb-5 relative shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                <div className="absolute inset-0 rounded-full border border-neutral-700 border-t-blue-500/50 animate-spin" />
                <WifiOff className="w-5 h-5 text-neutral-500" />
              </div>
             
              <p className="text-neutral-200 text-sm font-medium mb-1.5 tracking-wide">
                Awaiting Engine Uplink
              </p>
             
              <div className="flex items-center justify-center gap-2 text-neutral-500 bg-neutral-900/50 px-3 py-1.5 rounded-md border border-neutral-800">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <p className="text-[10px] font-mono tracking-widest uppercase">
                  Listening on WebSocket...
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
