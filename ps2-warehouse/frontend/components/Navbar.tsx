"use client";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Terminal, Home, BarChart3, Database, User, LogOut, ArrowLeft, Menu, X } from "lucide-react";

interface NavbarProps {
  title?: string;
  showBackButton?: boolean;
  backUrl?: string;
}

export default function Navbar({ title, showBackButton = false, backUrl = "/" }: NavbarProps) {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
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
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-4 text-xs font-medium text-neutral-500">
            {!user ? (
              <>
                <Link href="/auth/login" className="hover:text-neutral-300 transition-colors flex items-center gap-2">
                  <User className="w-3 h-3" />
                  Login
                </Link>
                <Link href="/auth/signup" className="hover:text-neutral-300 transition-colors flex items-center gap-2">
                  <User className="w-3 h-3" />
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-neutral-700">|</span>
                  <span className="px-2 py-1 bg-neutral-900 border border-neutral-700 rounded-full text-[9px] font-mono text-neutral-500 uppercase tracking-widest">
                    Systems Operational
                  </span>
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
              </>
            )}
          </nav>

          {/* Mobile Hamburger Menu */}
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden flex items-center gap-2 text-neutral-400 hover:text-neutral-200 transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Sliding Sidebar */}
      <div
        className={`fixed inset-y-0 right-0 w-80 bg-black/95 backdrop-blur-lg transform transition-transform duration-300 ease-in-out z-50 lg:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Menu</h2>
            <button
              onClick={toggleMobileMenu}
              className="text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {!user ? (
            <div className="space-y-4">
              <Link
                href="/auth/login"
                onClick={toggleMobileMenu}
                className="block w-full py-3 px-4 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-neutral-300 hover:text-white transition-colors text-center"
              >
                <User className="w-4 h-4 inline-block mr-2" />
                Login
              </Link>
              <Link
                href="/auth/signup"
                onClick={toggleMobileMenu}
                className="block w-full py-3 px-4 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-neutral-300 hover:text-white transition-colors text-center"
              >
                <User className="w-4 h-4 inline-block mr-2" />
                Sign Up
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-4 py-3 bg-neutral-800 rounded-lg">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-neutral-300">Systems Operational</span>
              </div>
              <Link
                href="/session/new"
                onClick={toggleMobileMenu}
                className="block w-full py-3 px-4 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-neutral-300 hover:text-white transition-colors text-center"
              >
                <Home className="w-4 h-4 inline-block mr-2" />
                Control Panel
              </Link>
              <Link
                href="/history"
                onClick={toggleMobileMenu}
                className="block w-full py-3 px-4 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-neutral-300 hover:text-white transition-colors text-center"
              >
                <Database className="w-4 h-4 inline-block mr-2" />
                History
              </Link>
              <Link
                href="/analytics"
                onClick={toggleMobileMenu}
                className="block w-full py-3 px-4 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-neutral-300 hover:text-white transition-colors text-center"
              >
                <BarChart3 className="w-4 h-4 inline-block mr-2" />
                Analytics
              </Link>
              <div className="flex items-center gap-2 px-4 py-3 bg-neutral-800 rounded-lg">
                <User className="w-4 h-4 text-neutral-400" />
                <span className="text-neutral-300">{user?.name}</span>
                <span className="text-neutral-600">({user?.role})</span>
              </div>
              <button
                onClick={() => {
                  logout();
                  toggleMobileMenu();
                }}
                className="block w-full py-3 px-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-red-400 hover:text-red-300 transition-colors text-center"
              >
                <LogOut className="w-4 h-4 inline-block mr-2" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleMobileMenu}
        />
      )}
    </>
  );
}
