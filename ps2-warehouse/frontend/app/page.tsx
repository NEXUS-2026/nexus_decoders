import SessionForm from "@/components/SessionForm";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4">
      {/* Hero section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-6">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Real-time Detection</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
          <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Warehouse Box
          </span>
          <br />
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Counting System
          </span>
        </h1>
        <p className="text-gray-400 max-w-md mx-auto text-base">
          YOLO-powered detection with real-time streaming, session tracking, and automated challan generation.
        </p>
      </div>

      <SessionForm />
    </div>
  );
}
