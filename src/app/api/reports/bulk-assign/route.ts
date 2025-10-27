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

    const { reportIds, taskId } = await req.json();
    if (!Array.isArray(reportIds) || reportIds.length === 0) {
      return new NextResponse('缺少 reportIds', { status: 400 });
    }

    if (taskId) {
      const task = await prisma.task.findUnique({ where: { id: taskId } });
      if (!task) return new NextResponse('目标任务不存在', { status: 400 });
    }

    await prisma.report.updateMany({
      where: { id: { in: reportIds } },
      data: { taskId: taskId ?? null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('批量修改任务失败:', error);
    return new NextResponse('修改失败', { status: 500 });
  }
}
