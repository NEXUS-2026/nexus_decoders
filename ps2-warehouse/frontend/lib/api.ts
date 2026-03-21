const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const WS = BASE.replace(/^http/, "ws");

export interface ProductItem {
  name: string;
  qty: number;
}

export interface SessionStartParams {
  operator_id: string;
  batch_id: string;
  input_mode: string;
  customer_ms?: string;
  transporter_id?: string;
  courier_partner?: string;
  challan_no?: string;
  pickup_date?: string;
  products?: ProductItem[];
}

export const API = {
  startSession: (params: SessionStartParams) =>
    fetch(`${BASE}/api/sessions/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
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

  takeAction: (id: number, action: "pause" | "resume" | "reset") =>
    fetch(`${BASE}/api/sessions/action/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    }).then((r) => r.json()),

  getSessions: () =>
    fetch(`${BASE}/api/sessions/`).then((r) => r.json()),

  getSession: (id: number) =>
    fetch(`${BASE}/api/sessions/${id}`).then((r) => r.json()),

  challanUrl: (id: number) => `${BASE}/api/files/challan/${id}`,
  videoUrl: (id: number) => `${BASE}/api/files/video/${id}`,
  feedWsUrl: (id: number) => `${WS}/ws/feed/${id}`,

  getSettings: () => fetch(`${BASE}/api/settings/`).then((r) => r.json()),
  updateSettings: (confidence_threshold: number) =>
    fetch(`${BASE}/api/settings/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confidence_threshold }),
    }).then((r) => r.json()),
};
