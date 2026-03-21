"use client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Terminal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "operator" | "viewer";
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log("ProtectedRoute - isLoading:", isLoading, "isAuthenticated:", isAuthenticated, "user:", user);
    if (!isLoading && !isAuthenticated) {
      console.log("Redirecting to login...");
      router.push("/auth/login");
    }
  }, [isLoading, isAuthenticated, router, user]);

  // Check role permissions
  const hasPermission = () => {
    if (!user || !requiredRole) return true;
    
    const roleHierarchy = {
      admin: 3,
      operator: 2,
      viewer: 1
    };
    
    return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
  };

  if (isLoading) {
    return (
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
            Authenticating...
          </p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  if (!hasPermission()) {
    return (
      <main className="min-h-screen bg-black text-neutral-200 font-sans flex items-center justify-center">
        <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />
        <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
        
        <div className="relative z-10 text-center border border-neutral-800 rounded-lg bg-neutral-950 p-8 max-w-md">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 bg-red-500/20 rounded-sm flex items-center justify-center">
              <Terminal className="w-5 h-5 text-red-500" />
            </div>
            <span className="font-semibold text-lg tracking-wide text-red-500">
              Access Denied
            </span>
          </div>
          <p className="text-sm text-neutral-400 mb-6">
            You don't have permission to access this page. Required role: {requiredRole}
          </p>
          <button
            onClick={() => router.push("/")}
            className="text-xs font-medium text-neutral-300 hover:text-white underline decoration-neutral-700 underline-offset-4 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
