import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse('未授权', { status: 401 });
    }
    const url = new URL(req.url);
    const name = url.searchParams.get('name');
    const taskId = url.searchParams.get('taskId');
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');

    const baseWhere: any = {};
    if (session.user.role !== 'TEACHER') baseWhere.userId = session.user.id;
    if (taskId) baseWhere.taskId = taskId;
    if (from || to) baseWhere.submittedAt = {};
    if (from) baseWhere.submittedAt.gte = new Date(from);
    if (to) baseWhere.submittedAt.lte = new Date(to);

    const where: any = baseWhere;
    if (name) {
      where.user = { name: { contains: name, mode: 'insensitive' } };
    }

    const reports = await prisma.report.findMany({
      where,
      include: {
        user: {
          select: { name: true, studentId: true },
        },
        task: { select: { id: true, title: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });

    return NextResponse.json({ reports });
  } catch (error) {
    console.error('获取报告列表失败:', error);
    return new NextResponse('获取报告列表失败', { status: 500 });
  }
}
