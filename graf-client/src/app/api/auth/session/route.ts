import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE, SESSION_MAX_AGE_SECONDS } from '@/lib/auth-gate';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface SessionBody {
  idToken?: string;
}

export async function POST(req: NextRequest) {
  let body: SessionBody = {};
  try {
    body = (await req.json()) as SessionBody;
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  const idToken = body.idToken;
  if (!idToken || typeof idToken !== 'string' || idToken.split('.').length !== 3) {
    return NextResponse.json({ idToken: 'idToken requerido' }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: AUTH_COOKIE,
    value: idToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: AUTH_COOKIE,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0
  });
  return response;
}
