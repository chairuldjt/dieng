import pool from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    await pool.query(
      'UPDATE user_tracking SET last_activity = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    return NextResponse.json({ status: 'ping-ok' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
