import { NextResponse } from 'next/server';
import { getStorageProvider } from '@/lib/storage';

export async function GET() {
  try {
    const storage = getStorageProvider();
    const projects = await storage.getProjects();
    return NextResponse.json(projects);
  } catch (error) {
    console.error('API Error: GET /api/projects failed:', error);
    return NextResponse.json({ error: 'Failed to retrieve projects list' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, adminPassphrase } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    // Admin authorization check
    const systemPassphrase = process.env.ADMIN_PASSPHRASE || 'admin123';
    if (adminPassphrase !== systemPassphrase) {
      return NextResponse.json({ error: 'Unauthorized: Invalid admin passphrase' }, { status: 401 });
    }

    const storage = getStorageProvider();
    const newProject = await storage.createProject(name.trim());
    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error('API Error: POST /api/projects failed:', error);
    return NextResponse.json({ error: (error as Error).message || 'Failed to create project' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { name, isActive, isArchived, adminPassphrase } = body;

    if (!name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    // Admin authorization check
    const systemPassphrase = process.env.ADMIN_PASSPHRASE || 'admin123';
    if (adminPassphrase !== systemPassphrase) {
      return NextResponse.json({ error: 'Unauthorized: Invalid admin passphrase' }, { status: 401 });
    }

    const storage = getStorageProvider();
    const updated = await storage.updateProject(name, {
      ...(isActive !== undefined && { isActive }),
      ...(isArchived !== undefined && { isArchived })
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('API Error: PUT /api/projects failed:', error);
    return NextResponse.json({ error: (error as Error).message || 'Failed to update project' }, { status: 500 });
  }
}
