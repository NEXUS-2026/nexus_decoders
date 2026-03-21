"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  BarChart3, 
  Users, 
  Activity, 
  Clock, 
  Box, 
  TrendingUp,
  ArrowLeft,
  Terminal,
  Loader2,
  Calendar,
  Video,
  Upload,
  Wifi,
  Camera
} from "lucide-react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import SimpleCharts from "@/components/SimpleCharts";

interface DashboardStats {
  total_sessions: number;
  active_sessions: number;
  completed_sessions: number;
  total_boxes_detected: number;
  average_processing_time_minutes: number;
  sessions_by_input_mode: Record<string, number>;
  recent_activity: Array<{
    session_id: number;
    operator_id: string;
    batch_id: string;
    input_mode: string;
    status: string;
    final_box_count: number;
    started_at: string;
    stopped_at: string | null;
    processing_time_minutes: number | null;
  }>;
  operator_performance: Array<{
    operator_id: string;
    total_sessions: number;
    total_boxes_detected: number;
    average_boxes_per_session: number;
    average_processing_time_minutes: number;
  }>;
  last_updated: string;
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/analytics/dashboard`);
      if (!response.ok) throw new Error("Failed to fetch analytics");
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const getInputModeIcon = (mode: string) => {
    switch (mode) {
      case "upload": return <Upload className="w-4 h-4" />;
      case "live": return <Wifi className="w-4 h-4" />;
      case "ip_webcam": return <Camera className="w-4 h-4" />;
      default: return <Video className="w-4 h-4" />;
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes.toFixed(1)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="viewer">
        <main className="min-h-screen bg-black text-neutral-200 font-sans flex items-center justify-center">
          <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />
          <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
          
          <div className="relative z-10 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-8 h-8 bg-neutral-100 rounded-sm flex items-center justify-center">
                <Terminal className="w-5 h-5 text-black" />
              </div>
              <span className="font-semibold text-lg tracking-wide text-neutral-100">
                DECODERS
              </span>
            </div>
            <Loader2 className="w-6 h-6 text-neutral-400 animate-spin mx-auto mb-2" />
            <p className="text-xs font-mono text-neutral-500 uppercase tracking-widest">
              Loading Analytics...
            </p>
          </div>
        </main>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute requiredRole="viewer">
        <main className="min-h-screen bg-black text-neutral-200 font-sans flex items-center justify-center">
          <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />
          <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
          
          <div className="relative z-10 text-center border border-neutral-800 rounded-lg bg-neutral-950 p-8 max-w-md">
            <BarChart3 className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={fetchAnalytics}
              className="text-xs font-medium text-neutral-300 hover:text-white underline decoration-neutral-700 underline-offset-4 transition-colors"
            >
              Try Again
            </button>
          </div>
        </main>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="viewer">
      <main className="min-h-screen bg-black text-neutral-200 font-sans selection:bg-neutral-800">
        {/* Background layers */}
        <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />
        <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

        {/* Header */}
        <Navbar title="Analytics Dashboard" />

        {/* Main Content */}
        <div className="pt-32 pb-16 px-6 min-h-screen relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-7xl mx-auto"
          >
            <div className="mb-8">
              <h1 className="text-3xl font-medium tracking-tight text-neutral-100 mb-2">
                Analytics Dashboard
              </h1>
              <p className="text-sm text-neutral-500 max-w-lg">
                System performance metrics, operator statistics, and usage trends for the DECODERS platform.
              </p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="border border-neutral-800 rounded-lg bg-neutral-950 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <Activity className="w-8 h-8 text-blue-500" />
                  <span className="text-xs font-mono text-neutral-600 uppercase tracking-widest">Total</span>
                </div>
                <div className="text-2xl font-mono font-semibold text-white mb-1">
                  {stats?.total_sessions || 0}
                </div>
                <div className="text-xs text-neutral-400">Total Sessions</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="border border-neutral-800 rounded-lg bg-neutral-950 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <Box className="w-8 h-8 text-green-500" />
                  <span className="text-xs font-mono text-neutral-600 uppercase tracking-widest">Detected</span>
                </div>
                <div className="text-2xl font-mono font-semibold text-white mb-1">
                  {stats?.total_boxes_detected || 0}
                </div>
                <div className="text-xs text-neutral-400">Total Boxes</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="border border-neutral-800 rounded-lg bg-neutral-950 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <Clock className="w-8 h-8 text-amber-500" />
                  <span className="text-xs font-mono text-neutral-600 uppercase tracking-widest">Average</span>
                </div>
                <div className="text-2xl font-mono font-semibold text-white mb-1">
                  {formatTime(stats?.average_processing_time_minutes || 0)}
                </div>
                <div className="text-xs text-neutral-400">Processing Time</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="border border-neutral-800 rounded-lg bg-neutral-950 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <TrendingUp className="w-8 h-8 text-purple-500" />
                  <span className="text-xs font-mono text-neutral-600 uppercase tracking-widest">Success</span>
                </div>
                <div className="text-2xl font-mono font-semibold text-white mb-1">
                  {stats?.completed_sessions || 0}
                </div>
                <div className="text-xs text-neutral-400">Completed Sessions</div>
              </motion.div>
            </div>

            {/* Input Mode Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="border border-neutral-800 rounded-lg bg-neutral-950 p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Video className="w-5 h-5 text-neutral-400" />
                  Input Mode Distribution
                </h3>
                <div className="space-y-3">
                  {Object.entries(stats?.sessions_by_input_mode || {}).map(([mode, count]) => (
                    <div key={mode} className="flex items-center justify-between p-3 bg-neutral-900 rounded-md">
                      <div className="flex items-center gap-3">
                        {getInputModeIcon(mode)}
                        <span className="text-sm font-medium text-neutral-300 capitalize">
                          {mode.replace("_", " ")}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-mono text-white">{count}</div>
                        <div className="text-xs text-neutral-500">
                          {stats?.total_sessions ? Math.round((count / stats.total_sessions) * 100) : 0}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Recent Activity */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="border border-neutral-800 rounded-lg bg-neutral-950 p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-neutral-400" />
                  Recent Activity (7 Days)
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {stats?.recent_activity?.slice(0, 5).map((activity) => (
                    <div key={activity.session_id} className="flex items-center justify-between p-3 bg-neutral-900 rounded-md">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-neutral-600">#{activity.session_id}</span>
                        <div>
                          <div className="text-sm font-medium text-neutral-300">{activity.operator_id}</div>
                          <div className="text-xs text-neutral-500">{activity.batch_id}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-right">
                        <div className="flex items-center gap-1">
                          {getInputModeIcon(activity.input_mode)}
                          <span className="text-xs text-neutral-400">{activity.final_box_count} boxes</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Operator Performance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="border border-neutral-800 rounded-lg bg-neutral-950 p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-neutral-400" />
                Operator Performance
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-800">
                      <th className="text-left py-3 px-4 text-xs font-mono text-neutral-500 uppercase tracking-widest">Operator</th>
                      <th className="text-center py-3 px-4 text-xs font-mono text-neutral-500 uppercase tracking-widest">Sessions</th>
                      <th className="text-center py-3 px-4 text-xs font-mono text-neutral-500 uppercase tracking-widest">Total Boxes</th>
                      <th className="text-center py-3 px-4 text-xs font-mono text-neutral-500 uppercase tracking-widest">Avg/Session</th>
                      <th className="text-center py-3 px-4 text-xs font-mono text-neutral-500 uppercase tracking-widest">Avg Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats?.operator_performance?.map((operator, index) => (
                      <tr key={operator.operator_id} className="border-b border-neutral-800/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-neutral-600" />
                            <span className="text-sm font-medium text-neutral-300">{operator.operator_id}</span>
                          </div>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className="text-sm font-mono text-white">{operator.total_sessions}</span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className="text-sm font-mono text-green-400">{operator.total_boxes_detected}</span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className="text-sm font-mono text-neutral-300">{operator.average_boxes_per_session}</span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className="text-sm font-mono text-amber-400">{formatTime(operator.average_processing_time_minutes)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Last Updated */}
            <div className="mt-8 text-center">
              <p className="text-xs font-mono text-neutral-600">
                Last updated: {stats?.last_updated ? new Date(stats.last_updated).toLocaleString() : 'Never'}
              </p>
            </div>
          </motion.div>

          {/* Charts Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="mt-8"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-white mb-2 flex items-center gap-3">
                <BarChart3 className="w-6 h-6 text-neutral-400" />
                Visual Analytics
              </h2>
              <p className="text-sm text-neutral-500">
                Interactive charts and graphs showing system performance and usage patterns.
              </p>
            </div>
            
            {stats && (
              <SimpleCharts data={stats} />
            )}
          </motion.div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
