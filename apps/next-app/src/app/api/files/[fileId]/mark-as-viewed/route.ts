import { NextRequest, NextResponse } from 'next/server';
import { markFileAsViewed } from '@/services/filesService';
import logger from '@/logger';
import { prisma } from '@/lib/prisma';

// POST /api/files/:fileId/mark-as-viewed - Marcar arquivo como visto
export async function POST(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  const { fileId } = params;
  try {
    const result = await markFileAsViewed(prisma, fileId);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 200 });
  }
}