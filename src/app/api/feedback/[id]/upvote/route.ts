import { NextResponse } from 'next/server';
import { getStorageProvider } from '@/lib/storage';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { voterToken } = body;

    if (!voterToken) {
      return NextResponse.json({ error: 'Voter token is required' }, { status: 400 });
    }

    const storage = getStorageProvider();
    const updated = await storage.upvoteFeedback(id, voterToken);
    return NextResponse.json(updated);
  } catch (error) {
    console.error(`API Error: POST /api/feedback/[id]/upvote failed:`, error);
    return NextResponse.json({ error: (error as Error).message || 'Failed to register upvote' }, { status: 500 });
  }
}
