'use client';

import React, { useState, useEffect } from 'react';
import { Search, Star, Calendar, MessageSquare, AlertCircle, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { FeedbackSubmission } from '@/lib/storage';

export default function FeedbackHistory() {
  const [feedbacks, setFeedbacks] = useState<FeedbackSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUserHistory = async () => {
    setLoading(true);
    try {
      const userToken = localStorage.getItem('uprc_user_token');
      if (!userToken) {
        setFeedbacks([]);
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      params.append('userToken', userToken);
      if (search) params.append('search', search);

      const response = await fetch(`/api/feedback?${params.toString()}`);
      const data = await response.json();
      setFeedbacks(data);
    } catch (err) {
      console.error('Failed to load user history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserHistory();
  }, [search]);

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-800 pb-3">
        <h2 className="text-xl font-bold text-white flex items-center">
          <span className="h-6 w-6 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mr-2 text-xs font-bold font-heading">📌</span>
          Your Submission History
        </h2>
        <span className="text-[11px] font-bold uppercase tracking-wider bg-white/5 px-2.5 py-1 border border-white/5 text-gray-400 rounded-lg">
          {feedbacks.length} Contributed Entries
        </span>
      </div>

      {/* Internal Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter your submissions..."
          className="w-full pl-9 pr-4 py-2 rounded-xl border border-white/5 bg-gray-900/60 text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* History Submissions lists */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-2">
          <Loader2 className="h-6 w-6 text-indigo-400 animate-spin" />
          <span className="text-xs text-gray-500 font-mono">Syncing token records...</span>
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 bg-gray-950/20 border border-white/5 text-center flex flex-col items-center justify-center space-y-2">
          <AlertCircle className="h-7 w-7 text-gray-600" />
          <h3 className="text-xs font-bold text-gray-300 font-heading">No Submissions Logged</h3>
          <p className="text-[11px] text-gray-500 max-w-xs leading-relaxed">
            Your contributions will automatically appear here using anonymous browser tokens as soon as you submit feedback!
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {feedbacks.map((f) => {
            const statusColors = {
              New: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
              Reviewed: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
              Planned: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
              Implemented: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
              Rejected: 'bg-gray-500/10 text-gray-400 border-gray-500/20'
            };

            return (
              <div 
                key={f.id}
                className="glass-card rounded-xl p-4 border border-white/5 bg-gray-950/10 hover:border-white/10 transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                
                {/* Meta details */}
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 flex-wrap gap-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {f.project}
                    </span>
                    <span className="text-[9px] text-gray-500 font-mono">
                      Category: {f.category}
                    </span>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${statusColors[f.status] || statusColors.New}`}>
                      {f.status}
                    </span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-white font-heading">
                    {f.title}
                  </h3>

                  <div className="flex items-center space-x-1.5 text-[10px] text-gray-500">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatDate(f.date)}</span>
                  </div>
                </div>

                {/* Rating display */}
                <div className="flex items-center justify-between sm:justify-end gap-6 flex-shrink-0">
                  
                  <div className="flex items-center space-x-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star 
                        key={s} 
                        className={`h-3 w-3 ${s <= f.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-700'}`} 
                      />
                    ))}
                  </div>

                  <div className="flex items-center space-x-1 text-[10px] text-gray-400 font-mono">
                    <MessageSquare className="h-3.5 w-3.5 text-indigo-400" />
                    <span>{f.upvotes || 0} support votes</span>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
