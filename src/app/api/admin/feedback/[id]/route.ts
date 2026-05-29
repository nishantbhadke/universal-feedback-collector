import { NextResponse } from 'next/server';
import { getStorageProvider } from '@/lib/storage';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, adminPassphrase } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    // Admin authorization check
    const systemPassphrase = process.env.ADMIN_PASSPHRASE || 'admin123';
    if (adminPassphrase !== systemPassphrase) {
      return NextResponse.json({ error: 'Unauthorized: Invalid admin passphrase' }, { status: 401 });
    }

    const storage = getStorageProvider();
    const updated = await storage.updateFeedbackStatus(id, status);
    
    return NextResponse.json(updated);
  } catch (error) {
    console.error(`API Error: PUT /api/admin/feedback/[id] failed:`, error);
    return NextResponse.json({ error: (error as Error).message || 'Failed to update feedback details' }, { status: 500 });
  }
}
