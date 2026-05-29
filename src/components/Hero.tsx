import React from 'react';
import { Sparkles, MessageSquare, Star, Terminal } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-12 pb-8 text-center px-4">
      {/* Visual Organic Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 w-full max-w-7xl h-80 bg-gradient-to-b from-indigo-500/10 to-transparent blur-[120px]" />
      
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Dynamic Badge */}
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/5 text-indigo-400 border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          <span>Universal Feedback Repository</span>
        </div>

        {/* Heading */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-50 to-indigo-300 bg-clip-text text-transparent">
          Crafting Products Through Public Feedback
        </h1>

        {/* Subtitle */}
        <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          A centralized, completely independent feedback command center. Submit reviews, share change requests, suggest improvements, record PR contributions, and view overall test histories in real-time.
        </p>

        {/* Tech Highlights */}
        <div className="pt-4 flex flex-wrap justify-center gap-3 sm:gap-6 text-xs text-gray-400 font-mono">
          <span className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
            <Star className="h-3.5 w-3.5 text-amber-400 mr-1" />
            <span>Google Sheets DB Sync</span>
          </span>
          <span className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
            <MessageSquare className="h-3.5 w-3.5 text-indigo-400 mr-1" />
            <span>SMTP Alerts Triggered</span>
          </span>
          <span className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
            <Terminal className="h-3.5 w-3.5 text-emerald-400 mr-1" />
            <span>Anonymous Storage Tokens</span>
          </span>
        </div>

      </div>
    </section>
  );
}
