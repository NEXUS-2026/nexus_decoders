"use client";
import { motion } from "framer-motion";
import { Package } from "lucide-react";
import SessionForm from "@/components/SessionForm";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-bg bg-[url('/grid.svg')] flex flex-col items-center justify-center px-4">
      {/* Brand Block */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-10"
      >
        <div className="flex items-center justify-center gap-3 mb-3">
          <Package className="w-9 h-9 text-accent" />
          <h1 className="font-display font-black text-4xl tracking-[0.2em] text-text-primary">
            DECODERS
          </h1>
        </div>
        <p className="text-muted text-xs tracking-widest uppercase">
          Warehouse Packing Session Control
        </p>
      </motion.div>

      {/* Session Form */}
      <SessionForm />

      {/* Footer Link */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="mt-6"
      >
        <Link
          href="/history"
          className="text-sm text-muted hover:text-text-primary transition-colors"
        >
          View Session History →
        </Link>
      </motion.div>
    </main>
  );
}
