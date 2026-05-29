'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Star, Upload, Trash2, CheckCircle, AlertCircle, Loader2, PenTool, User, Info, FileText } from 'lucide-react';
import { generateToken } from '@/lib/utils';

interface Project {
  name: string;
  isActive: boolean;
  isArchived: boolean;
}

interface Category {
  name: string;
  isActive: boolean;
}

interface FeedbackFormProps {
  lockedProjectName?: string;
  onSuccess?: () => void;
}

export default function FeedbackForm({ lockedProjectName, onSuccess }: FeedbackFormProps) {
  // Config loaded lists
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Form states
  const [project, setProject] = useState(lockedProjectName || '');
  const [category, setCategory] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [role, setRole] = useState('User');
  const [credibility, setCredibility] = useState('Regular User');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [feedback, setFeedback] = useState('');
  const [suggestions, setSuggestions] = useState('');
  const [githubProfile, setGithubProfile] = useState('');
  const [prLink, setPrLink] = useState('');
  
  // Honeypot anti-spam
  const [website, setWebsite] = useState('');

  // Screenshot states
  const [screenshotBase64, setScreenshotBase64] = useState('');
  const [compressing, setCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Submission controls
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Fetch configs
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const [projRes, catRes] = await Promise.all([
          fetch('/api/projects'),
          fetch('/api/categories')
        ]);
        const projs = await projRes.json();
        const cats = await catRes.json();

        const activeProjs = projs.filter((p: Project) => p.isActive && !p.isArchived);
        setProjects(activeProjs);

        const activeCats = cats.filter((c: Category) => c.isActive);
        setCategories(activeCats);

        if (activeCats.length > 0) {
          setCategory(activeCats[0].name);
        }

        if (!lockedProjectName && activeProjs.length > 0) {
          setProject(activeProjs[0].name);
        }
      } catch (err) {
        console.error('Failed to load form configs:', err);
      } finally {
        setLoadingConfig(false);
      }
    };

    fetchConfig();
  }, [lockedProjectName]);

  useEffect(() => {
    if (lockedProjectName) {
      setProject(lockedProjectName);
    }
  }, [lockedProjectName]);

  // Client-side compression
  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }

    setCompressing(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        const MAX_WIDTH = 1024;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setScreenshotBase64(compressedDataUrl);
        }
        setCompressing(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const removeScreenshot = () => {
    setScreenshotBase64('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Star dynamic texts helper
  const getRatingLabel = (score: number) => {
    switch (score) {
      case 1: return '1/5 - Poor';
      case 2: return '2/5 - Fair';
      case 3: return '3/5 - Average';
      case 4: return '4/5 - Good';
      case 5: return '5/5 - Excellent';
      default: return 'Select a Rating';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess(false);

    if (rating === 0) {
      setSubmitError('Please select a star rating (1–5).');
      return;
    }

    if (!project) {
      setSubmitError('Please select a target project.');
      return;
    }

    setSubmitting(true);

    try {
      const token = generateToken();

      // Industrial standard details merger: combine feedback and suggestions cleanly to preserve sheet columns!
      const combinedFeedback = feedback.trim() + (suggestions.trim() ? '\n\n💡 Suggestions:\n' + suggestions.trim() : '');

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project,
          category,
          name,
          email: email || undefined,
          location: location || undefined,
          role,
          rating,
          title,
          feedback: combinedFeedback,
          githubProfile: githubProfile || undefined,
          prLink: prLink || undefined,
          attachmentUrl: screenshotBase64 || undefined,
          credibility: credibility,
          userToken: token,
          website
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit feedback');
      }

      setSubmitSuccess(true);
      
      setName('');
      setEmail('');
      setLocation('');
      setRating(0);
      setTitle('');
      setFeedback('');
      setSuggestions('');
      removeScreenshot();

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setSubmitError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingConfig) {
    return (
      <div className="glass-card rounded-2xl p-8 bg-gray-950/20 text-center flex flex-col items-center justify-center space-y-3 min-h-[300px] border border-white/5 shadow-inner">
        <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
        <span className="text-gray-400 text-xs font-mono">Loading dynamic collectors...</span>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-6 border border-white/5 bg-gray-950/30 relative shadow-2xl overflow-hidden focus:outline-none">
      
      {/* Dynamic Success overlay */}
      {submitSuccess && (
        <div className="absolute inset-0 z-20 bg-gray-950/95 flex flex-col items-center justify-center text-center p-6 space-y-4 animate-fade-in">
          <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
            <CheckCircle className="h-6.5 w-6.5" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-white font-heading">Feedback Submitted!</h3>
            <p className="text-gray-400 text-xs max-w-xs leading-relaxed">
              Your review has been successfully logged. It is synced under the master project sheet and the maintainer has been notified.
            </p>
          </div>
          <button
            onClick={() => setSubmitSuccess(false)}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
          >
            Submit Another Feedback
          </button>
        </div>
      )}

      {/* Modern SaaS Header */}
      <div className="flex items-center space-x-3 mb-6 border-b border-white/5 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner flex-shrink-0">
          <PenTool className="h-4.5 w-4.5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight leading-none">
            Review Submission Form
          </h2>
          <span className="text-[10px] text-gray-500 font-mono block mt-1 tracking-wider uppercase">
            Active Collection Node
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Alerts */}
        {submitError && (
          <div className="flex items-center space-x-2 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs animate-shake">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Bot Honeypot Input: Hidden from humans completely */}
        <div className="hidden absolute opacity-0 pointer-events-none" aria-hidden="true">
          <label htmlFor="website">Leave this field empty</label>
          <input
            type="text"
            id="website"
            name="website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        {/* SECTION A: REVIEWER INFORMATION */}
        <div className="p-4 rounded-xl border border-white/5 bg-white/2 space-y-4">
          <div className="flex items-center space-x-1.5 border-b border-white/5 pb-2">
            <User className="h-3.5 w-3.5 text-indigo-400" />
            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider font-heading">
              A. Reviewer Information
            </h3>
          </div>

          <div className="space-y-3">
            {/* Name input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-400">
                Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nishant Bhadke"
                className="w-full h-11 px-4 rounded-xl border border-white/10 bg-gray-950/40 focus:bg-gray-900/60 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                required
              />
            </div>

            {/* Email & Location inline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-400">Email (Optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nishant@example.com"
                  className="w-full h-11 px-4 rounded-xl border border-white/10 bg-gray-950/40 focus:bg-gray-900/60 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-400">Location (Optional)</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="India"
                  className="w-full h-11 px-4 rounded-xl border border-white/10 bg-gray-950/40 focus:bg-gray-900/60 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                />
              </div>
            </div>

            {/* Role & Reviewer Type inline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-400">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-white/10 bg-gray-950/40 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                >
                  <option value="User">User</option>
                  <option value="Tester">Tester</option>
                  <option value="Developer">Developer</option>
                  <option value="Contributor">Contributor</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-400">Reviewer Type</label>
                <select
                  value={credibility}
                  onChange={(e) => setCredibility(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-white/10 bg-gray-950/40 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                >
                  <option value="First-Time User">First-Time User</option>
                  <option value="Regular User">Regular User</option>
                  <option value="Contributor">Contributor</option>
                  <option value="Maintainer">Maintainer</option>
                  <option value="Developer">Developer</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION B: REVIEW INFORMATION */}
        <div className="p-4 rounded-xl border border-white/5 bg-white/2 space-y-4">
          <div className="flex items-center space-x-1.5 border-b border-white/5 pb-2">
            <Info className="h-3.5 w-3.5 text-indigo-400" />
            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider font-heading">
              B. Review Details
            </h3>
          </div>

          <div className="space-y-4">
            {/* Project & Category Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-400">
                  Target Project <span className="text-rose-500">*</span>
                </label>
                <select
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  disabled={!!lockedProjectName}
                  className="w-full h-11 px-3.5 rounded-xl border border-white/10 bg-gray-950/40 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed text-sm"
                  required
                >
                  <option value="" disabled>Select a Project</option>
                  {projects.map((p) => (
                    <option key={p.name} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-400">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-white/10 bg-gray-950/40 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                  required
                >
                  {categories.map((c) => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* High Contrast Dynamic Rating Stars */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-400">
                Rating <span className="text-rose-500">*</span>
              </label>
              
              <div className="flex flex-col space-y-1">
                <div className="flex items-center space-x-2 pt-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="focus:outline-none transform hover:scale-115 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`h-7 w-7 transition-colors drop-shadow ${
                          (hoverRating || rating) >= star
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-700 hover:text-amber-300'
                        }`}
                      />
                    </button>
                  ))}
                  
                  {/* Dynamic Rating Label */}
                  <span className="text-xs font-bold text-amber-400 ml-3 font-heading tracking-wide">
                    {getRatingLabel(hoverRating || rating)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION C: FEEDBACK */}
        <div className="p-4 rounded-xl border border-white/5 bg-white/2 space-y-4">
          <div className="flex items-center space-x-1.5 border-b border-white/5 pb-2">
            <FileText className="h-3.5 w-3.5 text-indigo-400" />
            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider font-heading">
              C. Feedback & Suggestions
            </h3>
          </div>

          <div className="space-y-3">
            {/* Title Summary */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-400">
                Summary / Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Performance crash on dashboard load or Menstrual Cycle V3 widgets"
                className="w-full h-11 px-4 rounded-xl border border-white/10 bg-gray-950/40 focus:bg-gray-900/60 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                required
              />
            </div>

            {/* Detailed Description */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-400">
                Detailed Message <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Describe your review, document bug details, or reference code improvements..."
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-gray-950/40 focus:bg-gray-900/60 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm resize-y leading-relaxed"
                required
              />
            </div>

            {/* Suggestions & Improvements */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-400">
                Suggestions (Optional)
              </label>
              <textarea
                value={suggestions}
                onChange={(e) => setSuggestions(e.target.value)}
                placeholder="Share any structural improvements or specific recommendations to resolve the issue..."
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-gray-950/40 focus:bg-gray-900/60 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm resize-y leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* References Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-400">GitHub Profile URL (Optional)</label>
            <input
              type="url"
              value={githubProfile}
              onChange={(e) => setGithubProfile(e.target.value)}
              placeholder="https://github.com/nishantbhadke"
              className="w-full h-11 px-4 rounded-xl border border-white/10 bg-gray-950/40 focus:bg-gray-900/60 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-400">PR / Commit Link (Optional)</label>
            <input
              type="url"
              value={prLink}
              onChange={(e) => setPrLink(e.target.value)}
              placeholder="https://github.com/nishantbhadke/fitsaas/pull/4"
              className="w-full h-11 px-4 rounded-xl border border-white/10 bg-gray-950/40 focus:bg-gray-900/60 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
            />
          </div>
        </div>

        {/* Screenshot Upload with preview */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-400">Attach Screenshot (Optional)</label>
          
          <div className="flex flex-col sm:flex-row items-center gap-3">
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:flex-1 h-20 border-2 border-dashed border-white/5 rounded-xl bg-gray-950/20 hover:bg-gray-900/40 hover:border-indigo-500/40 transition-all flex flex-col items-center justify-center cursor-pointer text-gray-400 space-y-0.5 group"
            >
              <Upload className="h-4.5 w-4.5 text-gray-500 group-hover:text-indigo-400 transition-colors" />
              <span className="text-[10px] font-semibold text-gray-300">Click to upload screenshot</span>
              <span className="text-[8px] text-gray-500 font-mono uppercase tracking-wide">Compressed Client-side (&lt;100KB)</span>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleScreenshotChange}
                className="hidden"
              />
            </div>

            {screenshotBase64 && (
              <div className="relative h-20 w-36 border border-white/10 rounded-xl overflow-hidden bg-black/40 group shadow flex-shrink-0 animate-scale-up">
                <img
                  src={screenshotBase64}
                  alt="Screenshot preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={removeScreenshot}
                    className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white cursor-pointer transition-all transform hover:scale-105"
                    title="Delete image"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {compressing && (
              <div className="h-20 w-36 border border-white/5 bg-gray-950/40 rounded-xl flex flex-col items-center justify-center text-indigo-400 text-[10px] font-mono space-y-1">
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
                <span>Compressing...</span>
              </div>
            )}
          </div>
        </div>

        {/* Submission Button */}
        <button
          type="submit"
          disabled={submitting || compressing}
          className="w-full h-12 rounded-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white cursor-pointer shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-indigo-600/35 transition-all duration-200 flex items-center justify-center space-x-2 text-sm"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4.5 w-4.5 animate-spin" />
              <span>Logging Contribution...</span>
            </>
          ) : (
            <span>Submit Review</span>
          )}
        </button>

      </form>
    </div>
  );
}
