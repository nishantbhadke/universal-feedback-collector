import { NextResponse } from 'next/server';
import { getStorageProvider, FeedbackSubmission } from '@/lib/storage';
import { sendFeedbackNotification } from '@/lib/email';

// Simple in-memory rate-limiter: stores timestamp array per userToken/IP
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_SUBMISSIONS_PER_WINDOW = 3;

function isRateLimited(token: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(token) || [];

  // Filter timestamps within the 1-minute window
  const validTimestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW);
  
  if (validTimestamps.length >= MAX_SUBMISSIONS_PER_WINDOW) {
    return true;
  }

  validTimestamps.push(now);
  rateLimitMap.set(token, validTimestamps);
  return false;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const project = searchParams.get('project') || undefined;
    const category = searchParams.get('category') || undefined;
    const rating = searchParams.get('rating') ? Number(searchParams.get('rating')) : undefined;
    const search = searchParams.get('search') || undefined;
    const userToken = searchParams.get('userToken') || undefined;
    const role = searchParams.get('role') || undefined;
    const location = searchParams.get('location') || undefined;
    const contributorName = searchParams.get('contributorName') || undefined;
    const githubUsername = searchParams.get('githubUsername') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const storage = getStorageProvider();
    const feedback = await storage.getFeedback({
      project,
      category,
      rating,
      search,
      userToken,
      role,
      location,
      contributorName,
      githubUsername,
      startDate,
      endDate
    });

    return NextResponse.json(feedback);
  } catch (error) {
    console.error('API Error: GET /api/feedback failed:', error);
    return NextResponse.json({ error: 'Failed to query submissions' }, { status: 500 });
  }
}

async function sendDiscordNotification(feedback: FeedbackSubmission) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    const stars = '⭐'.repeat(feedback.rating);
    const embed: any = {
      title: `✦ ${feedback.title}`,
      description: feedback.feedback,
      color: 0x6366f1, // Indigo hex
      fields: [
        { name: 'Rating', value: `${stars} (${feedback.rating}/5)`, inline: true },
        { name: 'Category', value: feedback.category, inline: true },
        { name: 'Reviewer', value: `${feedback.name} (${feedback.role})`, inline: true }
      ],
      footer: { text: `Universal Feedback Collector • ${feedback.project}` },
      timestamp: new Date().toISOString()
    };

    if (feedback.githubProfile) {
      embed.fields.push({ name: 'GitHub Profile', value: `[View Profile](${feedback.githubProfile})`, inline: true });
    }
    if (feedback.prLink) {
      embed.fields.push({ name: 'PR Link', value: `[View PR/Commit](${feedback.prLink})`, inline: true });
    }

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `**New Review Logged on Vercel Node!** 🚀`,
        embeds: [embed]
      })
    });
  } catch (err) {
    console.error('Discord Webhook Error:', err);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Bot Honeypot check: 'website' field must remain empty
    if (body.website && body.website.trim() !== '') {
      console.warn('🛡️  Spam Guard: Blocked automated bot submission via honeypot field.');
      // Return a simulated success to confuse the spam bot
      return NextResponse.json({ success: true, message: 'Submission logged' }, { status: 200 });
    }

    const {
      project,
      category,
      name,
      email,
      location,
      role,
      rating,
      title,
      feedback,
      githubProfile,
      prLink,
      attachmentUrl,
      credibility,
      userToken
    } = body;

    // 2. Input validation
    if (!project || !category || !name || !role || !rating || !title || !feedback || !userToken) {
      return NextResponse.json({ error: 'Missing mandatory fields' }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    // 3. Security: Rate limiting check
    if (isRateLimited(userToken)) {
      console.warn(`🛡️  Rate Limiter: Blocked excessive submissions from token "${userToken}".`);
      return NextResponse.json({ error: 'Too many submissions. Please wait 60 seconds before trying again.' }, { status: 429 });
    }

    const storage = getStorageProvider();

    // 4. Save feedback in the storage engine
    const savedSubmission = await storage.submitFeedback({
      project,
      category,
      name,
      email,
      location,
      role,
      rating,
      title,
      feedback,
      githubProfile,
      prLink,
      attachmentUrl,
      credibility: credibility || 'User',
      userToken
    });

    // 5. Fire non-blocking SMTP notification email in the background
    sendFeedbackNotification(savedSubmission).catch(err => {
      console.error('Background Notification Dispatch Error:', err);
    });

    // 6. Fire non-blocking Discord Webhook notification
    sendDiscordNotification(savedSubmission).catch(err => {
      console.error('Background Discord Dispatch Error:', err);
    });

    return NextResponse.json(savedSubmission, { status: 201 });
  } catch (error) {
    console.error('API Error: POST /api/feedback failed:', error);
    return NextResponse.json({ error: (error as Error).message || 'Failed to submit feedback' }, { status: 500 });
  }
}
