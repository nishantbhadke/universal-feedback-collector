'use client';

import React, { useState, useEffect } from 'react';
import { use } from 'react';
import { ArrowLeft, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import FeedbackForm from '@/components/FeedbackForm';
import FeedbackList from '@/components/FeedbackList';
import FeedbackHistory from '@/components/FeedbackHistory';

interface PageProps {
  params: Promise<{ projectName: string }>;
}

export default function ProjectPortalPage({ params }: PageProps) {
  const { projectName: encodedProjectName } = use(params);
  
  // Unescape url parameters (e.g. FitSaaS or portfolio-website)
  const decodedProjectName = decodeURIComponent(encodedProjectName);
  
  const [resolvedProjectName, setResolvedProjectName] = useState('');
  const [loadingResolution, setLoadingResolution] = useState(true);
  const [projectExists, setProjectExists] = useState(false);

  // Live refresh key trigger
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const resolveProject = async () => {
      try {
        const response = await fetch('/api/projects');
        const projects = await response.json();

        // Perform case-insensitive match
        const matched = projects.find(
          (p: any) => p.name.toLowerCase() === decodedProjectName.toLowerCase()
        );

        if (matched && matched.isActive && !matched.isArchived) {
          setResolvedProjectName(matched.name);
          setProjectExists(true);
        } else {
          setProjectExists(false);
        }
      } catch (err) {
        console.error('Error resolving project:', err);
        setProjectExists(false);
      } finally {
        setLoadingResolution(false);
      }
    };

    resolveProject();
  }, [decodedProjectName]);

  const handleSubmissionSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  if (loadingResolution) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
        <span className="text-xs text-gray-500 font-mono">Resolving project channels...</span>
      </div>
    );
  }

  if (!projectExists) {
    return (
      <div className="max-w-md mx-auto pt-16 px-4 text-center space-y-6">
        <div className="glass-card rounded-2xl p-8 border border-white/5 bg-gray-950/20 space-y-5 shadow-xl">
          <div className="h-12 w-12 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto shadow-md">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-white font-heading">Portal Channel Offline</h2>
            <p className="text-gray-400 text-xs leading-relaxed">
              The project feedback channel for <strong>"{decodedProjectName}"</strong> is archived, inactive, or does not exist.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Hub</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 px-4 sm:px-6 lg:px-8">
      
      {/* Portal Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-800 pb-5 gap-4">
        <div className="space-y-1">
          <Link
            href="/"
            className="inline-flex items-center space-x-1 text-xs text-gray-500 hover:text-indigo-400 transition-colors font-mono mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Main Hub</span>
          </Link>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white flex items-center tracking-tight font-heading">
            <Sparkles className="h-6 w-6 text-indigo-400 mr-2 animate-pulse" />
            {resolvedProjectName} Feedback Portal
          </h1>
          <p className="text-gray-400 text-xs leading-relaxed">
            Direct sharing channel active. Submitting logs contribution specifically for <strong>{resolvedProjectName}</strong>.
          </p>
        </div>
      </header>

      {/* Structured Portal layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main project specific submissions feed */}
        <div className="lg:col-span-2 space-y-6">
          <FeedbackList key={`list-${refreshKey}`} />
        </div>

        {/* Form locked specifically to this project */}
        <div>
          <FeedbackForm 
            lockedProjectName={resolvedProjectName} 
            onSuccess={handleSubmissionSuccess} 
          />
        </div>

      </div>

      {/* Personal submissions filtered */}
      <div>
        <FeedbackHistory key={`history-${refreshKey}`} />
      </div>

    </div>
  );
}
