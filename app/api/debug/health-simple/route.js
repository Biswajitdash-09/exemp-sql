
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Health check passed',
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  }, { status: 200 });
}
