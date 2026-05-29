'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Star, Heart, MapPin, ExternalLink, Calendar, User, Eye, AlertCircle, Loader2, MessageSquare, PlusCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { FeedbackSubmission } from '@/lib/storage';

interface FeedbackListProps {
  filterProjectName?: string;
}

export default function FeedbackList({ filterProjectName }: FeedbackListProps = {}) {
  const [feedbacks, setFeedbacks] = useState<FeedbackSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter configurations
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState(filterProjectName || '');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
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
    if (filterProjectName) {
      setProjectFilter(filterProjectName);
    }
  }, [filterProjectName]);

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

  const getSortedFeedbacks = () => {
    return [...feedbacks].sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      if (sortBy === 'highest') {
        return b.rating - a.rating;
      }
      if (sortBy === 'lowest') {
        return a.rating - b.rating;
      }
      return 0;
    });
  };

  // Lightweight markdown-like text parser for **bold** and `code`
  const renderMarkdown = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-extrabold text-white">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={index} className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px] text-indigo-300 border border-white/5">{part.slice(1, -1)}</code>;
      }
      return part;
    });
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

      {/* Dashboard Summary Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Reviews Card */}
        <div className="glass-card rounded-2xl p-4 bg-gray-950/20 border border-white/5 shadow-md space-y-1">
          <div className="text-[10px] text-gray-500 font-mono tracking-wider uppercase">Total Reviews</div>
          <div className="text-lg font-bold text-white font-heading">{feedbacks.length}</div>
        </div>

        {/* Avg Rating Card */}
        <div className="glass-card rounded-2xl p-4 bg-gray-950/20 border border-white/5 shadow-md space-y-1">
          <div className="text-[10px] text-gray-500 font-mono tracking-wider uppercase">Average Rating</div>
          <div className="text-lg font-bold text-amber-400 font-heading flex items-center">
            <Star className="h-4.5 w-4.5 fill-amber-400 text-amber-400 mr-1.5" />
            {feedbacks.length > 0 
              ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
              : '0.0'}
          </div>
        </div>

        {/* Projects Reviewed Card */}
        <div className="glass-card rounded-2xl p-4 bg-gray-950/20 border border-white/5 shadow-md space-y-1">
          <div className="text-[10px] text-gray-500 font-mono tracking-wider uppercase">Projects</div>
          <div className="text-lg font-bold text-white font-heading">
            {new Set(feedbacks.map(f => f.project)).size}
          </div>
        </div>

        {/* Contributors Card */}
        <div className="glass-card rounded-2xl p-4 bg-gray-950/20 border border-white/5 shadow-md space-y-1">
          <div className="text-[10px] text-gray-500 font-mono tracking-wider uppercase">Contributors</div>
          <div className="text-lg font-bold text-indigo-400 font-heading">
            {new Set(feedbacks.map(f => f.email || f.name)).size}
          </div>
        </div>
      </div>

      {/* Condensed Search & Sorting Toolbar */}
      <div className={`glass-card rounded-2xl p-3 bg-gray-950/20 border border-white/5 grid gap-2.5 shadow-md ${
        filterProjectName ? 'grid-cols-1 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-5'
      }`}>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reviews..."
            className="w-full pl-9 pr-4 h-9 rounded-xl border border-white/5 bg-gray-900/60 text-white placeholder-gray-500 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Project (only show if not pre-filtered) */}
        {!filterProjectName && (
          <div>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="w-full px-3 h-9 rounded-xl border border-white/5 bg-gray-900/60 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
            >
              <option value="">All Projects</option>
              {projectsList.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Category */}
        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 h-9 rounded-xl border border-white/5 bg-gray-900/60 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
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
            className="w-full px-3 h-9 rounded-xl border border-white/5 bg-gray-900/60 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
          >
            <option value="">All Ratings</option>
            <option value="5">⭐⭐⭐⭐⭐</option>
            <option value="4">⭐⭐⭐⭐</option>
            <option value="3">⭐⭐⭐</option>
            <option value="2">⭐⭐</option>
            <option value="1">⭐</option>
          </select>
        </div>

        {/* Sort By Dropdown */}
        <div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-3 h-9 rounded-xl border border-white/5 bg-gray-900/60 text-indigo-300 focus:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Rated</option>
            <option value="lowest">Lowest Rated</option>
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
        search || projectFilter || categoryFilter || ratingFilter ? (
          /* Filtered empty state (Scenario A) */
          <div className="glass-card rounded-2xl p-12 bg-gray-950/20 border border-white/5 text-center flex flex-col items-center justify-center space-y-3 shadow-lg animate-scale-up">
            <div className="h-12 w-12 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shadow-inner">
              <Search className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-gray-300 font-heading">No Results Found</h3>
              <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                We couldn't find any reviews matching your current filters. Try resetting them.
              </p>
            </div>
            <button
              onClick={() => {
                setSearch('');
                if (!filterProjectName) setProjectFilter('');
                setCategoryFilter('');
                setRatingFilter('');
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5 transition-all cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          /* Completely empty state (Scenario B) */
          <div className="glass-card rounded-2xl p-16 bg-gray-950/20 border border-white/5 text-center flex flex-col items-center justify-center space-y-4 shadow-lg animate-scale-up">
            <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shadow-inner">
              <MessageSquare className="h-6.5 w-6.5 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white font-heading">No Reviews Yet</h3>
              <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
                Be the first to share your thoughts, log contributions, or suggest feedback for this project!
              </p>
            </div>
            <button
              onClick={() => {
                const formElement = document.getElementById('website')?.closest('form');
                if (formElement) {
                  formElement.scrollIntoView({ behavior: 'smooth' });
                  // Focus first text input inside form
                  (formElement.querySelector('input[type="text"]') as HTMLInputElement)?.focus();
                }
              }}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all cursor-pointer transform hover:scale-105"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Be the first to submit feedback</span>
            </button>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {getSortedFeedbacks().map((f) => {
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
                    {renderMarkdown(f.feedback)}
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
