"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Terminal, Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: Implement login logic
    console.log("Login:", { email, password });
    
    // Mock authentication - save user to localStorage
    const mockUser = {
      id: "1",
      name: email.split("@")[0],
      email,
      role: "operator"
    };
    
    localStorage.setItem("decoders_user", JSON.stringify(mockUser));
    console.log("Saved user to localStorage:", mockUser);
    
    setTimeout(() => {
      setLoading(false);
      // Redirect to session/new after successful login
      window.location.href = "/session/new";
    }, 1000);
  };

  return (
    <main className="min-h-screen bg-black text-neutral-200 font-sans selection:bg-neutral-800 flex items-center justify-center">
      {/* Background layers */}
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808025_1px,transparent_1px),linear-gradient(to_bottom,#80808025_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 bg-neutral-100 rounded-sm flex items-center justify-center">
              <Terminal className="w-5 h-5 text-black" />
            </div>
            <span className="font-semibold text-lg tracking-wide text-neutral-100">
              DECODERS
            </span>
          </div>
          <p className="text-xs font-mono text-neutral-500 uppercase tracking-widest">
            Authentication Portal
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="border border-neutral-800 rounded-lg bg-neutral-950 p-8"
        >
          <h2 className="text-xl font-semibold text-white mb-6">Sign In</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-xs font-mono text-neutral-500 uppercase tracking-widest mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-neutral-600" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-neutral-900 border border-neutral-700 rounded-md text-sm text-neutral-200 placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-600/20 transition-colors"
                  placeholder="operator@decoders.com"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-mono text-neutral-500 uppercase tracking-widest mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-neutral-600" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-neutral-900 border border-neutral-700 rounded-md text-sm text-neutral-200 placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-600/20 transition-colors"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-neutral-600 hover:text-neutral-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-neutral-600 hover:text-neutral-400" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black px-4 py-2.5 rounded-md font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-neutral-500">
              Don't have an account?{" "}
              <Link href="/auth/signup" className="text-neutral-300 hover:text-white underline decoration-neutral-700 underline-offset-4 transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 text-center"
        >
          <p className="text-xs font-mono text-neutral-600">
            Protected by role-based access control
          </p>
        </motion.div>
      </div>
    </main>
  );
}
