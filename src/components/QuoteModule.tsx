'use client';

import React, { useState, useEffect } from 'react';
import { Terminal, RefreshCw } from 'lucide-react';
import { getRandomQuote, Quote } from '@/lib/quotes';

export default function QuoteModule() {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchNewQuote = async () => {
    setLoading(true);
    try {
      const q = await getRandomQuote();
      setQuote(q);
    } catch {
      // safe fallback
      setQuote({
        text: "Quality is not an act, it is a habit of craftsmanship.",
        author: "Aristotle"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNewQuote();
  }, []);

  if (!quote) return null;

  return (
    <div className="relative glass-card rounded-2xl p-5 border border-white/5 bg-gray-950/20 max-w-2xl mx-auto overflow-hidden group shadow-lg">
      
      {/* Decorative absolute terminal tag */}
      <div className="absolute top-2 right-2 opacity-10 group-hover:opacity-20 transition-opacity duration-300">
        <Terminal className="h-20 w-20 text-indigo-500" />
      </div>

      <div className="flex items-start space-x-3.5">
        <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
          <Terminal className="h-4 w-4" />
        </div>
        <div className="flex-1 text-left space-y-1.5">
          <p className={`text-sm text-gray-300 leading-relaxed italic transition-all duration-500 ${loading ? 'opacity-30 blur-xs' : 'opacity-100'}`}>
            "{quote.text}"
          </p>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold tracking-wide uppercase text-indigo-400 font-heading transition-opacity duration-500 ${loading ? 'opacity-30' : 'opacity-100'}`}>
              — {quote.author}
            </span>
            <button
              onClick={fetchNewQuote}
              disabled={loading}
              className="text-gray-500 hover:text-indigo-400 transition-colors p-1 rounded-md hover:bg-white/5 cursor-pointer disabled:opacity-50"
              title="Refresh Quote"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
