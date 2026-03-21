"use client";
import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, UploadCloud, Radio, X, FileVideo, Plus, Trash2, Mail } from "lucide-react";
import { API, ProductItem } from "@/lib/api";

export default function SessionForm() {
  const router = useRouter();
  const [operatorId, setOperatorId] = useState("");
  
  // Challan Fields
  const [customerMs, setCustomerMs] = useState("");
  const [transporterId, setTransporterId] = useState("");
  const [courierPartner, setCourierPartner] = useState("");
  const [challanNo, setChallanNo] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [batchId, setBatchId] = useState(""); // Acts as "Lot No."
  const [challanEmail, setChallanEmail] = useState(""); // New email field

  // Dynamic product rows — N items supported
  const [products, setProducts] = useState<ProductItem[]>([
    { name: "ABC", qty: 0 },
    { name: "DEF", qty: 0 },
  ]);
  function updateProduct(index: number, field: keyof ProductItem, value: string | number) {
    setProducts(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  }
  function addProduct() {
    setProducts(prev => [...prev, { name: "", qty: 0 }]);
  }
  function removeProduct(index: number) {
    if (products.length > 1) setProducts(prev => prev.filter((_, i) => i !== index));
  }

  const [loading, setLoading] = useState(false);
  const [inputMode, setInputMode] = useState<"upload" | "live" | "ip_webcam">("upload");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [ipWebcamUrl, setIpWebcamUrl] = useState("http://192.168.1.5:8080");
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
    if (!operatorId || !batchId || !customerMs || !challanNo) return;
    if (inputMode === "upload" && !videoFile) return;
    if (inputMode === "ip_webcam" && !ipWebcamUrl) return;

    setLoading(true);
    try {
      const session = await API.startSession({
        operator_id: operatorId,
        batch_id: batchId,
        input_mode: inputMode,
        customer_ms: customerMs,
        transporter_id: transporterId,
        courier_partner: courierPartner,
        challan_no: challanNo,
        pickup_date: pickupDate,
        products: products.map(p => ({ name: p.name, qty: Number(p.qty) || 0 })),
        ip_webcam_url: inputMode === "ip_webcam" ? ipWebcamUrl : "",
        challan_email: challanEmail,
      });
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
    batchId && customerMs && challanNo &&
    (inputMode === "live" || (inputMode === "upload" && videoFile) || (inputMode === "ip_webcam" && ipWebcamUrl));
  // --------------------------------------

  return (
    <div className="bg-[#0A0A0A] border border-neutral-800 rounded-lg shadow-2xl overflow-hidden">
      {/* Segmented Control Header */}
      <div className="p-1 border-b border-neutral-800 bg-neutral-900/30">
        <div className="flex relative bg-neutral-950 rounded-md p-1">
          {/* Sliding Background Indicator */}
          <div
            className={`absolute top-1 bottom-1 w-[calc(33.333%-2.66px)] bg-neutral-800 rounded shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              inputMode === "upload" ? "translate-x-0" : inputMode === "live" ? "translate-x-[calc(100%+4px)]" : "translate-x-[calc(200%+8px)]"
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
          <button
            onClick={() => setInputMode("ip_webcam")}
            className={`relative z-10 flex-1 py-2 text-xs font-medium tracking-wide transition-colors duration-200 ${
              inputMode === "ip_webcam" ? "text-neutral-100" : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            IP Webcam
          </button>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* Operator Setup Top Row */}
        <div className="flex items-center gap-4">
           <div className="flex-1 space-y-2">
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
        </div>

        {/* Challan Form Table (Mimicking User Requested UI) */}
        <div className="border border-neutral-600 bg-[#1e1e1e] font-sans text-sm text-neutral-200 w-full overflow-hidden">
          <table className="w-full border-collapse border border-neutral-600">
            <tbody>
              {/* Header Row */}
              <tr className="border-b border-neutral-600">
                <td colSpan={2} className="border-r border-neutral-600 p-2">Customer Detail</td>
                <td className="border-r border-neutral-600 p-2">Challan No.</td>
                <td className="p-0">
                  <input placeholder="123456789" className="w-full h-full bg-transparent p-2 focus:outline-none text-white focus:bg-white/5" value={challanNo} onChange={e => setChallanNo(e.target.value)} />
                </td>
              </tr>
              <tr className="border-b border-neutral-600">
                <td className="border-r border-neutral-600 p-2 w-1/4">M/S</td>
                <td className="border-r border-neutral-600 p-0 w-1/4">
                  <input placeholder="Enter Client Name" className="w-full h-full bg-transparent p-2 focus:outline-none text-white focus:bg-white/5" value={customerMs} onChange={e => setCustomerMs(e.target.value)} />
                </td>
                <td className="border-r border-neutral-600 p-2 w-1/4">Pickup Date</td>
                <td className="p-0 w-1/4">
                  <input type="date" className="w-full h-full bg-transparent p-2 focus:outline-none text-white focus:bg-white/5" value={pickupDate} onChange={e => setPickupDate(e.target.value)} />
                </td>
              </tr>
              <tr className="border-b border-neutral-600">
                <td className="border-r border-neutral-600 p-2">Transporter ID</td>
                <td className="border-r border-neutral-600 p-0">
                  <input placeholder="..." className="w-full h-full bg-transparent p-2 focus:outline-none text-white focus:bg-white/5" value={transporterId} onChange={e => setTransporterId(e.target.value)} />
                </td>
                <td className="border-r border-neutral-600 p-2">Lot No.</td>
                <td className="p-0">
                  <input placeholder="10" className="w-full h-full bg-transparent p-2 focus:outline-none text-white focus:bg-white/5" value={batchId} onChange={e => setBatchId(e.target.value)} />
                </td>
              </tr>
              <tr className="border-b border-neutral-600">
                <td className="border-r border-neutral-600 p-2 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-neutral-400" />
                  Email (Challan)
                </td>
                <td className="border-r border-neutral-600 p-0" colSpan="3">
                  <input 
                    type="email" 
                    placeholder="customer@example.com (Optional - Email will be sent with challan)" 
                    className="w-full h-full bg-transparent p-2 focus:outline-none text-white focus:bg-white/5" 
                    value={challanEmail} 
                    onChange={e => setChallanEmail(e.target.value)} 
                  />
                </td>
              </tr>
              <tr className="border-b border-neutral-600 border-b-[8px]">
                <td className="border-r border-neutral-600 p-2">Courier Partner</td>
                <td className="border-r border-neutral-600 p-0">
                   <input placeholder="..." className="w-full h-full bg-transparent p-2 focus:outline-none text-white focus:bg-white/5" value={courierPartner} onChange={e => setCourierPartner(e.target.value)} />
                </td>
                <td className="border-r border-neutral-600 p-2">No. of Boxes</td>
                <td className="p-2 text-neutral-500 italic">
                  [ Auto-Detected by System ]
                </td>
              </tr>
              {/* Product Rows - Dynamic */}
              <tr className="border-b border-neutral-600">
                <td className="border-r border-neutral-600 p-2 font-semibold">Sr. No.</td>
                <td colSpan={2} className="border-r border-neutral-600 p-2 font-semibold">Name of Product</td>
                <td className="p-2 font-semibold">Qty</td>
              </tr>
              {products.map((product, index) => (
                <tr key={index} className="border-b border-neutral-600 group">
                  <td className="border-r border-neutral-600 p-2 text-neutral-400">{index + 1}.</td>
                  <td colSpan={2} className="border-r border-neutral-600 p-0">
                    <div className="flex items-center">
                      <input
                        className="flex-1 bg-transparent p-2 focus:outline-none text-white focus:bg-white/5"
                        placeholder="Product name"
                        value={product.name}
                        onChange={e => updateProduct(index, "name", e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => removeProduct(index)}
                        className="px-2 opacity-0 group-hover:opacity-100 transition-opacity text-neutral-600 hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="p-0">
                    <input
                      type="number"
                      placeholder="0"
                      className="w-full bg-transparent p-2 focus:outline-none text-white focus:bg-white/5"
                      value={product.qty || ""}
                      onChange={e => updateProduct(index, "qty", Number(e.target.value) || 0)}
                    />
                  </td>
                </tr>
              ))}
              {/* Add Product Row */}
              <tr className="border-b border-neutral-600">
                <td colSpan={4} className="p-1">
                  <button
                    type="button"
                    onClick={addProduct}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-mono uppercase tracking-widest text-neutral-500 hover:text-neutral-300 hover:bg-white/5 transition-all"
                  >
                    <Plus className="w-3 h-3" /> Add Product
                  </button>
                </td>
              </tr>
              <tr>
                <td colSpan={3} className="border-r border-neutral-600 p-2 text-right font-semibold">
                  Total
                </td>
                <td className="p-2 font-mono text-emerald-400">
                  {products.reduce((sum, p) => sum + (Number(p.qty) || 0), 0)}
                </td>
              </tr>
            </tbody>
          </table>
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
            ) : inputMode === "live" ? (
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
            ) : (
              <motion.div
                key="ip_webcam"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                className="h-full bg-neutral-950 border border-neutral-800 rounded-md p-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded">
                      <Radio className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-neutral-200">IP Webcam Configuration</h5>
                      <p className="text-xs text-neutral-500">Connect directly to an IP webcam stream</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="ip-webcam-url" className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest">
                      Webcam URL
                    </label>
                    <input
                      id="ip-webcam-url"
                      type="url"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-2 text-sm text-neutral-200 font-mono placeholder:text-neutral-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-colors"
                      placeholder="http://192.168.1.5:8080"
                      value={ipWebcamUrl}
                      onChange={(e) => setIpWebcamUrl(e.target.value)}
                    />
                    <p className="text-xs text-neutral-500 font-mono">
                      Default endpoint: <span className="text-blue-400">{ipWebcamUrl}/video</span>
                    </p>
                  </div>
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
