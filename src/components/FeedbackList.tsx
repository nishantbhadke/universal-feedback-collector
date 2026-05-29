'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Star, Heart, MapPin, ExternalLink, Calendar, User, Eye, AlertCircle, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { FeedbackSubmission } from '@/lib/storage';

export default function FeedbackList() {
  const [feedbacks, setFeedbacks] = useState<FeedbackSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter configurations
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [projectsList, setProjectsList] = useState<string[]>([]);
  const [categoriesList, setCategoriesList] = useState<string[]>([]);

  // Local storage upvoted list
  const [upvotedIds, setUpvotedIds] = useState<string[]>([]);

  // Detailed screenshot viewer modal
  const [activeScreenshot, setActiveScreenshot] = useState<string | null>(null);

  // Fetch configs and entries on load
  const fetchConfigs = async () => {
    try {
      const [projRes, catRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/categories')
      ]);
      const projs = await projRes.json();
      const cats = await catRes.json();

      setProjectsList(projs.filter((p: any) => !p.isArchived).map((p: any) => p.name));
      setCategoriesList(cats.map((c: any) => c.name));
    } catch (err) {
      console.error('Failed to load configs:', err);
    }
  };

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (projectFilter) params.append('project', projectFilter);
      if (categoryFilter) params.append('category', categoryFilter);
      if (ratingFilter) params.append('rating', ratingFilter);
      if (search) params.append('search', search);

      const response = await fetch(`/api/feedback?${params.toString()}`);
      const data = await response.json();
      setFeedbacks(data);
    } catch (err) {
      console.error('Failed to load feedback entries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
    
    // Load upvoted IDs from localStorage
    if (typeof window !== 'undefined') {
      const upvoted = JSON.parse(localStorage.getItem('uprc_upvoted_ids') || '[]');
      setUpvotedIds(upvoted);
    }
  }, []);

  useEffect(() => {
    fetchFeedback();
  }, [projectFilter, categoryFilter, ratingFilter, search]);

  // Handle upvoting
  const handleUpvote = async (id: string) => {
    if (upvotedIds.includes(id)) return;

    try {
      const userToken = localStorage.getItem('uprc_user_token') || 'anonymous';
      const response = await fetch(`/api/feedback/${id}/upvote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voterToken: userToken })
      });

      if (!response.ok) {
        throw new Error('Failed to upvote');
      }

      // Update local storage
      const newUpvoted = [...upvotedIds, id];
      localStorage.setItem('uprc_upvoted_ids', JSON.stringify(newUpvoted));
      setUpvotedIds(newUpvoted);

      // Instantly update state value
      setFeedbacks(prev =>
        prev.map(f => (f.id === id ? { ...f, upvotes: (f.upvotes || 0) + 1 } : f))
      );
    } catch (err) {
      console.error('Failed to register upvote:', err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Dynamic Screenshot Modal Overlay */}
      {activeScreenshot && (
        <div 
          onClick={() => setActiveScreenshot(null)}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
        >
          <div className="relative max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
            <img
              src={activeScreenshot}
              alt="Screenshot Full Attachment"
              className="object-contain max-w-full max-h-[85vh]"
            />
          </div>
        </div>
      )}

      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-800 pb-3">
        <h2 className="text-xl font-bold text-white flex items-center">
          <span className="h-6 w-6 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mr-2 text-xs font-bold font-heading">✦</span>
          Recent Feedback Repository
        </h2>
        <span className="text-[11px] font-bold uppercase tracking-wider bg-white/5 px-2.5 py-1 border border-white/5 text-gray-400 rounded-lg">
          Total: {feedbacks.length} Submissions
        </span>
      </div>

      {/* Filter and Search Panel */}
      <div className="glass-card rounded-2xl p-4 bg-gray-950/20 border border-white/5 grid grid-cols-1 sm:grid-cols-4 gap-3.5 shadow-md">
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search feedback..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-white/5 bg-gray-900/60 text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Project */}
        <div>
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-white/5 bg-gray-900/60 text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="">All Projects</option>
            {projectsList.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-white/5 bg-gray-900/60 text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="">All Categories</option>
            {categoriesList.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        {/* Rating */}
        <div>
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-white/5 bg-gray-900/60 text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="">All Ratings</option>
            <option value="5">⭐⭐⭐⭐⭐ (5 Stars)</option>
            <option value="4">⭐⭐⭐⭐ (4 Stars)</option>
            <option value="3">⭐⭐⭐ (3 Stars)</option>
            <option value="2">⭐⭐ (2 Stars)</option>
            <option value="1">⭐ (1 Star)</option>
          </select>
        </div>

      </div>

      {/* Grid of Feedbacks */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <Loader2 className="h-7 w-7 text-indigo-400 animate-spin" />
          <span className="text-xs text-gray-500 font-mono">Syncing live feedback repositories...</span>
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 bg-gray-950/20 border border-white/5 text-center flex flex-col items-center justify-center space-y-2">
          <AlertCircle className="h-8 w-8 text-gray-500" />
          <h3 className="text-sm font-bold text-gray-300 font-heading">No Submissions Found</h3>
          <p className="text-xs text-gray-500 max-w-xs">Try adjusting your search query or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {feedbacks.map((f) => {
            const hasUpvoted = upvotedIds.includes(f.id);
            
            // Sentiment badge style maps
            const sentimentColors = {
              Positive: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
              Neutral: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
              Negative: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            };

            // Status badge style maps
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
                className="glass-card rounded-2xl p-5 border border-white/5 bg-gray-950/15 flex flex-col justify-between hover:border-white/10 transition-all shadow-md group animate-scale-up"
              >
                <div>
                  
                  {/* Top badges bar */}
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {f.project}
                      </span>
                      <span className="text-[10px] font-medium text-gray-500">
                        {f.category}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {f.sentiment && (
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${sentimentColors[f.sentiment] || sentimentColors.Neutral}`}>
                          {f.sentiment}
                        </span>
                      )}
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${statusColors[f.status] || statusColors.New}`}>
                        {f.status}
                      </span>
                    </div>
                  </div>

                  {/* Stars and Title */}
                  <div className="space-y-1 mb-3">
                    <div className="flex items-center space-x-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star 
                          key={s} 
                          className={`h-3.5 w-3.5 ${s <= f.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-700'}`} 
                        />
                      ))}
                    </div>
                    <h3 className="text-sm font-bold text-white leading-snug font-heading group-hover:text-indigo-300 transition-colors">
                      {f.title}
                    </h3>
                  </div>

                  {/* Feedback text */}
                  <p className="text-xs text-gray-400 leading-relaxed mb-4 line-clamp-3">
                    {f.feedback}
                  </p>

                </div>

                {/* Bottom stats and upvotes block */}
                <div className="space-y-3 pt-3 border-t border-white/5">
                  
                  {/* Submitter info row */}
                  <div className="flex items-center justify-between text-[10px] text-gray-500">
                    <div className="flex items-center space-x-1.5">
                      <User className="h-3 w-3 text-indigo-400" />
                      <span className="font-semibold text-gray-400">{f.name}</span>
                      <span className="text-[9px] px-1 bg-white/5 rounded text-gray-400">{f.role}</span>
                    </div>

                    {f.location && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3 text-rose-400" />
                        <span>{f.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-1">
                    
                    {/* Timestamp */}
                    <div className="flex items-center space-x-1 text-[9px] text-gray-500 font-mono">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(f.date)}</span>
                    </div>

                    {/* Right side attachment and upvote */}
                    <div className="flex items-center space-x-2.5">
                      
                      {/* Attachment URL check */}
                      {f.attachmentUrl && (
                        <button
                          onClick={() => setActiveScreenshot(f.attachmentUrl || null)}
                          className="h-7 w-7 rounded-lg bg-white/5 text-gray-400 hover:text-indigo-400 hover:bg-white/10 flex items-center justify-center cursor-pointer transition-colors border border-white/5"
                          title="View Screenshot Attachment"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {/* GitHub / PR links */}
                      {f.githubProfile && (
                        <a
                          href={f.githubProfile}
                          target="_blank"
                          rel="noreferrer"
                          className="h-7 w-7 rounded-lg bg-white/5 text-gray-400 hover:text-indigo-400 hover:bg-white/10 flex items-center justify-center transition-colors border border-white/5"
                          title="Submitter's GitHub Profile"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}

                      {/* Upvote Button */}
                      <button
                        onClick={() => handleUpvote(f.id)}
                        disabled={hasUpvoted}
                        className={`h-7 px-2.5 rounded-lg flex items-center space-x-1.5 text-[10px] font-bold border transition-all cursor-pointer ${
                          hasUpvoted 
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 cursor-default' 
                            : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-rose-400'
                        }`}
                        title={hasUpvoted ? 'You have upvoted this' : 'Upvote suggestion'}
                      >
                        <Heart className={`h-3 w-3 ${hasUpvoted ? 'fill-rose-400 text-rose-400' : ''}`} />
                        <span>{f.upvotes || 0}</span>
                      </button>

                    </div>

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
