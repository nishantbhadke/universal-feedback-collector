import { google } from 'googleapis';
import { StorageProvider, ProjectInfo, CategoryInfo, FeedbackSubmission } from './index';

export class GoogleSheetsStorageProvider implements StorageProvider {
  private authEmail: string;
  private authKey: string;
  private spreadsheetId: string;
  private sheetsClient: any = null;

  constructor(authEmail: string, authKey: string, spreadsheetId: string) {
    this.authEmail = authEmail;
    // Replace double escaped newlines that sometimes occur in env strings
    this.authKey = authKey.replace(/\\n/g, '\n');
    this.spreadsheetId = spreadsheetId;
  }

  private async getSheetsClient() {
    if (this.sheetsClient) return this.sheetsClient;

    const auth = new google.auth.JWT({
      email: this.authEmail,
      key: this.authKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    this.sheetsClient = google.sheets({ version: 'v4', auth });
    return this.sheetsClient;
  }

  // Self-bootstrapping helper: ensures a sheet tab exists with standard headers
  private async ensureSheetExists(title: string, headers: string[]): Promise<boolean> {
    const sheets = await this.getSheetsClient();
    
    try {
      const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId
      });
      
      const sheetExists = spreadsheet.data.sheets?.some(
        (s: any) => s.properties?.title?.toLowerCase() === title.toLowerCase()
      );

      if (!sheetExists) {
        console.log(`Creating missing worksheet tab: "${title}"`);
        // Add new worksheet (tab)
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: { title }
                }
              }
            ]
          }
        });

        // Write the header row
        await sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `'${title}'!A1`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [headers]
          }
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error ensuring sheet "${title}" exists:`, error);
      throw new Error(`Google Sheets connection error: ${(error as Error).message}`);
    }
  }

  // --- Projects ---
  async getProjects(): Promise<ProjectInfo[]> {
    const title = '_Projects';
    const headers = ['Project Name', 'Is Active', 'Is Archived', 'Created At'];
    await this.ensureSheetExists(title, headers);

    const sheets = await this.getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: `'${title}'!A2:D`
    });

    const rows = res.data.values || [];
    return rows.map((row: any) => ({
      name: row[0] || '',
      isActive: row[1] === 'TRUE',
      isArchived: row[2] === 'TRUE',
      createdAt: row[3] || new Date().toISOString()
    }));
  }

  async createProject(name: string): Promise<ProjectInfo> {
    const title = '_Projects';
    const headers = ['Project Name', 'Is Active', 'Is Archived', 'Created At'];
    await this.ensureSheetExists(title, headers);

    const currentProjects = await this.getProjects();
    if (currentProjects.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      throw new Error(`Project "${name}" already exists.`);
    }

    const newProject: ProjectInfo = {
      name,
      isActive: true,
      isArchived: false,
      createdAt: new Date().toISOString()
    };

    const sheets = await this.getSheetsClient();
    await sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: `'${title}'!A:D`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[newProject.name, 'TRUE', 'FALSE', newProject.createdAt]]
      }
    });

    // Proactively pre-bootstrap a dedicated sheet for this project to record feedback
    const submissionHeaders = [
      'Submission ID', 'Date', 'Category', 'Name', 'Email', 'Location',
      'Role', 'Rating', 'Title', 'Feedback', 'GitHub Profile', 'PR Link',
      'Attachment URL', 'Status', 'Upvotes', 'Sentiment', 'Credibility',
      'User Token'
    ];
    await this.ensureSheetExists(name, submissionHeaders);

    return newProject;
  }

  async updateProject(name: string, updates: Partial<ProjectInfo>): Promise<ProjectInfo> {
    const title = '_Projects';
    const headers = ['Project Name', 'Is Active', 'Is Archived', 'Created At'];
    await this.ensureSheetExists(title, headers);

    const sheets = await this.getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: `'${title}'!A2:D`
    });

    const rows = res.data.values || [];
    const index = rows.findIndex((row: any) => row[0]?.toLowerCase() === name.toLowerCase());
    if (index === -1) {
      throw new Error(`Project "${name}" not found in sheet.`);
    }

    const rowNumber = index + 2; // account for A1 header and 1-indexing
    const currentProject: ProjectInfo = {
      name: rows[index][0],
      isActive: rows[index][1] === 'TRUE',
      isArchived: rows[index][2] === 'TRUE',
      createdAt: rows[index][3] || new Date().toISOString()
    };

    const updated = { ...currentProject, ...updates };

    await sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: `'${title}'!A${rowNumber}:D${rowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          updated.name,
          updated.isActive ? 'TRUE' : 'FALSE',
          updated.isArchived ? 'TRUE' : 'FALSE',
          updated.createdAt
        ]]
      }
    });

    return updated;
  }

  // --- Categories ---
  async getCategories(): Promise<CategoryInfo[]> {
    const title = '_Categories';
    const headers = ['Category Name', 'Is Active', 'Created At'];
    await this.ensureSheetExists(title, headers);

    const sheets = await this.getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: `'${title}'!A2:C`
    });

    const rows = res.data.values || [];
    return rows.map((row: any) => ({
      name: row[0] || '',
      isActive: row[1] === 'TRUE',
      createdAt: row[2] || new Date().toISOString()
    }));
  }

  async createCategory(name: string): Promise<CategoryInfo> {
    const title = '_Categories';
    const headers = ['Category Name', 'Is Active', 'Created At'];
    await this.ensureSheetExists(title, headers);

    const currentCategories = await this.getCategories();
    if (currentCategories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      throw new Error(`Category "${name}" already exists.`);
    }

    const newCategory: CategoryInfo = {
      name,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    const sheets = await this.getSheetsClient();
    await sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: `'${title}'!A:C`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[newCategory.name, 'TRUE', newCategory.createdAt]]
      }
    });

    return newCategory;
  }

  // --- Submissions ---
  async submitFeedback(feedbackInput: Omit<FeedbackSubmission, 'id' | 'date' | 'status' | 'upvotes'>): Promise<FeedbackSubmission> {
    const name = feedbackInput.project;
    const submissionHeaders = [
      'Submission ID', 'Date', 'Category', 'Name', 'Email', 'Location',
      'Role', 'Rating', 'Title', 'Feedback', 'GitHub Profile', 'PR Link',
      'Attachment URL', 'Status', 'Upvotes', 'Sentiment', 'Credibility',
      'User Token'
    ];
    await this.ensureSheetExists(name, submissionHeaders);

    // Dynamic simple tone analyzer
    let sentiment: FeedbackSubmission['sentiment'] = 'Neutral';
    if (feedbackInput.rating >= 4) sentiment = 'Positive';
    else if (feedbackInput.rating <= 2) sentiment = 'Negative';

    // Simple sanitization against scripting tags
    const sanitize = (text?: string) => text ? text.replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';

    const newSubmission: FeedbackSubmission = {
      ...feedbackInput,
      name: sanitize(feedbackInput.name),
      title: sanitize(feedbackInput.title),
      feedback: sanitize(feedbackInput.feedback),
      id: 'sub-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36),
      date: new Date().toISOString(),
      status: 'New',
      upvotes: 0,
      sentiment
    };

    const sheets = await this.getSheetsClient();
    await sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: `'${name}'!A:R`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          newSubmission.id,
          newSubmission.date,
          newSubmission.category,
          newSubmission.name,
          newSubmission.email || '',
          newSubmission.location || '',
          newSubmission.role,
          newSubmission.rating,
          newSubmission.title,
          newSubmission.feedback,
          newSubmission.githubProfile || '',
          newSubmission.prLink || '',
          newSubmission.attachmentUrl || '',
          newSubmission.status,
          newSubmission.upvotes,
          newSubmission.sentiment,
          newSubmission.credibility,
          newSubmission.userToken
        ]]
      }
    });

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
    const sheets = await this.getSheetsClient();
    let submissions: FeedbackSubmission[] = [];

    // Resolve list of sheets to query
    let sheetsToQuery: string[] = [];
    if (filters?.project) {
      sheetsToQuery = [filters.project];
    } else {
      // Fetch all projects to query all tabs
      const projects = await this.getProjects();
      sheetsToQuery = projects.map(p => p.name);
    }

    for (const sheetName of sheetsToQuery) {
      try {
        const submissionHeaders = [
          'Submission ID', 'Date', 'Category', 'Name', 'Email', 'Location',
          'Role', 'Rating', 'Title', 'Feedback', 'GitHub Profile', 'PR Link',
          'Attachment URL', 'Status', 'Upvotes', 'Sentiment', 'Credibility',
          'User Token'
        ];
        await this.ensureSheetExists(sheetName, submissionHeaders);

        const res = await sheets.spreadsheets.values.get({
          spreadsheetId: this.spreadsheetId,
          range: `'${sheetName}'!A2:R`
        });

        const rows = res.data.values || [];
        const parsed = rows.map((row: any) => ({
          id: row[0] || '',
          date: row[1] || '',
          project: sheetName,
          category: row[2] || '',
          name: row[3] || '',
          email: row[4] || '',
          location: row[5] || '',
          role: row[6] || '',
          rating: Number(row[7]) || 5,
          title: row[8] || '',
          feedback: row[9] || '',
          githubProfile: row[10] || '',
          prLink: row[11] || '',
          attachmentUrl: row[12] || '',
          status: (row[13] || 'New') as FeedbackSubmission['status'],
          upvotes: Number(row[14]) || 0,
          sentiment: (row[15] || 'Neutral') as FeedbackSubmission['sentiment'],
          credibility: (row[16] || 'User') as FeedbackSubmission['credibility'],
          userToken: row[17] || ''
        }));

        submissions = [...submissions, ...parsed];
      } catch (err) {
        console.warn(`Worksheet tab "${sheetName}" not yet fully active or ready. Skipping query.`);
      }
    }

    // Sort submissions descending by date (most recent first)
    submissions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Apply filtration
    let results = submissions;
    if (filters) {
      if (filters.userToken) {
        results = results.filter(f => f.userToken === filters.userToken);
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
    const feedbackList = await this.getFeedback();
    return feedbackList.find(f => f.id === id) || null;
  }

  async upvoteFeedback(id: string, voterToken: string): Promise<FeedbackSubmission> {
    // Find where the feedback lies across all project tabs
    const feedback = await this.getFeedbackById(id);
    if (!feedback) {
      throw new Error(`Submission "${id}" not found.`);
    }

    const sheetName = feedback.project;
    const sheets = await this.getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: `'${sheetName}'!A2:R`
    });

    const rows = res.data.values || [];
    const index = rows.findIndex((row: any) => row[0] === id);
    if (index === -1) {
      throw new Error(`Submission row not found inside sheet "${sheetName}".`);
    }

    const rowNumber = index + 2; // offset header
    const currentUpvotes = Number(rows[index][14]) || 0;
    const updatedUpvotes = currentUpvotes + 1;

    // Write back upvotes value in Column O (15th column)
    await sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: `'${sheetName}'!O${rowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[updatedUpvotes]]
      }
    });

    feedback.upvotes = updatedUpvotes;
    return feedback;
  }

  async updateFeedbackStatus(id: string, status: FeedbackSubmission['status']): Promise<FeedbackSubmission> {
    const feedback = await this.getFeedbackById(id);
    if (!feedback) {
      throw new Error(`Submission "${id}" not found.`);
    }

    const sheetName = feedback.project;
    const sheets = await this.getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: `'${sheetName}'!A2:R`
    });

    const rows = res.data.values || [];
    const index = rows.findIndex((row: any) => row[0] === id);
    if (index === -1) {
      throw new Error(`Submission row not found inside sheet "${sheetName}".`);
    }

    const rowNumber = index + 2;

    // Write status in Column N (14th column)
    await sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: `'${sheetName}'!N${rowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[status]]
      }
    });

    feedback.status = status;
    return feedback;
  }
}
