"use client";
import { motion } from "framer-motion";
import { Activity, Database, Terminal, Play, FileText, Users, Settings, BarChart3, Shield, Clock, Wifi, Upload, Camera, Monitor, Check, LogOut, User } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";

export default function Home() {
  const { user } = useAuth();

  return (
    <main className="min-h-screen bg-black text-neutral-200 font-sans selection:bg-neutral-800">
      {/* Background layers */}
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808025_1px,transparent_1px),linear-gradient(to_bottom,#80808025_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Header */}
      <Navbar />

      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-16 sm:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-4 sm:mb-5"
        >
          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-xs font-mono text-neutral-500 uppercase tracking-widest">
            <div className="w-4 sm:w-6 h-px bg-neutral-500"></div>
            <span className="hidden sm:inline">Warehouse Vision Engine · v2.0</span>
            <span className="sm:hidden">DECODERS v2.0</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-3 sm:mb-4"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light leading-tight text-white">
            Real-time <span className="font-semibold">object detection</span><br className="hidden sm:inline"/>for warehouse operations
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8 sm:mb-12 max-w-lg"
        >
          <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
            DECODERS streams live camera feeds through YOLOv8 inference pipelines — counting, tracking, and logging warehouse inventory with sub-100ms latency at 30 FPS.
          </p>
        </motion.div>

        {/* Metrics Strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-12 sm:mb-16"
        >
          <div className="flex flex-col sm:flex-row gap-px border border-neutral-800 rounded-lg overflow-hidden bg-neutral-950">
            <div className="flex-1 px-3 sm:px-5 py-3 sm:py-4 border-r border-neutral-800 last:border-r-0">
              <div className="text-xl sm:text-2xl font-mono font-semibold text-white mb-1">~30</div>
              <div className="text-xs sm:text-xs font-mono text-neutral-500 uppercase tracking-widest">Frames / sec</div>
            </div>
            <div className="flex-1 px-3 sm:px-5 py-3 sm:py-4 border-r border-neutral-800 last:border-r-0">
              <div className="text-xl sm:text-2xl font-mono font-semibold text-white mb-1">95%+</div>
              <div className="text-xs sm:text-xs font-mono text-neutral-500 uppercase tracking-widest">Detection accuracy</div>
            </div>
            <div className="flex-1 px-3 sm:px-5 py-3 sm:py-4 border-r border-neutral-800 last:border-r-0">
              <div className="text-xl sm:text-2xl font-mono font-semibold text-white mb-1">10+</div>
              <div className="text-xs sm:text-xs font-mono text-neutral-500 uppercase tracking-widest">Concurrent sessions</div>
            </div>
            <div className="flex-1 px-3 sm:px-5 py-3 sm:py-4">
              <div className="text-xl sm:text-2xl font-mono font-semibold text-white mb-1">&lt;100ms</div>
              <div className="text-xs sm:text-xs font-mono text-neutral-500 uppercase tracking-widest">API latency</div>
            </div>
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-3 sm:gap-3 mb-20"
        >
          {user ? (
            <>
              <Link href="/session/new" className="bg-white text-black px-4 sm:px-5 py-2.5 rounded-md font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center sm:justify-start gap-2">
                <Play className="w-4 h-4" />
                <span className="hidden sm:inline">New Session</span>
                <span className="sm:hidden">Session</span>
              </Link>
              <Link href="/history" className="border border-neutral-700 text-neutral-300 px-4 sm:px-5 py-2.5 rounded-md font-medium text-sm hover:border-neutral-600 transition-colors flex items-center justify-center sm:justify-start gap-2">
                <Database className="w-4 h-4" />
                <span className="hidden sm:inline">View Session Logs</span>
                <span className="sm:hidden">History</span>
              </Link>
            </>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/auth/login" className="bg-white text-black px-4 sm:px-5 py-2.5 rounded-md font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center sm:justify-start gap-2">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Login</span>
                <span className="sm:hidden">Sign In</span>
              </Link>
              <Link href="/auth/signup" className="border border-neutral-700 text-neutral-300 px-4 sm:px-5 py-2.5 rounded-md font-medium text-sm hover:border-neutral-600 transition-colors flex items-center justify-center sm:justify-start gap-2">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Up</span>
                <span className="sm:hidden">Register</span>
              </Link>
            </div>
          )}
        </motion.div>

        <hr className="border-neutral-800 mb-16" />

        {/* Detection Pipeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 text-xs font-mono text-neutral-500 uppercase tracking-widest mb-6">
            <div className="w-4 h-px bg-neutral-500"></div>
            Detection pipeline
          </div>
          
          <div className="flex flex-col lg:flex-row gap-px sm:gap-0 border border-neutral-800 rounded-lg overflow-hidden bg-neutral-950">
            <div className="flex-1 px-3 sm:px-5 py-3 sm:py-4 border-r border-neutral-800 last:border-r-0">
              <div className="text-xs sm:text-xs font-mono text-neutral-600 mb-1">01</div>
              <div className="text-sm sm:text-sm font-semibold text-neutral-200 mb-1">Input Source</div>
              <div className="text-xs sm:text-xs font-mono text-neutral-500">Upload · IP Cam · Live stream</div>
            </div>
            <div className="flex-1 px-3 sm:px-5 py-3 sm:py-4 border-r border-neutral-800 last:border-r-0">
              <div className="text-xs sm:text-xs font-mono text-neutral-600 mb-1">02</div>
              <div className="text-sm sm:text-sm font-semibold text-neutral-200 mb-1">OpenCV Decode</div>
              <div className="text-xs sm:text-xs font-mono text-neutral-500">MJPEG · H.264 · RTSP</div>
            </div>
            <div className="flex-1 px-3 sm:px-5 py-3 sm:py-4 border-r border-neutral-800 last:border-r-0">
              <div className="text-xs sm:text-xs font-mono text-neutral-600 mb-1">03</div>
              <div className="text-sm sm:text-sm font-semibold text-neutral-200 mb-1">YOLOv8 Inference</div>
              <div className="text-xs sm:text-xs font-mono text-neutral-500">Confidence threshold · Bounding boxes</div>
            </div>
            <div className="flex-1 px-3 sm:px-5 py-3 sm:py-4 border-r border-neutral-800 last:border-r-0">
              <div className="text-xs sm:text-xs font-mono text-neutral-600 mb-1">04</div>
              <div className="text-sm sm:text-sm font-semibold text-neutral-200 mb-1">Box Counting</div>
              <div className="text-xs sm:text-xs font-mono text-neutral-500">Visible · Total track</div>
            </div>
            <div className="flex-1 px-3 sm:px-5 py-3 sm:py-4">
              <div className="text-xs sm:text-xs font-mono text-neutral-600 mb-1">05</div>
              <div className="text-sm sm:text-sm font-semibold text-neutral-200 mb-1">WebSocket Stream</div>
              <div className="text-xs sm:text-xs font-mono text-neutral-500">Annotated frames → Frontend</div>
            </div>
          </div>
        </motion.div>

        <hr className="border-neutral-800 mb-16" />

        {/* Core Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="flex items-center gap-3 text-xs font-mono text-neutral-500 uppercase tracking-widest mb-6">
            <div className="w-4 h-px bg-neutral-500"></div>
            Core features
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-neutral-800 border border-neutral-800 rounded-lg overflow-hidden">
            {/* Feature 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="bg-neutral-950 p-4 sm:p-7 hover:bg-neutral-900 transition-colors relative"
            >
              <span className="absolute top-4 right-4 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-[9px] font-mono text-green-500 uppercase tracking-widest">
                Live
              </span>
              <div className="w-6 sm:w-8 h-6 sm:h-8 border border-neutral-700 rounded-md flex items-center justify-center mb-3 sm:mb-4 bg-neutral-900">
                <Upload className="w-3 sm:w-3.5 h-3.5 text-neutral-400" />
              </div>
              <div className="text-sm sm:text-base font-semibold text-white mb-2">Multi-source Video Input</div>
              <div className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                Accept batch file uploads, live WebSocket camera streams, and IP webcam connections. Auto-discovers common stream endpoints.
              </div>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="bg-neutral-950 p-4 sm:p-7 hover:bg-neutral-900 transition-colors relative"
            >
              <span className="absolute top-4 right-4 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-[9px] font-mono text-green-500 uppercase tracking-widest">
                Live
              </span>
              <div className="w-6 sm:w-8 h-6 sm:h-8 border border-neutral-700 rounded-md flex items-center justify-center mb-3 sm:mb-4 bg-neutral-900">
                <Activity className="w-3 sm:w-3.5 h-3.5 text-neutral-400" />
              </div>
              <div className="text-sm sm:text-base font-semibold text-white mb-2">Real-Time YOLO Detection</div>
              <div className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                YOLOv8 inference with configurable confidence thresholds. Annotated bounding boxes and counts overlaid on live frames.
              </div>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.9 }}
              className="bg-neutral-950 p-4 sm:p-7 hover:bg-neutral-900 transition-colors relative"
            >
              <span className="absolute top-4 right-4 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-[9px] font-mono text-green-500 uppercase tracking-widest">
                Live
              </span>
              <div className="w-6 sm:w-8 h-6 sm:h-8 border border-neutral-700 rounded-md flex items-center justify-center mb-3 sm:mb-4 bg-neutral-900">
                <BarChart3 className="w-3 sm:w-3.5 h-3.5 text-neutral-400" />
              </div>
              <div className="text-sm sm:text-base font-semibold text-white mb-2">Advanced Box Counting</div>
              <div className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                Tracks visible and cumulative totals across frames. Supports concurrent multi-session execution with isolated state.
              </div>
            </motion.div>

            {/* Feature 4 - IP Webcam */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.0 }}
              className="bg-neutral-950 p-4 sm:p-7 hover:bg-neutral-900 transition-colors relative"
            >
              <span className="absolute top-4 right-4 px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-[9px] font-mono text-amber-500 uppercase tracking-widest">
                New
              </span>
              <div className="w-6 sm:w-8 h-6 sm:h-8 border border-neutral-700 rounded-md flex items-center justify-center mb-3 sm:mb-4 bg-neutral-900">
                <Camera className="w-3 sm:w-3.5 h-3.5 text-neutral-400" />
              </div>
              <div className="text-sm sm:text-base font-semibold text-white mb-2">IP Webcam Integration</div>
              <div className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                Direct OpenCV connection to IP cameras. Auto-tests /video, /stream, /mjpg/video.mjpg endpoints with automatic reconnection.
              </div>
            </motion.div>

            {/* Feature 5 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.1 }}
              className="bg-neutral-950 p-4 sm:p-7 hover:bg-neutral-900 transition-colors relative"
            >
              <span className="absolute top-4 right-4 px-2 py-1 bg-neutral-700/50 border border-neutral-600 rounded-full text-[9px] font-mono text-neutral-500 uppercase tracking-widest">
                Planned
              </span>
              <div className="w-6 sm:w-8 h-6 sm:h-8 border border-neutral-700 rounded-md flex items-center justify-center mb-3 sm:mb-4 bg-neutral-900">
                <Database className="w-3 sm:w-3.5 h-3.5 text-neutral-400" />
              </div>
              <div className="text-sm sm:text-base font-semibold text-white mb-2">Session Analytics</div>
              <div className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                Per-operator metrics, FPS tracking, detection accuracy charts, and exportable management reports with historical trend analysis.
              </div>
            </motion.div>

            {/* Feature 6 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.2 }}
              className="bg-neutral-950 p-4 sm:p-7 hover:bg-neutral-900 transition-colors relative"
            >
              <span className="absolute top-4 right-4 px-2 py-1 bg-neutral-700/50 border border-neutral-600 rounded-full text-[9px] font-mono text-neutral-500 uppercase tracking-widest">
                Planned
              </span>
              <div className="w-6 sm:w-8 h-6 sm:h-8 border border-neutral-700 rounded-md flex items-center justify-center mb-3 sm:mb-4 bg-neutral-900">
                <Shield className="w-3 sm:w-3.5 h-3.5 text-neutral-400" />
              </div>
              <div className="text-sm sm:text-base font-semibold text-white mb-2">Role-Based Access</div>
              <div className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                Admin, operator, and viewer roles with session security, camera authentication, full audit logging, and API rate limiting.
              </div>
            </motion.div>
          </div>
        </motion.div>

        <hr className="border-neutral-800 mb-16" />

        {/* Input Sources */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.3 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 text-xs font-mono text-neutral-500 uppercase tracking-widest mb-6">
            <div className="w-4 h-px bg-neutral-500"></div>
            Input sources
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-neutral-800 border border-neutral-800 rounded-lg overflow-hidden">
            <div className="bg-neutral-950 p-4 sm:p-6 hover:bg-neutral-900 transition-colors">
              <div className="w-6 sm:w-7 h-6 sm:h-7 border border-neutral-700 rounded-md flex items-center justify-center mb-3 sm:mb-4 bg-neutral-900">
                <Upload className="w-3 sm:w-3.5 h-3.5 text-neutral-400" />
              </div>
              <div className="text-sm sm:text-base font-semibold text-white mb-2">Batch Upload</div>
              <div className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                Upload MP4 or MJPEG video files directly. Processed through the full detection pipeline with automatic recording of output.
              </div>
            </div>
            
            <div className="bg-neutral-950 p-4 sm:p-6 hover:bg-neutral-900 transition-colors">
              <div className="w-6 sm:w-7 h-6 sm:h-7 border border-neutral-700 rounded-md flex items-center justify-center mb-3 sm:mb-4 bg-neutral-900">
                <Wifi className="w-3 sm:w-3.5 h-3.5 text-neutral-400" />
              </div>
              <div className="text-sm sm:text-base font-semibold text-white mb-2">Live Stream</div>
              <div className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                Connect external cameras via WebSocket for real-time bidirectional streaming with JPEG quality controls and low-latency delivery.
              </div>
            </div>
            
            <div className="bg-neutral-950 p-4 sm:p-6 hover:bg-neutral-900 transition-colors">
              <div className="w-6 sm:w-7 h-6 sm:h-7 border border-neutral-700 rounded-md flex items-center justify-center mb-3 sm:mb-4 bg-neutral-900">
                <Camera className="w-3 sm:w-3.5 h-3.5 text-neutral-400" />
              </div>
              <div className="text-sm sm:text-base font-semibold text-white mb-2">IP Webcam</div>
              <div className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                Direct OpenCV connection to IP cameras. Auto-tests /video, /stream, /mjpg/video.mjpg endpoints with automatic reconnection.
              </div>
            </div>
          </div>
        </motion.div>

        <hr className="border-neutral-800 mb-16" />

        {/* Development Roadmap */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.4 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 text-xs font-mono text-neutral-500 uppercase tracking-widest mb-6">
            <div className="w-4 h-px bg-neutral-500"></div>
            Development roadmap
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-neutral-800 border border-neutral-800 rounded-lg overflow-hidden">
            <div className="bg-neutral-950 p-4 sm:p-7">
              <div className="text-xs font-mono text-neutral-600 mb-2">Phase 1</div>
              <div className="text-sm sm:text-base font-semibold text-white mb-2 sm:mb-4">Foundation</div>
              <ul className="space-y-2 mb-4">
                <li className="text-xs text-neutral-300 flex items-start gap-2">
                  <Check className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                  Multi-session detection
                </li>
                <li className="text-xs text-neutral-300 flex items-start gap-2">
                  <Check className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                  IP webcam integration
                </li>
                <li className="text-xs text-neutral-300 flex items-start gap-2">
                  <Check className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                  Real-time WebSocket streaming
                </li>
                <li className="text-xs text-neutral-300 flex items-start gap-2">
                  <Check className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                  Session management & challans
                </li>
              </ul>
              <span className="inline-block px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-[9px] font-mono text-green-500 uppercase tracking-widest">
                Completed
              </span>
            </div>
            
            <div className="bg-neutral-950 p-4 sm:p-7">
              <div className="text-xs font-mono text-neutral-600 mb-2">Phase 2</div>
              <div className="text-sm sm:text-base font-semibold text-white mb-2 sm:mb-4">Enhanced Analytics</div>
              <ul className="space-y-2 mb-4">
                <li className="text-xs text-neutral-400 flex items-start gap-2">
                  <span className="text-neutral-600 flex-shrink-0 mt-0.5">—</span>
                  Advanced dashboard with charts
                </li>
                <li className="text-xs text-neutral-400 flex items-start gap-2">
                  <span className="text-neutral-600 flex-shrink-0 mt-0.5">—</span>
                  Mobile responsive PWA
                </li>
                <li className="text-xs text-neutral-400 flex items-start gap-2">
                  <span className="text-neutral-600 flex-shrink-0 mt-0.5">—</span>
                  Historical data trends
                </li>
                <li className="text-xs text-neutral-400 flex items-start gap-2">
                  <span className="text-neutral-600 flex-shrink-0 mt-0.5">—</span>
                  Automated alert system
                </li>
              </ul>
              <span className="inline-block px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-[9px] font-mono text-amber-500 uppercase tracking-widest">
                In Progress
              </span>
            </div>
            
            <div className="bg-neutral-950 p-4 sm:p-7">
              <div className="text-xs font-mono text-neutral-600 mb-2">Phase 3</div>
              <div className="text-sm sm:text-base font-semibold text-white mb-2 sm:mb-4">Enterprise Features</div>
              <ul className="space-y-2 mb-4">
                <li className="text-xs text-neutral-400 flex items-start gap-2">
                  <span className="text-neutral-600 flex-shrink-0 mt-0.5">—</span>
                  Multi-camera management grid
                </li>
                <li className="text-xs text-neutral-400 flex items-start gap-2">
                  <span className="text-neutral-600 flex-shrink-0 mt-0.5">—</span>
                  Cloud deployment options
                </li>
                <li className="text-xs text-neutral-400 flex items-start gap-2">
                  <span className="text-neutral-600 flex-shrink-0 mt-0.5">—</span>
                  ERP / WMS integrations
                </li>
                <li className="text-xs text-neutral-400 flex items-start gap-2">
                  <span className="text-neutral-600 flex-shrink-0 mt-0.5">—</span>
                  Predictive ML analytics
                </li>
              </ul>
              <span className="inline-block px-2 py-1 bg-neutral-700/50 border border-neutral-600 rounded-full text-[9px] font-mono text-neutral-500 uppercase tracking-widest">
                Future
              </span>
            </div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.5 }}
          className="border border-neutral-800 rounded-lg bg-neutral-950 p-6 sm:p-10 flex flex-col lg:flex-row items-center justify-between gap-8"
        >
          <div className="w-full lg:max-w-md">
            <h3 className="text-base sm:text-lg font-medium text-white mb-2">Ready to initialize a pipeline?</h3>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Configure your session parameters, select an input source, and begin streaming data to detection models. Challans are generated automatically on completion.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <Link href="/session/new" className="bg-white text-black px-4 sm:px-5 py-2.5 rounded-md font-semibold text-sm hover:opacity-90 transition-opacity">
              Open Control Panel
            </Link>
            <Link href="/history" className="border border-neutral-700 text-neutral-300 px-4 sm:px-5 py-2.5 rounded-md font-medium text-sm hover:border-neutral-600 transition-colors">
              Session History
            </Link>
            <Link href="/analytics" className="border border-neutral-700 text-neutral-300 px-4 sm:px-5 py-2.5 rounded-md font-medium text-sm hover:border-neutral-600 transition-colors flex items-center justify-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">View Analytics</span>
              <span className="sm:hidden">Analytics</span>
            </Link>
          </div>
        </motion.div>

      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-neutral-800 py-4 sm:py-5 max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
        <div className="text-xs font-mono text-neutral-500 text-center sm:text-left">
          DECODERS · v2.0 · Production Ready
        </div>
        <div className="text-xs font-mono text-neutral-600 text-center sm:text-right">
          Last updated: March 21, 2026
        </div>
      </footer>

      {/* Status Bar */}
      <div className="relative z-10 border-t border-neutral-800 py-2 sm:py-3 px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-6 text-xs font-mono text-neutral-500">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <span className="hidden sm:inline">Detection Engine Online</span>
              <span className="sm:hidden">Engine Online</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <span className="hidden sm:inline">WebSocket Server Active</span>
              <span className="sm:hidden">WS Server Active</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
              <span className="hidden sm:inline">Analytics Dashboard: In Progress</span>
              <span className="sm:hidden">Analytics: In Progress</span>
            </div>
          </div>
          <div className="text-neutral-600 text-center sm:text-right">
            FastAPI · YOLOv8 · Next.js
          </div>
        </div>
      </div>
    </main>
  );
}
