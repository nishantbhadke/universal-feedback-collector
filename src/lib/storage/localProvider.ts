import fs from 'fs';
import path from 'path';
import { StorageProvider, ProjectInfo, CategoryInfo, FeedbackSubmission } from './index';

const DB_DIR = path.join(process.cwd(), '.data');
const DB_FILE = path.join(DB_DIR, 'db.json');

interface LocalDbSchema {
  projects: ProjectInfo[];
  categories: CategoryInfo[];
  submissions: FeedbackSubmission[];
  upvotedTokens: Record<string, string[]>; // submissionId -> list of userTokens that upvoted
}

export class LocalFileStorageProvider implements StorageProvider {
  private cache: LocalDbSchema | null = null;

  constructor() {
    this.ensureInitialized();
  }

  private ensureInitialized() {
    if (this.cache) return;

    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const fileContent = fs.readFileSync(DB_FILE, 'utf8');
        this.cache = JSON.parse(fileContent);
        return;
      } catch (err) {
        console.error('Error reading local db file, re-initializing database', err);
      }
    }

    // Default seed data
    const initialDb: LocalDbSchema = {
      projects: [
        { name: 'FitSaaS', isActive: true, isArchived: false, createdAt: new Date().toISOString() },
        { name: 'Portfolio Website', isActive: true, isArchived: false, createdAt: new Date().toISOString() },
        { name: 'Resume Builder', isActive: true, isArchived: false, createdAt: new Date().toISOString() },
        { name: 'Expense Tracker', isActive: true, isArchived: false, createdAt: new Date().toISOString() }
      ],
      categories: [
        { name: 'Review', isActive: true, createdAt: new Date().toISOString() },
        { name: 'Suggestion', isActive: true, createdAt: new Date().toISOString() },
        { name: 'Change Request', isActive: true, createdAt: new Date().toISOString() },
        { name: 'Contribution', isActive: true, createdAt: new Date().toISOString() },
        { name: 'PR History', isActive: true, createdAt: new Date().toISOString() }
      ],
      submissions: [],
      upvotedTokens: {}
    };

    this.saveToDisk(initialDb);
    this.cache = initialDb;
  }

  private saveToDisk(data: LocalDbSchema) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to write local database file to disk', err);
    }
  }

  private getDb(): LocalDbSchema {
    this.ensureInitialized();
    return this.cache!;
  }

  // --- Projects ---
  async getProjects(): Promise<ProjectInfo[]> {
    return this.getDb().projects;
  }

  async createProject(name: string): Promise<ProjectInfo> {
    const db = this.getDb();
    if (db.projects.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      throw new Error(`Project "${name}" already exists.`);
    }

    const newProject: ProjectInfo = {
      name,
      isActive: true,
      isArchived: false,
      createdAt: new Date().toISOString()
    };

    db.projects.push(newProject);
    this.saveToDisk(db);
    return newProject;
  }

  async updateProject(name: string, updates: Partial<ProjectInfo>): Promise<ProjectInfo> {
    const db = this.getDb();
    const project = db.projects.find(p => p.name.toLowerCase() === name.toLowerCase());
    if (!project) {
      throw new Error(`Project "${name}" not found.`);
    }

    Object.assign(project, updates);
    this.saveToDisk(db);
    return project;
  }

  // --- Categories ---
  async getCategories(): Promise<CategoryInfo[]> {
    return this.getDb().categories;
  }

  async createCategory(name: string): Promise<CategoryInfo> {
    const db = this.getDb();
    if (db.categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      throw new Error(`Category "${name}" already exists.`);
    }

    const newCategory: CategoryInfo = {
      name,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    db.categories.push(newCategory);
    this.saveToDisk(db);
    return newCategory;
  }

  // --- Submissions ---
  async submitFeedback(feedbackInput: Omit<FeedbackSubmission, 'id' | 'date' | 'status' | 'upvotes'>): Promise<FeedbackSubmission> {
    const db = this.getDb();
    
    // Auto-sentiment analysis rules
    let sentiment: FeedbackSubmission['sentiment'] = 'Neutral';
    if (feedbackInput.rating >= 4) sentiment = 'Positive';
    else if (feedbackInput.rating <= 2) sentiment = 'Negative';

    // XSS sanitization helper
    const sanitize = (text?: string) => text ? text.replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';

    const newSubmission: FeedbackSubmission = {
      ...feedbackInput,
      name: sanitize(feedbackInput.name),
      title: sanitize(feedbackInput.title),
      feedback: sanitize(feedbackInput.feedback),
      id: Math.random().toString(36).substring(2, 11) + '-' + Date.now().toString(36),
      date: new Date().toISOString(),
      status: 'New',
      upvotes: 0,
      sentiment
    };

    db.submissions.unshift(newSubmission);
    this.saveToDisk(db);
    return newSubmission;
  }

  async getFeedback(filters?: {
    project?: string;
    category?: string;
    rating?: number;
    search?: string;
    startDate?: string;
    endDate?: string;
    location?: string;
    role?: string;
    contributorName?: string;
    githubUsername?: string;
    userToken?: string;
  }): Promise<FeedbackSubmission[]> {
    const db = this.getDb();
    let results = [...db.submissions];

    if (filters) {
      if (filters.userToken) {
        // Retrieve ONLY submissions belonging to this user
        results = results.filter(f => f.userToken === filters.userToken);
      }
      if (filters.project) {
        results = results.filter(f => f.project.toLowerCase() === filters.project!.toLowerCase());
      }
      if (filters.category) {
        results = results.filter(f => f.category.toLowerCase() === filters.category!.toLowerCase());
      }
      if (filters.rating) {
        results = results.filter(f => f.rating === Number(filters.rating));
      }
      if (filters.location) {
        results = results.filter(f => f.location && f.location.toLowerCase().includes(filters.location!.toLowerCase()));
      }
      if (filters.role) {
        results = results.filter(f => f.role.toLowerCase() === filters.role!.toLowerCase());
      }
      if (filters.contributorName) {
        results = results.filter(f => f.name.toLowerCase().includes(filters.contributorName!.toLowerCase()));
      }
      if (filters.githubUsername) {
        results = results.filter(f => f.githubProfile && f.githubProfile.toLowerCase().includes(filters.githubUsername!.toLowerCase()));
      }
      if (filters.startDate) {
        const start = new Date(filters.startDate).getTime();
        results = results.filter(f => new Date(f.date).getTime() >= start);
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate).getTime();
        results = results.filter(f => new Date(f.date).getTime() <= end);
      }
      if (filters.search) {
        const query = filters.search.toLowerCase();
        results = results.filter(
          f =>
            f.title.toLowerCase().includes(query) ||
            f.feedback.toLowerCase().includes(query) ||
            (f.githubProfile && f.githubProfile.toLowerCase().includes(query))
        );
      }
    }

    return results;
  }

  async getFeedbackById(id: string): Promise<FeedbackSubmission | null> {
    const db = this.getDb();
    return db.submissions.find(f => f.id === id) || null;
  }

  async upvoteFeedback(id: string, voterToken: string): Promise<FeedbackSubmission> {
    const db = this.getDb();
    const feedback = db.submissions.find(f => f.id === id);
    if (!feedback) {
      throw new Error(`Submission "${id}" not found.`);
    }

    if (!db.upvotedTokens) {
      db.upvotedTokens = {};
    }

    if (!db.upvotedTokens[id]) {
      db.upvotedTokens[id] = [];
    }

    // Guard against duplicate upvotes per token
    if (db.upvotedTokens[id].includes(voterToken)) {
      throw new Error('You have already upvoted this feedback.');
    }

    db.upvotedTokens[id].push(voterToken);
    feedback.upvotes = (feedback.upvotes || 0) + 1;
    
    this.saveToDisk(db);
    return feedback;
  }

  async updateFeedbackStatus(id: string, status: FeedbackSubmission['status']): Promise<FeedbackSubmission> {
    const db = this.getDb();
    const feedback = db.submissions.find(f => f.id === id);
    if (!feedback) {
      throw new Error(`Submission "${id}" not found.`);
    }

    feedback.status = status;
    this.saveToDisk(db);
    return feedback;
  }
}
