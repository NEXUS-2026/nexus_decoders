const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const WS_BASE = BASE_URL.replace("http", "ws");

export const API = {
  startSession: (operatorId: string, batchId: string) =>
    fetch(`${BASE_URL}/api/sessions/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operator_id: operatorId, batch_id: batchId }),
    }).then((r) => r.json()),

  stopSession: (sessionId: number) =>
    fetch(`${BASE_URL}/api/sessions/stop/${sessionId}`, { method: "POST" }).then((r) => r.json()),

  getSessions: () =>
    fetch(`${BASE_URL}/api/sessions/`).then((r) => r.json()),

  getSession: (id: number) =>
    fetch(`${BASE_URL}/api/sessions/${id}`).then((r) => r.json()),

  challanUrl: (sessionId: number) => `${BASE_URL}/api/files/challan/${sessionId}`,
  videoUrl: (sessionId: number) => `${BASE_URL}/api/files/video/${sessionId}`,
  feedWsUrl: (sessionId: number) => `${WS_BASE}/ws/feed/${sessionId}`,
};
