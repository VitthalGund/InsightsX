"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { ShieldAlert, LogOut } from "lucide-react";

export default function PendingPage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-[#020617] flex justify-center items-center p-4">
      <div className="w-full max-w-md bg-[#0f172a] rounded-xl border border-white/10 p-8 shadow-2xl text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
            <ShieldAlert className="w-8 h-8 text-amber-400" />
          </div>
        </div>
        
        <h2 className="text-2xl font-semibold text-white mb-2">Account Pending Approval</h2>
        
        <p className="text-gray-400 text-sm mb-6 leading-relaxed">
          Hello <span className="text-indigo-300 font-medium">{session?.user?.email}</span>,<br/>
          Your account has been successfully created and is waiting for an administrator to review and approve your access to InsightsX.
        </p>

        <div className="space-y-3">
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
          >
            I've been approved, refresh status
          </button>
          
          <button 
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full py-3 px-4 bg-[#1e293b] hover:bg-[#334155] border border-white/10 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
