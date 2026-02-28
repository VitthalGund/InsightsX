"use client";

import { useState } from "react";
import Link from "next/link";
import { Activity, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Registration failed");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
    } catch (err) {
      console.error("Registration error:", err);
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#020617] flex justify-center items-center p-4 transition-colors">
        <div className="w-full max-w-md bg-white dark:bg-[#0f172a] rounded-xl border border-gray-200 dark:border-white/10 p-8 shadow-2xl text-center transition-colors">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center border border-green-200 dark:border-green-500/30">
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Registration Successful!</h2>
          
          <div className="mb-6 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 p-4 rounded-lg">
            <p className="text-indigo-600 dark:text-indigo-300 text-sm">Your account setup is complete. You can now log in and access the platform.</p>
          </div>

          <Link href="/login" className="inline-block w-full py-3 px-4 bg-gray-100 dark:bg-[#1e293b] hover:bg-gray-200 dark:hover:bg-[#334155] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-lg font-medium transition-colors">
            Return to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 transition-colors">
      <div className="w-full max-w-md bg-surface rounded-xl border border-gray-200 dark:border-white/10 p-8 shadow-2xl transition-colors">
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <Activity className="w-6 h-6 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-semibold text-text-main text-center mb-2">Create Account</h2>
        <p className="text-text-muted text-center mb-8">Join InsightsX Analytics</p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-main mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-background border border-gray-200 dark:border-white/10 text-text-main placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-main mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-background border border-gray-200 dark:border-white/10 text-text-main placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="At least 6 characters"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white rounded-lg font-medium transition-colors mt-6"
          >
            {loading ? "Creating Account..." : "Register"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-text-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:text-primary-dark transition-colors font-medium">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
