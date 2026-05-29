'use client';

import React, { useState } from 'react';
import Hero from '@/components/Hero';
import QuoteModule from '@/components/QuoteModule';
import FeedbackForm from '@/components/FeedbackForm';
import FeedbackList from '@/components/FeedbackList';
import FeedbackHistory from '@/components/FeedbackHistory';

export default function Home() {
  // A simple state key to trigger re-fetches in FeedbackList and FeedbackHistory
  // whenever a new feedback is successfully submitted!
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSubmissionSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-12">
      
      {/* Hero & Quotes */}
      <div className="space-y-6">
        <Hero />
        <QuoteModule />
      </div>

      {/* Main Interface Layout grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4 sm:px-6 lg:px-8">
        
        {/* Left Side: Recent Database Feedbacks List (takes 2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <FeedbackList key={`list-${refreshKey}`} />
        </div>

        {/* Right Side: Interactive Feedback Form (takes 1/3 width) */}
        <div>
          <FeedbackForm onSuccess={handleSubmissionSuccess} />
        </div>

      </div>

      {/* Bottom Segment: Personal submissions history list */}
      <div className="px-4 sm:px-6 lg:px-8">
        <FeedbackHistory key={`history-${refreshKey}`} />
      </div>

    </div>
  );
}
