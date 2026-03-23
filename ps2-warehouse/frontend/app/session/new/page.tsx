"use client";
import { motion } from "framer-motion";
import { ArrowLeft, Terminal } from "lucide-react";
import Link from "next/link";
import SessionForm from "@/components/SessionForm";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";

export default function NewSessionPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute requiredRole="operator">
      <main className="min-h-screen bg-black text-neutral-200 font-sans selection:bg-neutral-800">
      {/* Background layers */}
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808025_1px,transparent_1px),linear-gradient(to_bottom,#80808025_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Header */}
      <Navbar title="New Session" showBackButton={true} />

      {/* Main Content */}
      <div className="pt-32 pb-16 px-6 min-h-screen relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-4xl mx-auto"
        >
          <div className="mb-8">
            <h1 className="text-3xl font-medium tracking-tight text-neutral-100 mb-2">
              Initialize Detection Pipeline
            </h1>
            <p className="text-sm text-neutral-500 max-w-lg">
              Configure session parameters, select input source, and begin streaming data to the YOLO detection models.
            </p>
          </div>

          {/* Session Form */}
          <SessionForm />
        </motion.div>
      </div>
    </main>
    </ProtectedRoute>
  );
}
