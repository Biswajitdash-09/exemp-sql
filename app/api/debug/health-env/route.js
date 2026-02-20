
import { NextResponse } from 'next/server';

export async function GET() {
  const envVars = {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL ? 'DEFINED' : 'UNDEFINED',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ? 'DEFINED' : 'UNDEFINED',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'DEFINED' : 'UNDEFINED'
  };

  return NextResponse.json({
    status: 'ok',
    env: envVars,
    timestamp: new Date().toISOString()
  }, { status: 200 });
}
