import { NextResponse } from 'next/server';
import { getStorageProvider } from '@/lib/storage';

export async function GET() {
  try {
    const storage = getStorageProvider();
    const categories = await storage.getCategories();
    return NextResponse.json(categories);
  } catch (error) {
    console.error('API Error: GET /api/categories failed:', error);
    return NextResponse.json({ error: 'Failed to retrieve categories list' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, adminPassphrase } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    // Admin authorization check
    const systemPassphrase = process.env.ADMIN_PASSPHRASE || 'admin123';
    if (adminPassphrase !== systemPassphrase) {
      return NextResponse.json({ error: 'Unauthorized: Invalid admin passphrase' }, { status: 401 });
    }

    const storage = getStorageProvider();
    const newCategory = await storage.createCategory(name.trim());
    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error('API Error: POST /api/categories failed:', error);
    return NextResponse.json({ error: (error as Error).message || 'Failed to create category' }, { status: 500 });
  }
}
