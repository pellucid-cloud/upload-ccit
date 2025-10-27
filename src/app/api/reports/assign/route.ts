import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'TEACHER') {
      return new NextResponse('未授权', { status: 401 });
    }

    const { reportId, taskId } = await req.json();
    if (!reportId) return new NextResponse('缺少 reportId', { status: 400 });

    if (taskId) {
      const task = await prisma.task.findUnique({ where: { id: taskId } });
      if (!task) return new NextResponse('目标任务不存在', { status: 400 });
    }

    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) return new NextResponse('报告不存在', { status: 404 });

    const updated = await prisma.report.update({
      where: { id: reportId },
      data: { taskId: taskId ?? null },
      include: {
        user: { select: { name: true, studentId: true } },
        task: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json({ success: true, report: updated });
  } catch (error) {
    console.error('修改报告任务失败:', error);
    return new NextResponse('修改失败', { status: 500 });
  }
}
