export interface FeedbackSubmission {
  id: string;
  date: string;
  project: string;
  category: string;
  name: string;
  email?: string;
  location?: string;
  role: string;
  rating: number;
  title: string;
  feedback: string;
  githubProfile?: string;
  prLink?: string;
  attachmentUrl?: string; // base64 compressed Data URL
  status: 'New' | 'Reviewed' | 'Planned' | 'Implemented' | 'Rejected';
  upvotes: number;
  sentiment?: 'Positive' | 'Neutral' | 'Negative';
  credibility: 'User' | 'Power User' | 'Tester' | 'Contributor' | 'Maintainer';
  userToken: string; // localStorage generated client-side token
}

export interface ProjectInfo {
  name: string;
  isActive: boolean;
  isArchived: boolean;
  createdAt: string;
}

export interface CategoryInfo {
  name: string;
  isActive: boolean;
  createdAt: string;
}

export interface StorageProvider {
  // Projects Management
  getProjects(): Promise<ProjectInfo[]>;
  createProject(name: string): Promise<ProjectInfo>;
  updateProject(name: string, updates: Partial<ProjectInfo>): Promise<ProjectInfo>;

  // Dynamic Categories Management
  getCategories(): Promise<CategoryInfo[]>;
  createCategory(name: string): Promise<CategoryInfo>;

  // Submissions & Feedback Retrieval
  submitFeedback(feedback: Omit<FeedbackSubmission, 'id' | 'date' | 'status' | 'upvotes'>): Promise<FeedbackSubmission>;
  getFeedback(filters?: {
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
  }): Promise<FeedbackSubmission[]>;
  getFeedbackById(id: string): Promise<FeedbackSubmission | null>;
  upvoteFeedback(id: string, voterIpOrToken: string): Promise<FeedbackSubmission>;
  updateFeedbackStatus(id: string, status: FeedbackSubmission['status']): Promise<FeedbackSubmission>;
}

// Global Storage Factory Router
import { LocalFileStorageProvider } from './localProvider';
import { GoogleSheetsStorageProvider } from './sheetsProvider';

let activeStorageInstance: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (activeStorageInstance) return activeStorageInstance;

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY;
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (email && key && sheetId) {
    console.log('⚡ Universal Feedback Collector: Initializing Google Sheets Storage Engine.');
    activeStorageInstance = new GoogleSheetsStorageProvider(email, key, sheetId);
  } else {
    console.warn(
      '⚠️  GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, or GOOGLE_SHEET_ID not found in environment. Fallback to Local Storage Engine.'
    );
    activeStorageInstance = new LocalFileStorageProvider();
  }

  return activeStorageInstance;
}
