'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { SmoothScroll } from './smooth-scroll';

interface AppShellProps {
  children: React.ReactNode;
}

const navItems = [
  { href: '/', label: 'Overview' },
  { href: '/keywords', label: 'Keywords' },
  { href: '/board', label: 'Lifecycle' },
  { href: '/import', label: 'Import / Export' },
];

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <SmoothScroll>
      <div className="min-h-screen bg-[#F4F1EC] text-[#0E0E0E] flex flex-col lg:flex-row antialiased">
        {/* Desktop Slim Left Rail (Ink #0E0E0E) */}
        <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 z-40 bg-[#0E0E0E] text-[#F4F1EC] border-r border-[#262626] px-6 py-8 justify-between select-none">
          <div className="space-y-8">
            {/* Masthead / Wordmark in Display Serif */}
            <div>
              <Link href="/" className="block group">
                <span className="font-serif text-2xl tracking-tight text-[#F4F1EC] block font-normal leading-none group-hover:text-white transition-colors">
                  Aesthetic SEO
                </span>
                <span className="text-[10px] tracking-[0.2em] uppercase text-[#736E66] block mt-2 font-mono">
                  Registry & Index · Harley St.
                </span>
              </Link>
            </div>

            <div className="h-px bg-[#262626] w-full" />

            {/* Navigation List — Plain Text Labels, Active Hairline + Teal Dot */}
            <nav className="space-y-1.5" aria-label="Main Navigation">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group relative flex items-center justify-between px-3.5 py-2.5 text-sm transition-all duration-150 border-l ${
                      isActive
                        ? 'border-[#0F766E] text-[#FFFFFF] font-medium bg-[#171717]'
                        : 'border-transparent text-[#8C877F] hover:text-[#F4F1EC] hover:bg-[#141414]'
                    }`}
                  >
                    <span className="tracking-tight">{item.label}</span>
                    {isActive && (
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-[#0F766E]"
                        aria-hidden="true"
                      />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Bottom Account & Sign-out Rail */}
          <div className="space-y-4 pt-6 border-t border-[#262626]">
            <div className="flex flex-col">
              <span className="text-xs text-[#E5E0D8] font-medium tracking-tight truncate">
                {session?.user?.email || session?.user?.name || 'editor@aestheticseo.io'}
              </span>
              <span className="text-[11px] text-[#736E66] tracking-tight">
                Workspace · YourHealthFirst
              </span>
            </div>

            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-xs text-[#8C877F] hover:text-[#B91C1C] transition-colors tracking-tight text-left block w-full cursor-pointer py-1"
            >
              Sign out
            </button>
          </div>
        </aside>

        {/* Mobile Top Header (< lg) */}
        <header className="lg:hidden bg-[#0E0E0E] text-[#F4F1EC] border-b border-[#262626] px-4 py-4 sticky top-0 z-40">
          <div className="flex items-center justify-between">
            <Link href="/" className="block">
              <span className="font-serif text-xl tracking-tight text-[#F4F1EC] block font-normal">
                Aesthetic SEO
              </span>
            </Link>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-xs text-[#8C877F] hover:text-[#B91C1C] cursor-pointer"
            >
              Sign out
            </button>
          </div>

          <nav className="flex items-center gap-2 overflow-x-auto pt-3 border-t border-[#262626] mt-3 pb-1 no-scrollbar">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 text-xs whitespace-nowrap transition-colors flex items-center gap-1.5 border-b ${
                    isActive
                      ? 'border-[#0F766E] text-[#FFFFFF] font-medium'
                      : 'border-transparent text-[#8C877F]'
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="h-1 w-1 rounded-full bg-[#0F766E]" />
                  )}
                </Link>
              );
            })}
          </nav>
        </header>

        {/* Main Content Area (Paper #F4F1EC) */}
        <div className="flex-1 lg:ml-64 min-h-screen flex flex-col bg-[#F4F1EC]">
          {children}
        </div>
      </div>
    </SmoothScroll>
  );
}

// Re-export Navbar for drop-in backward compatibility with existing page imports
export function Navbar() {
  return null;
}
