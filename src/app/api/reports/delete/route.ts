import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { del } from '@vercel/blob';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('未授权', { status: 401 });
    }
    const { reportId } = await req.json();
    if (!reportId) {
      return new NextResponse('缺少报告ID', { status: 400 });
    }
    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) {
      return new NextResponse('报告不存在', { status: 404 });
    }
    // 只有本人或老师可以删除
    if (session.user.role !== 'TEACHER' && report.userId !== session.user.id) {
      return new NextResponse('无权限删除', { status: 403 });
    }
    // 删除 blob 文件
    await del(report.fileUrl);
    // 删除数据库记录
    await prisma.report.delete({ where: { id: reportId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除报告失败:', error);
    return new NextResponse('删除失败', { status: 500 });
  }
}
