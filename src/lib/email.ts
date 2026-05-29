import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { FeedbackSubmission } from './storage';

const EMAIL_LOG_DIR = path.join(process.cwd(), '.data');
const EMAIL_LOG_FILE = path.join(EMAIL_LOG_DIR, 'email-logs.txt');

export async function sendFeedbackNotification(feedback: FeedbackSubmission): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || '"Universal Feedback Collector" <noreply@collector.com>';
  const to = process.env.NOTIFICATION_RECIPIENT || 'owner@collector.com';

  const stars = '⭐'.repeat(feedback.rating) + '☆'.repeat(5 - feedback.rating);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Feedback Received: ${feedback.project}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6; color: #1f2937; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e5e7eb; }
        .header { background: linear-gradient(135deg, #4f46e5, #6366f1); padding: 30px 20px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em; }
        .header p { margin: 5px 0 0 0; opacity: 0.9; font-size: 14px; }
        .content { padding: 30px 20px; }
        .badge { display: inline-block; padding: 4px 10px; background-color: #eef2ff; color: #4f46e5; border-radius: 9999px; font-size: 12px; font-weight: 600; margin-bottom: 20px; border: 1px solid #e0e7ff; }
        .meta-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 25px; background-color: #f9fafb; padding: 15px; border-radius: 8px; border: 1px solid #f3f4f6; }
        .meta-item { font-size: 13px; }
        .meta-label { font-weight: 600; color: #4b5563; display: block; margin-bottom: 2px; }
        .meta-value { color: #111827; }
        .stars { font-size: 18px; color: #eab308; margin-bottom: 20px; }
        .title { font-size: 18px; font-weight: 700; color: #111827; margin: 0 0 10px 0; }
        .feedback { font-size: 14px; line-height: 1.6; color: #374151; background-color: #f9fafb; border-left: 4px solid #4f46e5; padding: 15px; border-radius: 0 8px 8px 0; margin-bottom: 25px; }
        .footer { text-align: center; font-size: 11px; color: #9ca3af; padding: 20px; border-top: 1px solid #f3f4f6; }
        .links a { color: #4f46e5; text-decoration: none; font-weight: 500; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Feedback Received</h1>
          <p>Project: <strong>${feedback.project}</strong></p>
        </div>
        <div class="content">
          <div class="badge">${feedback.category}</div>
          
          <div class="meta-grid">
            <div class="meta-item">
              <span class="meta-label">Reviewer</span>
              <span class="meta-value">${feedback.name} (${feedback.role})</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Location</span>
              <span class="meta-value">${feedback.location || 'Unknown Location'}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Credibility</span>
              <span class="meta-value">${feedback.credibility}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Date & Time</span>
              <span class="meta-value">${new Date(feedback.date).toLocaleString()}</span>
            </div>
          </div>

          <div class="stars">${stars}</div>
          <h2 class="title">${feedback.title}</h2>
          <div class="feedback">
            ${feedback.feedback.replace(/\n/g, '<br>')}
          </div>

          ${feedback.githubProfile ? `<p style="font-size: 13px; color: #4b5563;"><strong>GitHub:</strong> <a href="${feedback.githubProfile}" style="color:#4f46e5;">${feedback.githubProfile}</a></p>` : ''}
          ${feedback.prLink ? `<p style="font-size: 13px; color: #4b5563;"><strong>PR Reference:</strong> <a href="${feedback.prLink}" style="color:#4f46e5;">${feedback.prLink}</a></p>` : ''}
          ${feedback.attachmentUrl ? `<p style="font-size: 13px; color: #4b5563;"><strong>Screenshot Uploaded:</strong> (Attached Base64 Data)</p>` : ''}
        </div>
        <div class="footer">
          <p>Universal Project Review & Contribution Collector System</p>
          <p class="links"><a href="http://localhost:3000/admin">Open Admin Control Panel</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  // 1. If SMTP is configured, send the real email!
  if (host && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass }
      });

      await transporter.sendMail({
        from,
        to,
        subject: `[${feedback.project}] New ${feedback.category} Submitted (${feedback.rating}/5 Stars)`,
        html: htmlContent
      });

      console.log(`✉️  Notification email sent successfully to ${to} for submission in "${feedback.project}".`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send SMTP notification email:', error);
      // Fallback to logs on SMTP error
    }
  }

  // 2. Logging Fallback (Standard Developer Mode)
  try {
    if (!fs.existsSync(EMAIL_LOG_DIR)) {
      fs.mkdirSync(EMAIL_LOG_DIR, { recursive: true });
    }

    const divider = '='.repeat(80);
    const textLog = `
${divider}
[NOTIFICATION DISPATCHED: ${new Date().toISOString()}]
To: ${to}
Subject: [${feedback.project}] New ${feedback.category} Submitted (${feedback.rating}/5 Stars)
--------------------------------------------------------------------------------
Reviewer: ${feedback.name} (${feedback.role})
Location: ${feedback.location || 'Unknown'}
Credibility: ${feedback.credibility}
Rating: ${stars} (${feedback.rating}/5)
Title: ${feedback.title}
Feedback: ${feedback.feedback}
GitHub Profile: ${feedback.githubProfile || 'None'}
PR Link: ${feedback.prLink || 'None'}
Attachment Base64 Size: ${feedback.attachmentUrl ? `${Math.round(feedback.attachmentUrl.length / 1024)} KB` : 'None'}
--------------------------------------------------------------------------------
HTML TEMPLATE DISPATCHED:
${htmlContent}
${divider}
`;

    fs.appendFileSync(EMAIL_LOG_FILE, textLog, 'utf8');
    console.log(`💾 SMTP is not configured. Email logged to disk fallback at: .data/email-logs.txt`);
    return true;
  } catch (logError) {
    console.error('❌ Failed to write email log to file:', logError);
    return false;
  }
}
