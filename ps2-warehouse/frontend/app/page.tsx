"use client";
import { motion } from "framer-motion";
import { Activity, Database, Terminal } from "lucide-react";
import SessionForm from "@/components/SessionForm";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-neutral-200 font-sans selection:bg-neutral-800">
      {/* Subtle Technical Background */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="fixed top-0 w-full border-b border-neutral-800 bg-black/50 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-neutral-100 rounded-sm flex items-center justify-center">
              <Terminal className="w-3 h-3 text-black" />
            </div>
            <span className="font-semibold text-sm tracking-wide text-neutral-100">
              DECODERS
            </span>
            <span className="px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-[10px] uppercase tracking-widest text-neutral-500 ml-2">
              Production Environment
            </span>
          </div>
         
          <div className="flex items-center gap-4 text-xs font-medium text-neutral-500">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Systems Operational
            </div>
            <span className="text-neutral-800">|</span>
            <Link href="/control" className="hover:text-neutral-200 transition-colors">
              Control Panel
            </Link>
            <span className="text-neutral-800">|</span>
            <Link href="/history" className="hover:text-neutral-200 transition-colors">
              View Logs
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="pt-32 pb-16 px-6 min-h-screen flex flex-col items-center justify-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-2xl"
        >
          <div className="mb-8">
            <h1 className="text-3xl font-medium tracking-tight text-neutral-100 mb-2">
              Warehouse Vision Engine
            </h1>
            <p className="text-sm text-neutral-500 max-w-lg">
              Initialize a new inference pipeline. Configure the session parameters below to begin streaming data to the detection models.
            </p>
          </div>

          {/* The Form */}
          <SessionForm />
        </motion.div>
      </div>
    </main>
  );
}
