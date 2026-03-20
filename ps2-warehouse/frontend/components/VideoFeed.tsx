"use client";
import { useEffect, useRef, useState } from "react";
import { WifiOff, Loader2 } from "lucide-react";
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
    <div className="bg-panel border border-border rounded-2xl overflow-hidden shadow-panel">
      {/* Header Bar */}
      <div className="bg-surface px-4 py-2.5 flex items-center justify-between border-b border-border">
        <span className="font-display text-xs tracking-widest text-muted uppercase">
          Live Feed
        </span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted font-mono">640 × 480</span>
          {connected && (
            <span className="text-xs text-accent font-mono bg-accent/10 px-2 py-0.5 rounded">
              {fps} fps
            </span>
          )}
          <div className="flex items-center gap-1.5">
            <div
              className={`w-2 h-2 rounded-full ${
                connected ? "bg-success animate-pulse" : "bg-red-500"
              }`}
            />
            <span className="text-xs text-muted">
              {connected ? "Connected" : "Offline"}
            </span>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative">
        <canvas ref={canvasRef} className="w-full aspect-video bg-black" />

        {/* Disconnected Overlay */}
        {!connected && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="text-center">
              <WifiOff className="w-10 h-10 text-muted mx-auto mb-3" />
              <p className="text-text-secondary text-sm font-medium">
                Waiting for detection engine...
              </p>
              <div className="flex items-center justify-center gap-2 mt-3">
                <Loader2 className="w-4 h-4 text-accent animate-spin" />
                <p className="text-muted text-xs">Connecting</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
