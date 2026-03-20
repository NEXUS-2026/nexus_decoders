"use client";
import { useEffect, useRef, useState } from "react";
import { API } from "@/lib/api";

interface Props {
  sessionId: number;
  onCountUpdate: (count: number) => void;
}

export default function VideoFeed({ sessionId, onCountUpdate }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(API.feedWsUrl(sessionId));
    wsRef.current = ws;
    ws.binaryType = "arraybuffer";

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);

    ws.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        // JPEG frame — draw to canvas
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
        // JSON count update
        try {
          const data = JSON.parse(event.data);
          if (data.count !== undefined) onCountUpdate(data.count);
        } catch { /* ignore parse errors */ }
      }
    };

    // Keep-alive ping every 10s
    const ping = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.send("ping");
    }, 10000);

    return () => {
      clearInterval(ping);
      ws.close();
    };
  }, [sessionId, onCountUpdate]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/50">
      {/* Connection indicator */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5">
        <div className={`w-2 h-2 rounded-full ${connected ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
        <span className="text-xs text-gray-300">{connected ? "LIVE" : "Disconnected"}</span>
      </div>

      <canvas
        ref={canvasRef}
        className="w-full aspect-video bg-gray-900"
      />

      {!connected && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="text-center">
            <svg className="w-12 h-12 text-gray-500 mx-auto mb-3 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-400 text-sm">Waiting for detection engine...</p>
            <p className="text-gray-600 text-xs mt-1">Start the engine to see live feed</p>
          </div>
        </div>
      )}
    </div>
  );
}
