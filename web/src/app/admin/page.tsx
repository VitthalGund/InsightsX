"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Users, CheckCircle2, XCircle } from "lucide-react";

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
      router.push("/");
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
      <div className="min-h-screen bg-[#020617] flex justify-center items-center">
        <div className="w-8 h-8 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] p-8 text-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
            <Users className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
              Admin Dashboard
            </h1>
            <p className="text-gray-400 text-sm">Manage user access and approvals for InsightsX</p>
          </div>
        </div>

        <div className="bg-[#0f172a] rounded-xl border border-white/10 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#1e293b] border-b border-white/5">
                  <th className="p-4 text-sm font-semibold text-gray-300">User Email</th>
                  <th className="p-4 text-sm font-semibold text-gray-300">Role</th>
                  <th className="p-4 text-sm font-semibold text-gray-300">Joined</th>
                  <th className="p-4 text-sm font-semibold text-gray-300">Status</th>
                  <th className="p-4 text-sm font-semibold text-gray-300 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="border-b border-white/5 hover:bg-[#1e293b]/50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-gray-200">{user.email}</div>
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
                    <td className="p-4 text-sm text-gray-400">
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
                    <td colSpan={5} className="p-8 text-center text-gray-500">
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
