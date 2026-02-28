"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, Users, CheckCircle2, LogOut, MessageSquare } from "lucide-react";
import { useSession, signOut } from "next-auth/react";

interface UserData {
  _id: string;
  email: string;
  role: string;
  isApproved: boolean;
  createdAt: string;
}

export default function AdminPanel() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user?.role !== "admin") {
      router.push("/chat");
    } else if (status === "authenticated" && session?.user?.role === "admin") {
      fetchUsers();
    }
  }, [status, session, router]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleApproval = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved: !currentStatus }),
      });

      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, isApproved: !currentStatus } : u))
        );
      }
    } catch (error) {
      console.error("Failed to update approval", error);
    }
  };

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen bg-background flex justify-center items-center transition-colors">
        <div className="w-8 h-8 rounded-full border-t-2 border-primary animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8 text-text-main transition-colors">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-main">
                Admin Dashboard
              </h1>
              <p className="text-text-muted text-sm">Manage user access and approvals for InsightsX</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Link href="/chat" className="px-4 py-2 flex items-center gap-2 text-sm font-medium bg-background hover:bg-gray-200 dark:hover:bg-white/5 border border-gray-200 dark:border-white/10 text-text-main rounded-lg transition-colors">
              <MessageSquare className="w-4 h-4" /> App
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="px-4 py-2 flex items-center gap-2 text-sm font-medium bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-2xl transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-background border-b border-gray-200 dark:border-white/10 transition-colors">
                  <th className="p-4 text-sm font-semibold text-text-muted">User Email</th>
                  <th className="p-4 text-sm font-semibold text-text-muted">Role</th>
                  <th className="p-4 text-sm font-semibold text-text-muted">Joined</th>
                  <th className="p-4 text-sm font-semibold text-text-muted">Status</th>
                  <th className="p-4 text-sm font-semibold text-text-muted text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="border-b border-gray-200 dark:border-white/10 hover:bg-primary/5 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-text-main">{user.email}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'admin' 
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-text-muted">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      {user.isApproved ? (
                        <div className="flex items-center gap-1.5 text-green-400">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-sm font-medium">Approved</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-amber-400">
                          <ShieldAlert className="w-4 h-4" />
                          <span className="text-sm font-medium">Pending</span>
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {user.role !== "admin" && (
                        <button
                          onClick={() => toggleApproval(user._id, user.isApproved)}
                          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors border ${
                            user.isApproved
                              ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                              : 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20'
                          }`}
                        >
                          {user.isApproved ? "Revoke Access" : "Approve User"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-text-muted">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
