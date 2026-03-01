'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, MessageSquare, LogOut } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useSession, signOut } from 'next-auth/react';

export function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-white/10 bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <span className="material-symbols-outlined">analytics</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-text-main">
              FinSight
            </h2>
          </Link>
          
          {/* App Links (Only visible when logged in) */}
          {status === 'authenticated' && (
            <div className="hidden md:flex space-x-1">
              <Link 
                href="/dashboard"
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname?.startsWith('/dashboard') 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-text-muted hover:bg-surface hover:text-text-main'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Executive Briefing
              </Link>
              <Link 
                href="/chat"
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname?.startsWith('/chat') 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-text-muted hover:bg-surface hover:text-text-main'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                AI Analyst
              </Link>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <ThemeToggle />
          
          {status === 'authenticated' ? (
            <>
              <span className="hidden sm:block text-sm font-medium text-text-muted border-l border-gray-200 dark:border-white/10 pl-4">
                {session?.user?.email}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="flex h-9 items-center justify-center rounded-lg px-3 text-sm font-medium text-text-muted hover:bg-red-500/10 hover:text-red-500 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </>
          ) : status === 'unauthenticated' ? (
            <>
              <Link
                href="/login"
                className="hidden sm:flex h-9 items-center justify-center rounded-lg px-4 text-sm font-medium text-text-muted hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-bold text-white shadow-sm hover:bg-primary-dark transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                Launch Analyst
              </Link>
            </>
          ) : (
            /* Empty placeholder while loading session to prevent layout shift */
            <div className="w-32 h-9" />
          )}
        </div>
      </div>
    </nav>
  );
}