"use client";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Terminal, Home, BarChart3, Database, User, LogOut, ArrowLeft } from "lucide-react";

interface NavbarProps {
  title?: string;
  showBackButton?: boolean;
  backUrl?: string;
}

export default function Navbar({ title, showBackButton = false, backUrl = "/" }: NavbarProps) {
  const { user, logout } = useAuth();

  return (
    <header className="fixed top-0 w-full border-b border-neutral-800 bg-black/50 backdrop-blur-md z-50">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBackButton && (
            <Link href={backUrl} className="flex items-center gap-3 text-neutral-400 hover:text-neutral-200 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </Link>
          )}
          <Link href="/" className="flex items-center gap-3 text-neutral-400 hover:text-neutral-200 transition-colors">
            <div className="w-5 h-5 bg-neutral-100 rounded-sm flex items-center justify-center">
              <Terminal className="w-3 h-3 text-black" />
            </div>
            <span className="font-semibold text-sm tracking-wide text-neutral-100">
              DECODERS
            </span>
          </Link>
          {title && (
            <>
              <span className="text-neutral-700">|</span>
              <span className="px-2 py-1 bg-neutral-900 border border-neutral-700 rounded-full text-[9px] font-mono text-neutral-500 uppercase tracking-widest">
                {title}
              </span>
            </>
          )}
        </div>
        
        <nav className="flex items-center gap-4 text-xs font-medium text-neutral-500">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            Systems Operational
          </div>
          <span className="text-neutral-700">|</span>
          <Link href="/session/new" className="hover:text-neutral-300 transition-colors flex items-center gap-1">
            <Home className="w-3 h-3" />
            Control Panel
          </Link>
          <span className="text-neutral-700">|</span>
          <Link href="/history" className="hover:text-neutral-300 transition-colors flex items-center gap-1">
            <Database className="w-3 h-3" />
            History
          </Link>
          <span className="text-neutral-700">|</span>
          <Link href="/analytics" className="hover:text-neutral-300 transition-colors flex items-center gap-1">
            <BarChart3 className="w-3 h-3" />
            Analytics
          </Link>
          <span className="text-neutral-700">|</span>
          <div className="flex items-center gap-2 px-2 py-1 bg-neutral-900 border border-neutral-700 rounded-full">
            <User className="w-3 h-3 text-neutral-400" />
            <span className="text-neutral-300">{user?.name}</span>
            <span className="text-neutral-600">({user?.role})</span>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1 text-neutral-500 hover:text-red-400 transition-colors"
            title="Logout"
          >
            <LogOut className="w-3 h-3" />
          </button>
        </nav>
      </div>
    </header>
  );
}
