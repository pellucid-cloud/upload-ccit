import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'TEACHER') {
      return new NextResponse('未授权', { status: 401 });
    }

    const reports = await prisma.report.findMany({
      include: {
        user: {
          select: {
            name: true,
            studentId: true,
          },
        },
      },
      orderBy: {
        submittedAt: 'desc',
      },
    });

    return NextResponse.json({ reports });
  } catch (error) {
    console.error('获取报告列表失败:', error);
    return new NextResponse('获取报告列表失败', { status: 500 });
  }
}
