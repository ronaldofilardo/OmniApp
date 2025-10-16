import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Omni Saúde API is running',
    version: '1.0.0',
    endpoints: ['/health', '/status', '/timeline']
  });
}