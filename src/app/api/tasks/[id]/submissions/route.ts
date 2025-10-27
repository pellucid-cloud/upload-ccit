import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Params } from 'next/dist/server/request/params';

export async function GET(req: NextRequest, { params }: { params: Params }) {
  try {
    const taskId = params.id as string;
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse('未授权', { status: 401 });

    const where: any = { taskId };
    if (session.user.role !== 'TEACHER') {
      where.userId = session.user.id;
    }

    const reports = await prisma.report.findMany({
      where,
      include: {
        user: {
          select: { name: true, studentId: true },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    return NextResponse.json({ reports });
  } catch (error) {
    console.error('获取任务提交失败:', error);
    return new NextResponse('获取任务提交失败', { status: 500 });
  }
}
