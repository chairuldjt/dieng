import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

function getClientIp(headersList) {
  const candidates = [
    headersList.get('cf-connecting-ip'),
    headersList.get('x-real-ip'),
    headersList.get('x-client-ip'),
    headersList.get('true-client-ip'),
    headersList.get('x-forwarded-for'),
    headersList.get('x-vercel-forwarded-for'),
    headersList.get('forwarded')
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (!candidate) continue;

    if (candidate.includes('for=')) {
      const match = candidate.match(/for="?(\[?[A-Fa-f0-9:.]+\]?|[^;,"]+)/i);
      if (match?.[1]) {
        return match[1].replace(/^\[|\]$/g, '').trim();
      }
    }

    const ip = candidate.split(',')[0].trim().replace(/^::ffff:/, '');
    if (ip) return ip;
  }

  return '127.0.0.1';
}

export async function POST(request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    const headersList = await headers();
    const ip = getClientIp(headersList);

    await pool.query(
      'UPDATE user_tracking SET ip_address = ?, last_activity = CURRENT_TIMESTAMP WHERE id = ?',
      [ip, id]
    );

    return NextResponse.json({ status: 'ping-ok' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
