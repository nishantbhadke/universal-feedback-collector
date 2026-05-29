'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Loader2, Sparkles, TrendingUp, HelpCircle, 
  Settings, FolderPlus, Plus, Eye, Check, ExternalLink,
  Github, User, FileText, CheckCircle, BarChart3, AlertTriangle, ToggleLeft, ToggleRight,
  Star
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { FeedbackSubmission, ProjectInfo, CategoryInfo } from '@/lib/storage';

export default function AdminDashboard() {
  const [authenticated, setAuthenticated] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [authError, setAuthError] = useState('');

  // Dashboard loaded states
  const [feedbacks, setFeedbacks] = useState<FeedbackSubmission[]>([]);
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  // Administrative form additions
  const [newProject, setNewProject] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [adminStatusError, setAdminStatusError] = useState('');

  // Project repository mapping configurations
  const [projectRepos, setProjectRepos] = useState<Record<string, string>>({
    'FitSaaS': 'nishantbhadke/fitsaas',
    'Portfolio Website': 'nishantbhadke/portfolio',
    'Resume Builder': 'nishantbhadke/resume-builder',
    'Expense Tracker': 'nishantbhadke/expense-tracker'
  });

  // Detailed screenshot modal
  const [activeScreenshot, setActiveScreenshot] = useState<string | null>(null);

  // Load auth state from session storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPassphrase = sessionStorage.getItem('uprc_admin_token');
      if (savedPassphrase) {
        verifyAdmin(savedPassphrase);
      }
    }
  }, []);

  // Verify passphrase API helper
  const verifyAdmin = async (phrase: string) => {
    setVerifying(true);
    setAuthError('');
    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminPassphrase: phrase })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to authenticate');
      }

      sessionStorage.setItem('uprc_admin_token', phrase);
      setPassphrase(phrase);
      setAuthenticated(true);
      
      // Load administrative dashboard contents
      loadDashboardContents(phrase);
    } catch (err) {
      setAuthError((err as Error).message);
      sessionStorage.removeItem('uprc_admin_token');
    } finally {
      setVerifying(false);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyAdmin(passphrase);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('uprc_admin_token');
    setAuthenticated(false);
    setPassphrase('');
  };

  // Load metrics, projects, categories, submissions
  const loadDashboardContents = async (phrase: string) => {
    setLoadingDashboard(true);
    try {
      const [projRes, catRes, feedRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/categories'),
        fetch('/api/feedback')
      ]);

      const projs = await projRes.json();
      const cats = await catRes.json();
      const feeds = await feedRes.json();

      setProjects(projs);
      setCategories(cats);
      setFeedbacks(feeds);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoadingDashboard(false);
    }
  };

  // Create Project handler
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.trim()) return;

    setCreatingProject(true);
    setAdminStatusError('');

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProject.trim(), adminPassphrase: passphrase })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create project');
      }

      setProjects(prev => [...prev, data]);
      setNewProject('');
      
      // Seed default repo link
      setProjectRepos(prev => ({
        ...prev,
        [data.name]: `nishantbhadke/${data.name.toLowerCase().replace(/\s+/g, '-')}`
      }));

      // Reload feedback sheets list too
      loadDashboardContents(passphrase);
    } catch (err) {
      setAdminStatusError((err as Error).message);
    } finally {
      setCreatingProject(false);
    }
  };

  // Create Category handler
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    setCreatingCategory(true);
    setAdminStatusError('');

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategory.trim(), adminPassphrase: passphrase })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create category');
      }

      setCategories(prev => [...prev, data]);
      setNewCategory('');
    } catch (err) {
      setAdminStatusError((err as Error).message);
    } finally {
      setCreatingCategory(false);
    }
  };

  // Toggle project Active/Archived
  const toggleProjectStatus = async (name: string, fields: { isActive?: boolean; isArchived?: boolean }) => {
    try {
      const response = await fetch('/api/projects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, adminPassphrase: passphrase, ...fields })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to toggle project');
      }

      setProjects(prev => prev.map(p => (p.name === name ? data : p)));
    } catch (err) {
      alert((err as Error).message);
    }
  };

  // Update Submission Workflow Status
  const handleStatusChange = async (id: string, newStatus: FeedbackSubmission['status']) => {
    try {
      const response = await fetch(`/api/admin/feedback/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, adminPassphrase: passphrase })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update status');
      }

      // Live update local feedback array state
      setFeedbacks(prev =>
        prev.map(f => (f.id === id ? { ...f, status: newStatus } : f))
      );
    } catch (err) {
      alert((err as Error).message);
    }
  };

  // One-click Pre-filled GitHub Issue Generator
  const generateGitHubIssueUrl = (feedback: FeedbackSubmission) => {
    const repoPath = projectRepos[feedback.project] || `nishantbhadke/${feedback.project.toLowerCase().replace(/\s+/g, '-')}`;
    
    const issueTitle = encodeURIComponent(`[Feedback] ${feedback.title}`);
    
    const stars = '⭐'.repeat(feedback.rating) + '☆'.repeat(5 - feedback.rating);
    const bodyText = `
### Submission Metadata
- **Category:** ${feedback.category}
- **Rating:** ${stars} (${feedback.rating}/5)
- **Submitter:** ${feedback.name} (${feedback.role})
- **Location:** ${feedback.location || 'Unknown'}
- **Credibility:** ${feedback.credibility}
- **Sentiment Tone:** ${feedback.sentiment || 'Neutral'}
- **Date Logged:** ${new Date(feedback.date).toLocaleString()}

---

### Detailed Description
${feedback.feedback}

${feedback.prLink ? `\n- **PR Reference:** ${feedback.prLink}` : ''}
${feedback.githubProfile ? `\n- **Contributor Profile:** ${feedback.githubProfile}` : ''}

---
*Created via Universal Project Review & Contribution Collector System.*
    `;
    
    const issueBody = encodeURIComponent(bodyText.trim());
    return `https://github.com/${repoPath}/issues/new?title=${issueTitle}&body=${issueBody}`;
  };

  // Dashboard Aggregated Metric Calculations
  const totalReviews = feedbacks.length;
  const ratingAvg = totalReviews > 0 ? (feedbacks.reduce((acc, f) => acc + f.rating, 0) / totalReviews).toFixed(1) : '0';
  const categoryCounts = feedbacks.reduce((acc, f) => {
    acc[f.category] = (acc[f.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const projectCounts = feedbacks.reduce((acc, f) => {
    acc[f.project] = (acc[f.project] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Find Top Contributors (by score = upvotes * 2 + feedback rating)
  const topContributors = Object.values(
    feedbacks.reduce((acc, f) => {
      const name = f.name;
      if (!acc[name]) {
        acc[name] = { name, count: 0, upvotes: 0, credibility: f.credibility, role: f.role };
      }
      acc[name].count += 1;
      acc[name].upvotes += f.upvotes || 0;
      return acc;
    }, {} as Record<string, { name: string; count: number; upvotes: number; credibility: string; role: string }>)
  )
    .sort((a, b) => (b.upvotes * 2 + b.count) - (a.upvotes * 2 + a.count))
    .slice(0, 4);

  // --- RENDERING ADMIN LOGIN IF NOT AUTHENTICATED ---
  if (!authenticated) {
    return (
      <div className="max-w-md mx-auto pt-16 pb-12 px-4 animate-scale-up">
        <div className="glass-card rounded-2xl p-6 sm:p-8 border border-white/5 bg-gray-950/20 text-center space-y-6 shadow-xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mx-auto shadow-md">
            <ShieldCheck className="h-6 w-6" />
          </div>
          
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white font-heading">Admin Console Verification</h2>
            <p className="text-gray-400 text-xs leading-relaxed">
              Verify your developer passphrase credentials to access metrics, dynamic setup engines, and status workflows.
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {authError && (
              <div className="flex items-center space-x-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs animate-shake">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <div className="space-y-1.5 text-left">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Admin Passphrase</label>
              <input
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="••••••••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-gray-900/60 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              disabled={verifying}
              className="w-full py-2.5 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer transition-colors text-xs flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/15"
            >
              {verifying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <span>Access Admin Panel</span>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- RENDERING FULL ADMIN DASHBOARD CONTROL PANEL ---
  return (
    <div className="space-y-8 pb-16 px-4 sm:px-6 lg:px-8">
      
      {/* Screenshot viewer modal overlay */}
      {activeScreenshot && (
        <div 
          onClick={() => setActiveScreenshot(null)}
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
        >
          <div className="relative max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
            <img
              src={activeScreenshot}
              alt="Screenshot full size preview"
              className="object-contain max-w-full max-h-[85vh]"
            />
          </div>
        </div>
      )}

      {/* Admin header console bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center tracking-tight font-heading">
            <ShieldCheck className="h-7 w-7 text-indigo-400 mr-2" />
            Admin Control Command Center
          </h1>
          <p className="text-gray-400 text-xs mt-1 leading-relaxed">
            Synchronized directly to Google Sheets columns. Toggle active projects, manage categories, analyze ratings, and sync with GitHub issues.
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-600 hover:text-white cursor-pointer transition-colors self-start sm:self-center"
        >
          Lock Console (Logout)
        </button>
      </div>

      {loadingDashboard ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-3">
          <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
          <span className="text-xs text-gray-500 font-mono">Syncing sheets columns and database states...</span>
        </div>
      ) : (
        <>
          {/* 1. TOP METRIC CARDS ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="glass-card rounded-2xl p-5 border border-white/5 bg-gray-950/20 flex items-center space-x-4 shadow">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <span className="text-2xl font-black text-white font-heading">{totalReviews}</span>
                <span className="block text-[10px] uppercase font-bold text-gray-500 tracking-wider">Total Submissions</span>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-white/5 bg-gray-950/20 flex items-center space-x-4 shadow">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                <Star className="h-5 w-5" />
              </div>
              <div>
                <span className="text-2xl font-black text-white font-heading">{ratingAvg} / 5.0</span>
                <span className="block text-[10px] uppercase font-bold text-gray-500 tracking-wider">Average Rating</span>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-white/5 bg-gray-950/20 flex items-center space-x-4 shadow">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <span className="text-2xl font-black text-white font-heading">
                  {feedbacks.filter(f => f.status === 'Implemented').length}
                </span>
                <span className="block text-[10px] uppercase font-bold text-gray-500 tracking-wider">Implemented Items</span>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-white/5 bg-gray-950/20 flex items-center space-x-4 shadow">
              <div className="h-10 w-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <span className="text-2xl font-black text-white font-heading">
                  {feedbacks.reduce((acc, f) => acc + (f.upvotes || 0), 0)}
                </span>
                <span className="block text-[10px] uppercase font-bold text-gray-500 tracking-wider">Accumulated Upvotes</span>
              </div>
            </div>

          </div>

          {/* 2. CHARTS & CONFIGURATION ROW */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Project Distributions Chart (CSS Bar Chart) */}
            <div className="glass-card rounded-2xl p-5 border border-white/5 bg-gray-950/20 space-y-4 shadow lg:col-span-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center">
                <BarChart3 className="h-4 w-4 text-indigo-400 mr-1.5" />
                Submissions Per Project
              </h3>
              
              <div className="space-y-3 pt-2">
                {Object.keys(projectCounts).length === 0 ? (
                  <p className="text-xs text-gray-500 italic">No project stats parsed yet...</p>
                ) : (
                  Object.entries(projectCounts).map(([projName, count]) => {
                    const pct = Math.round((count / totalReviews) * 100);
                    return (
                      <div key={projName} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-gray-300">{projName}</span>
                          <span className="text-indigo-400 font-mono">{count} ({pct}%)</span>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-gray-900 border border-white/5 overflow-hidden">
                          <div 
                            style={{ width: `${pct}%` }} 
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 transition-all duration-500" 
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Dynamic Category Configurations */}
            <div className="glass-card rounded-2xl p-5 border border-white/5 bg-gray-950/20 space-y-4 shadow">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center">
                <Settings className="h-4 w-4 text-indigo-400 mr-1.5" />
                Dynamic Category Distributions
              </h3>

              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {Object.entries(categoryCounts).length === 0 ? (
                  <p className="text-xs text-gray-500 italic">No categorizations recorded...</p>
                ) : (
                  Object.entries(categoryCounts).map(([catName, count]) => (
                    <div key={catName} className="flex justify-between items-center text-xs p-2 rounded-lg bg-white/5 border border-white/5">
                      <span className="text-gray-300 font-medium">{catName}</span>
                      <span className="font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">{count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* 3. DYNAMIC CONFIGURATION FORMS & PROJECT REPOS LINKERS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Manage Projects Card */}
            <div className="glass-card rounded-2xl p-5 border border-white/5 bg-gray-950/20 space-y-4 shadow">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center">
                <FolderPlus className="h-4 w-4 text-indigo-400 mr-1.5" />
                Configure New Project
              </h3>

              {adminStatusError && (
                <div className="text-[11px] p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
                  {adminStatusError}
                </div>
              )}

              <form onSubmit={handleCreateProject} className="flex space-x-2">
                <input
                  type="text"
                  value={newProject}
                  onChange={(e) => setNewProject(e.target.value)}
                  placeholder="e.g. FitSaaS or Expense Tracker"
                  className="flex-1 px-3 py-2 rounded-xl border border-white/10 bg-gray-900 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
                <button
                  type="submit"
                  disabled={creatingProject}
                  className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer disabled:opacity-50 flex items-center space-x-1"
                >
                  {creatingProject ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  <span>Add Project</span>
                </button>
              </form>

              {/* Scrollable list of projects to toggle status or configure github repos */}
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 pt-1">
                {projects.map((p) => (
                  <div key={p.name} className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className={`font-bold ${p.isArchived ? 'text-gray-500 line-through' : 'text-white'}`}>
                        {p.name}
                      </span>
                      
                      <div className="flex items-center space-x-2">
                        {/* Toggle Active status */}
                        <button
                          onClick={() => toggleProjectStatus(p.name, { isActive: !p.isActive })}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer transition-colors ${
                            p.isActive 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {p.isActive ? 'Active' : 'Disabled'}
                        </button>

                        {/* Toggle Archived status */}
                        <button
                          onClick={() => toggleProjectStatus(p.name, { isArchived: !p.isArchived })}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer transition-colors ${
                            p.isArchived 
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                              : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                          }`}
                        >
                          {p.isArchived ? 'Archived' : 'Archive'}
                        </button>
                      </div>
                    </div>

                    {/* GitHub Repo link configured */}
                    <div className="flex items-center space-x-1.5">
                      <Github className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
                      <input
                        type="text"
                        value={projectRepos[p.name] || ''}
                        onChange={(e) => setProjectRepos(prev => ({ ...prev, [p.name]: e.target.value }))}
                        placeholder="owner/repo (e.g. nishantbhadke/fitsaas)"
                        className="w-full px-2 py-1 rounded bg-black/40 border border-white/5 text-[10px] text-gray-300 font-mono focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Manage Dynamic Categories Card */}
            <div className="glass-card rounded-2xl p-5 border border-white/5 bg-gray-950/20 space-y-4 shadow animate-scale-up">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center">
                <Plus className="h-4 w-4 text-indigo-400 mr-1.5" />
                Configure New Category
              </h3>

              <form onSubmit={handleCreateCategory} className="flex space-x-2">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="e.g. Bug Report or Performance"
                  className="flex-1 px-3 py-2 rounded-xl border border-white/10 bg-gray-900 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
                <button
                  type="submit"
                  disabled={creatingCategory}
                  className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer disabled:opacity-50 flex items-center space-x-1"
                >
                  {creatingCategory ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  <span>Add Category</span>
                </button>
              </form>

              {/* Scrollable list of dynamic categories */}
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                {categories.map((c) => (
                  <div key={c.name} className="flex justify-between items-center text-xs p-2 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-gray-300">{c.name}</span>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase tracking-wider">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* 4. TOTAL SUBMISSIONS WORKFLOW DATA GRID */}
          <div className="glass-card rounded-2xl p-5 border border-white/5 bg-gray-950/20 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center pb-2 border-b border-gray-800">
              <FileText className="h-4 w-4 text-indigo-400 mr-1.5" />
              Submissions Database & Workflow Management
            </h3>

            {feedbacks.length === 0 ? (
              <p className="text-xs text-gray-500 italic py-4 text-center">No submissions recorded in databases yet...</p>
            ) : (
              <div className="overflow-x-auto pr-1">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="text-gray-500 font-bold uppercase tracking-wider border-b border-white/5">
                      <th className="pb-3 pr-2">Project</th>
                      <th className="pb-3 pr-2">Submitter</th>
                      <th className="pb-3 pr-2">Summary</th>
                      <th className="pb-3 pr-2">Rating</th>
                      <th className="pb-3 pr-2">Tone</th>
                      <th className="pb-3 pr-2 text-center">Attachments</th>
                      <th className="pb-3 pr-2">Workflow Status</th>
                      <th className="pb-3 text-right">Git Integration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {feedbacks.map((f) => {
                      const sentimentColors = {
                        Positive: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                        Neutral: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
                        Negative: 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                      };

                      return (
                        <tr key={f.id} className="hover:bg-white/5 transition-colors group">
                          
                          {/* Project */}
                          <td className="py-3.5 pr-2">
                            <span className="font-bold text-indigo-400">{f.project}</span>
                            <span className="block text-[9px] text-gray-500">{f.category}</span>
                          </td>

                          {/* Submitter */}
                          <td className="py-3.5 pr-2">
                            <span className="font-semibold text-gray-200 block">{f.name}</span>
                            <span className="text-[9px] text-gray-500">{f.role} • {f.credibility}</span>
                          </td>

                          {/* Summary */}
                          <td className="py-3.5 pr-2 max-w-xs">
                            <span className="font-bold text-white block truncate">{f.title}</span>
                            <span className="text-[10px] text-gray-400 line-clamp-2 mt-0.5">{f.feedback}</span>
                          </td>

                          {/* Rating */}
                          <td className="py-3.5 pr-2 font-mono text-amber-400 font-bold">
                            {'★'.repeat(f.rating)}
                          </td>

                          {/* Sentiment */}
                          <td className="py-3.5 pr-2">
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${sentimentColors[f.sentiment || 'Neutral']}`}>
                              {f.sentiment || 'Neutral'}
                            </span>
                          </td>

                          {/* Attachment */}
                          <td className="py-3.5 pr-2 text-center">
                            {f.attachmentUrl ? (
                              <button
                                onClick={() => setActiveScreenshot(f.attachmentUrl || null)}
                                className="px-2 py-1 rounded bg-white/5 border border-white/5 hover:bg-white/10 hover:text-indigo-400 cursor-pointer text-[10px] text-gray-400 transition-colors font-mono"
                              >
                                View Canvas
                              </button>
                            ) : (
                              <span className="text-[10px] text-gray-600 font-mono">—</span>
                            )}
                          </td>

                          {/* Status workflow updater */}
                          <td className="py-3.5 pr-2">
                            <select
                              value={f.status}
                              onChange={(e) => handleStatusChange(f.id, e.target.value as FeedbackSubmission['status'])}
                              className="px-2 py-1 rounded bg-gray-900 border border-white/10 text-[10px] font-semibold text-gray-300 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                            >
                              <option value="New">New</option>
                              <option value="Reviewed">Reviewed</option>
                              <option value="Planned">Planned</option>
                              <option value="Implemented">Implemented</option>
                              <option value="Rejected">Rejected</option>
                            </select>
                          </td>

                          {/* 1-click issue pre-filler */}
                          <td className="py-3.5 text-right">
                            <a
                              href={generateGitHubIssueUrl(f)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-gray-900 border border-white/10 hover:border-indigo-500/40 hover:text-indigo-400 text-[10px] font-bold transition-all"
                            >
                              <Github className="h-3 w-3" />
                              <span>Create Issue</span>
                            </a>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

    </div>
  );
}
