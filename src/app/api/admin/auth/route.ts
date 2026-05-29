import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { adminPassphrase } = body;

    const systemPassphrase = process.env.ADMIN_PASSPHRASE || 'admin123';

    if (adminPassphrase === systemPassphrase) {
      return NextResponse.json({ authenticated: true, token: adminPassphrase });
    } else {
      return NextResponse.json({ authenticated: false, error: 'Invalid admin passphrase' }, { status: 401 });
    }
  } catch (error) {
    console.error('API Error: POST /api/admin/auth failed:', error);
    return NextResponse.json({ error: 'Authentication process failed' }, { status: 500 });
  }
}
