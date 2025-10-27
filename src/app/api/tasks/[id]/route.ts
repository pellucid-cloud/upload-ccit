import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Params } from 'next/dist/server/request/params';

export async function DELETE(req: NextRequest, { params }: { params: Params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'TEACHER') {
      return new NextResponse('未授权', { status: 401 });
    }

    const taskId = params.id as string;
    if (!taskId) return new NextResponse('缺少任务ID', { status: 400 });

    const count = await prisma.report.count({ where: { taskId } });
    if (count > 0) {
      return new NextResponse('该任务下存在提交，无法删除', { status: 400 });
    }

    await prisma.task.delete({ where: { id: taskId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除任务失败:', error);
    return new NextResponse('删除任务失败', { status: 500 });
  }
}
