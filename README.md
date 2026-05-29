# ✦ Universal Project Review & Contribution Collector

A centralized, standalone, premium SaaS-grade platform designed to collect, track, and manage project-related feedback, reviews, suggestions, PR history references, and bug reports from testers, users, and collaborators. Similar to Productboard, Linear, and Notion, it preserves a high-contrast dark theme aesthetic.

### 🌐 Live Production URL
Invite your reviewers to submit feedback directly at:
**[https://universal-feedback-collector.vercel.app](https://universal-feedback-collector.vercel.app)**

---

## 🌟 Key Features

* **Linear & Notion-Grade UX/UX:** High-hierarchy grid split (60% Feed / 40% Form) for clear visual focus, including elegant 4-metrics dashboard cards.
* **Client-Side DevTools Security:** Intercepts browser developer Inspect tools by blocking right-clicks and F12, Ctrl+Shift+I/J/C, and Ctrl+U keyboard shortcuts, preventing client inspection or runtime state tampering.
* **Honeypot Safeguards:** Advanced stealth honeypot anti-spam verification alongside sliding-window API rate limits (max 3 posts per minute) to drop bot spam silently.
* **Google Sheets API & SQLite Fallbacks:** Direct write-sync Google Sheets database structure that automatically partitions dynamic tabs per project. If Sheet credentials are not configured, it gracefully falls back to local data logs.
* **Dynamic Star Rating Components:** High-visibility amber yellow ratings that trigger real-time textual descriptions (Poor to Excellent).
* **Condensed Search & sorting Toolbar:** Responsive horizontal toolbar supporting keyword searches (Title, reviewer name, project) and multi-option sorting (Newest, Oldest, Highest, and Lowest Rated).
* **Scenario Empty States:** Clean center-aligned open-folder illustrations with active CTA scroll triggers.
* **Automated SMTP HTML Alerts:** Secure nodemailer compiled notifications delivered on successful submissions (falls back to local logs).

---

## 🚀 Getting Started

### 📦 Installation

Ensure Node.js is installed, then pull down dependencies inside the repository:

```bash
npm install
```

### 💻 Local Development

Launch the active Next.js development server:

```bash
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser to view the application locally.

### 🔧 Setup Google Sheets & SMTP Alert Keys

To activate production dynamic tab synchronization and active alert emails, consult the complete, step-by-step setup documentation:
👉 **[SETUP.html](file:///C:/Users/nisha/Documents/antigravity/epic-hopper/SETUP.html)**

---

## 🛠 Tech Stack

* **Frontend Framework:** Next.js 16 (Turbopack Engine)
* **Design Styling:** Tailwind CSS v4, Lucide React Brand Icons
* **Primary Fonts:** Outfit (Headers), Inter (Body Sans)
* **Authentication:** পাসফ্রেজ (Passphrase) Server-Side API verification
* **Local Caches:** SQLite-style `.data/db.json` dynamic file fallback

---

## 💎 Redesign & Audits Verification Documents
All timeline checklist, walkthrough, and specification plans are delivered solely as beautifully styled HTML files inside your repository:
* 📋 **Redesign Checklist Tracker:** [task.html](file:///C:/Users/nisha/Documents/antigravity/epic-hopper/task.html)
* 💡 **UI/UX Audit Specification Plan:** [implementation_plan.html](file:///C:/Users/nisha/Documents/antigravity/epic-hopper/implementation_plan.html)
* 🔍 **Verification Walkthrough Logs:** [walkthrough.html](file:///C:/Users/nisha/Documents/antigravity/epic-hopper/walkthrough.html)

---
*Standalone Collector Node • Active Sheets Sync • Linear Aesthetics*
