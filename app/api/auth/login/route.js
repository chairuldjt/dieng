import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    const [users] = await pool.query('SELECT * FROM admin_users WHERE username = ?', [username]);

    if (users.length === 0) {
      return NextResponse.json({ message: 'Username atau password salah' }, { status: 401 });
    }

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return NextResponse.json({ message: 'Username atau password salah' }, { status: 401 });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || 'rahasia_dieng_premium_2024',
      { expiresIn: '1h' }
    );

    return NextResponse.json({ token });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
