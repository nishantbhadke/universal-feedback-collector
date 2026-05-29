'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Star, Upload, Trash2, CheckCircle, AlertCircle, Loader2, PenTool } from 'lucide-react';
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
  // Loaded lists
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
  const [credibility, setCredibility] = useState('User');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [feedback, setFeedback] = useState('');
  const [githubProfile, setGithubProfile] = useState('');
  const [prLink, setPrLink] = useState('');
  
  // Stealth bot honeypot state (must remain empty)
  const [website, setWebsite] = useState('');

  // Screenshot states
  const [screenshotBase64, setScreenshotBase64] = useState('');
  const [compressing, setCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Submission control
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Fetch projects and categories on load
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const [projRes, catRes] = await Promise.all([
          fetch('/api/projects'),
          fetch('/api/categories')
        ]);
        const projs = await projRes.json();
        const cats = await catRes.json();

        // Only active and non-archived projects
        const activeProjs = projs.filter((p: Project) => p.isActive && !p.isArchived);
        setProjects(activeProjs);

        // Only active categories
        const activeCats = cats.filter((c: Category) => c.isActive);
        setCategories(activeCats);

        // Auto-select first active category
        if (activeCats.length > 0) {
          setCategory(activeCats[0].name);
        }

        // Auto-select project if not locked and active projects exist
        if (!lockedProjectName && activeProjs.length > 0) {
          setProject(activeProjs[0].name);
        }
      } catch (err) {
        console.error('Failed to load project/category configs:', err);
      } finally {
        setLoadingConfig(false);
      }
    };

    fetchConfig();
  }, [lockedProjectName]);

  // Handle locked project name update
  useEffect(() => {
    if (lockedProjectName) {
      setProject(lockedProjectName);
    }
  }, [lockedProjectName]);

  // Client-side canvas screenshot compression
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

        // Downscale to 1024px maximum width
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
          // Compress to JPEG with 0.7 quality
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

  // Form submission handler
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
      // Get or create local tracking token
      const token = generateToken();

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
          feedback,
          githubProfile: githubProfile || undefined,
          prLink: prLink || undefined,
          attachmentUrl: screenshotBase64 || undefined,
          credibility,
          userToken: token,
          website // Stealth honeypot field
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit feedback');
      }

      setSubmitSuccess(true);
      
      // Reset form fields
      setName('');
      setEmail('');
      setLocation('');
      setRating(0);
      setTitle('');
      setFeedback('');
      setGithubProfile('');
      setPrLink('');
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
      <div className="glass-card rounded-2xl p-8 border border-white/5 bg-gray-950/20 text-center flex flex-col items-center justify-center space-y-3 min-h-[300px]">
        <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
        <span className="text-gray-400 text-sm">Initializing collection systems...</span>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-6 sm:p-8 border border-white/5 bg-gray-950/20 relative shadow-xl">
      
      {/* Dynamic Success overlay */}
      {submitSuccess && (
        <div className="absolute inset-0 z-20 rounded-2xl bg-gray-950/95 flex flex-col items-center justify-center text-center p-6 space-y-4 animate-fade-in">
          <div className="h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
            <CheckCircle className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-white font-heading">Feedback Submitted Successfully!</h3>
            <p className="text-gray-400 text-sm max-w-sm">
              Your submission has been captured. The owner has been notified and it is synced directly under the project's sheet dashboard!
            </p>
          </div>
          <button
            onClick={() => setSubmitSuccess(false)}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
          >
            Submit Another Feedback
          </button>
        </div>
      )}

      <div className="flex items-center space-x-3 mb-6 border-b border-gray-800 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-md shadow-indigo-500/5 flex-shrink-0">
          <PenTool className="h-5 w-5 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-none">
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
          <div className="flex items-center space-x-2.5 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm animate-shake">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
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

        {/* Project & Category Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Target Project</label>
            <select
              value={project}
              onChange={(e) => setProject(e.target.value)}
              disabled={!!lockedProjectName}
              className="w-full h-11 px-4 rounded-xl border border-white/10 bg-gray-950/40 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed text-sm"
              required
            >
              <option value="" disabled>Select a Project</option>
              {projects.map((p) => (
                <option key={p.name} value={p.name}>{p.name}</option>
              ))}
            </select>
            {lockedProjectName && (
              <span className="text-[10px] text-indigo-400 font-semibold block mt-1 tracking-wide">Locked: Sharing view activated</span>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-white/10 bg-gray-950/40 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
              required
            >
              {categories.map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Submitter Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nishant Bhadke"
              className="w-full h-11 px-4 rounded-xl border border-white/10 bg-gray-950/40 focus:bg-gray-900/60 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Email (Optional)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nishant@example.com"
              className="w-full h-11 px-4 rounded-xl border border-white/10 bg-gray-950/40 focus:bg-gray-900/60 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Location (Optional)</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="India"
              className="w-full h-11 px-4 rounded-xl border border-white/10 bg-gray-950/40 focus:bg-gray-900/60 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
            />
          </div>
        </div>

        {/* Roles & Credibility */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Your Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-white/10 bg-gray-950/40 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
            >
              <option value="User">User</option>
              <option value="Tester">Tester</option>
              <option value="Developer">Developer</option>
              <option value="Contributor">Contributor</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Reviewer Credibility</label>
            <select
              value={credibility}
              onChange={(e) => setCredibility(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-white/10 bg-gray-950/40 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
            >
              <option value="User">Standard User</option>
              <option value="Power User">Power User</option>
              <option value="Tester">Beta Tester</option>
              <option value="Contributor">Contributor</option>
              <option value="Maintainer">Maintainer</option>
            </select>
          </div>
        </div>

        {/* Dynamic Star Rating */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Rating</label>
          <div className="flex items-center space-x-1.5 pt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="focus:outline-none transform hover:scale-110 transition-transform cursor-pointer"
              >
                <Star
                  className={`h-7 w-7 transition-colors ${
                    (hoverRating || rating) >= star
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-gray-600 hover:text-amber-300'
                  }`}
                />
              </button>
            ))}
            <span className="text-xs text-gray-400 ml-3 font-semibold font-heading">
              {rating > 0 ? `${rating} / 5 Stars` : 'Select a Rating'}
            </span>
          </div>
        </div>

        {/* Title & Feedback Body */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Summary / Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Performance crash on dashboard load or Menstrual Cycle V3 widgets"
              className="w-full h-11 px-4 rounded-xl border border-white/10 bg-gray-950/40 focus:bg-gray-900/60 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Detailed Message</label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Describe your review, suggest changes, document bug details, or reference code improvements..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-white/10 bg-gray-950/40 focus:bg-gray-900/60 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm resize-y leading-relaxed"
              required
            />
          </div>
        </div>

        {/* References Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">GitHub Profile URL (Optional)</label>
            <input
              type="url"
              value={githubProfile}
              onChange={(e) => setGithubProfile(e.target.value)}
              placeholder="https://github.com/nishantbhadke"
              className="w-full h-11 px-4 rounded-xl border border-white/10 bg-gray-950/40 focus:bg-gray-900/60 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">PR / Commit Link (Optional)</label>
            <input
              type="url"
              value={prLink}
              onChange={(e) => setPrLink(e.target.value)}
              placeholder="https://github.com/nishantbhadke/fitsaas/pull/4"
              className="w-full h-11 px-4 rounded-xl border border-white/10 bg-gray-950/40 focus:bg-gray-900/60 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
            />
          </div>
        </div>

        {/* Canvas Image Upload Block */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Attach Screenshot <span className="text-gray-500 font-normal">(Optional, Compressed Client-side)</span></label>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            
            {/* Click to upload box */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:flex-1 h-24 border-2 border-dashed border-white/10 rounded-xl bg-gray-950/20 hover:bg-gray-900/40 hover:border-indigo-500/40 transition-all flex flex-col items-center justify-center cursor-pointer text-gray-400 space-y-1 group"
            >
              <Upload className="h-5 w-5 text-gray-500 group-hover:text-indigo-400 transition-colors" />
              <span className="text-[11px] font-semibold text-gray-300">Click to upload screenshot</span>
              <span className="text-[9px] text-gray-500 font-mono uppercase tracking-wide">Image Auto-Compressed (Max 1024px)</span>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleScreenshotChange}
                className="hidden"
              />
            </div>

            {/* Compressed Preview display */}
            {screenshotBase64 && (
              <div className="relative h-24 w-40 border border-white/10 rounded-xl overflow-hidden bg-black/40 group shadow-md flex-shrink-0 animate-scale-up">
                <img
                  src={screenshotBase64}
                  alt="Screenshot preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={removeScreenshot}
                    className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white cursor-pointer transition-transform duration-200 transform hover:scale-105"
                    title="Delete image"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Compressing loader */}
            {compressing && (
              <div className="h-24 w-40 border border-white/5 bg-gray-950/40 rounded-xl flex flex-col items-center justify-center text-indigo-400 text-xs font-mono space-y-1.5">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Compressing canvas...</span>
              </div>
            )}
          </div>
        </div>

        {/* Submission Button */}
        <button
          type="submit"
          disabled={submitting || compressing}
          className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white cursor-pointer shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-indigo-600/35 transition-all duration-200 flex items-center justify-center space-x-2"
        >
          {submitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Logging Contribution...</span>
            </>
          ) : (
            <span>Submit Feedback Entry</span>
          )}
        </button>

      </form>
    </div>
  );
}
