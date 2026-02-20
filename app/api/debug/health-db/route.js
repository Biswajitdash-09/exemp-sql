
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    await prisma.$connect();
    
    // Simple query to verify
    const count = await prisma.verifier.count();

    return NextResponse.json({
      status: 'ok',
      message: 'Database connection successful',
      verifierCount: count,
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (error) {
    console.error('Database health check failed:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
