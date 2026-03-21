"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Terminal, SlidersHorizontal, Loader2, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { API } from "@/lib/api";

export default function ControlPanel() {
  const [conf, setConf] = useState(0.45);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    API.getSettings()
      .then((data) => {
        setConf(data.confidence_threshold || 0.45);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      await API.updateSettings(conf);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save settings", err);
    }
    setSaving(false);
  };

  const pct = ((conf - 0.1) / (0.95 - 0.1)) * 100;

  return (
    <main className="min-h-screen bg-black text-neutral-200 font-sans selection:bg-neutral-800 relative">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none fixed" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none fixed" />

      <header className="fixed top-0 w-full border-b border-neutral-800 bg-black/50 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-5 h-5 bg-neutral-100 rounded-sm flex items-center justify-center">
              <Terminal className="w-3 h-3 text-black" />
            </div>
            <span className="font-semibold text-sm tracking-wide text-neutral-100">DECODERS</span>
            <span className="px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-[10px] uppercase tracking-widest text-neutral-500 ml-2 hidden sm:inline-block">
               System Configuration
            </span>
          </Link>
          <Link href="/" className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 hover:text-white transition-colors flex items-center gap-2">
             Back to System <ArrowLeft className="w-3.5 h-3.5 order-first" />
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 pt-32 pb-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-medium tracking-tight text-neutral-100 mb-2 flex items-center gap-3">
            <SlidersHorizontal className="w-7 h-7 text-blue-500" />
            Control Panel
          </h1>
          <p className="text-sm text-neutral-500">
            Global inference settings. Adjust these parameters to fine-tune the master detection model across all new sessions.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center p-12">
             <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            <div className="bg-[#0A0A0A] border border-neutral-800 rounded-xl p-8 shadow-2xl">
              
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-sm font-medium text-neutral-200">Global Confidence Threshold</h3>
                  <p className="text-xs text-neutral-500 mt-1 max-w-sm">Global minimum probability score required for object indexing during uploaded video extraction processing.</p>
                </div>
                <div className="bg-[#050505] border border-neutral-800 rounded flex items-center justify-center px-3 py-1.5 shadow-inner">
                  <span className="text-sm font-mono text-blue-400 tabular-nums font-semibold tracking-wide">
                    {conf.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="relative w-full flex items-center py-2 mb-4">
                <input
                  type="range"
                  min={0.1}
                  max={0.95}
                  step={0.05}
                  value={conf}
                  onChange={(e) => setConf(parseFloat(e.target.value))}
                  className="w-full h-2 appearance-none rounded-full cursor-pointer outline-none
                             [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                             [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:rounded-full
                             [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-[#0A0A0A]
                             [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:shadow-[0_0_15px_rgba(59,130,246,0.6)]
                             [&::-webkit-slider-thumb]:transition-transform"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 ${pct}%, #262626 ${pct}%)`,
                  }}
                />
              </div>

              <div className="flex justify-between text-[10px] font-mono text-neutral-600 tracking-wider">
                <span>MIN 0.10</span>
                <span>MAX 0.95</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-4 mt-8">
               {success && (
                 <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-500 animate-pulse">
                   Parameters Synced
                 </span>
               )}
               <button
                 onClick={handleSave}
                 disabled={saving}
                 className="flex items-center gap-2 px-6 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-medium uppercase tracking-widest rounded transition-all disabled:opacity-50"
               >
                 {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                 Deploy Updates
               </button>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}
