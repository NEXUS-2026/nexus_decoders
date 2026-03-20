const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const WS = BASE.replace(/^http/, "ws");

export const API = {
  startSession: (operatorId: string, batchId: string, inputMode: string = "upload") =>
    fetch(`${BASE}/api/sessions/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        operator_id: operatorId,
        batch_id: batchId,
        input_mode: inputMode,
      }),
    }).then((r) => r.json()),

  uploadVideo: (sessionId: number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return fetch(`${BASE}/api/sessions/upload-video/${sessionId}`, {
      method: "POST",
      body: formData,
    }).then((r) => r.json());
  },

  getDetectionStatus: (sessionId: number) =>
    fetch(`${BASE}/api/sessions/detection-status/${sessionId}`).then((r) => r.json()),

  stopSession: (id: number) =>
    fetch(`${BASE}/api/sessions/stop/${id}`, { method: "POST" }).then((r) => r.json()),

  getSessions: () =>
    fetch(`${BASE}/api/sessions/`).then((r) => r.json()),

  getSession: (id: number) =>
    fetch(`${BASE}/api/sessions/${id}`).then((r) => r.json()),

  challanUrl: (id: number) => `${BASE}/api/files/challan/${id}`,
  videoUrl: (id: number) => `${BASE}/api/files/video/${id}`,
  feedWsUrl: (id: number) => `${WS}/ws/feed/${id}`,
};
