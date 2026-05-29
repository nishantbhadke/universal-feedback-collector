'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ShieldCheck, Heart } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-gray-950/60 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="font-bold tracking-tight text-lg bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
              UPRC
            </span>
            <span className="text-[10px] block font-semibold text-indigo-400 -mt-1 tracking-widest">
              COLLECTOR
            </span>
          </div>
        </Link>

        {/* Action Links */}
        <div className="flex items-center space-x-4">
          <Link 
            href="/admin"
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-200"
          >
            <ShieldCheck className="h-4 w-4 text-indigo-400" />
            <span>Admin Console</span>
          </Link>
          
          <span className="hidden sm:inline-flex items-center space-x-1 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse mr-1"></span>
            ACTIVE SYNC
          </span>
        </div>

      </div>
    </header>
  );
}
