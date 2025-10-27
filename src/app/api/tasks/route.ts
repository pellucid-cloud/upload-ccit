import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { reports: true } } },
    });
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('获取任务列表失败:', error);
    return new NextResponse('获取任务列表失败', { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'TEACHER') {
      return new NextResponse('未授权', { status: 401 });
    }

    const { title, description, dueDate, expectedCount, allowedExtensions } = await req.json();
    if (!title) return new NextResponse('缺少标题', { status: 400 });

    const data: any = {
      title,
      description,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      creatorId: session.user.id,
    };
    if (expectedCount !== undefined) data.expectedCount = expectedCount;
    data.allowedExtensions = Array.isArray(allowedExtensions) ? allowedExtensions : [];

    const task = await prisma.task.create({ data: data as any });

    return NextResponse.json({ task });
  } catch (error) {
    console.error('创建任务失败:', error);
    return new NextResponse('创建任务失败', { status: 500 });
  }
}
