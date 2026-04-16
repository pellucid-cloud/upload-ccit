import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'TEACHER') {
      return new NextResponse('未授权', { status: 401 });
    }

    const userId = (await params).id;
    if (!userId) return new NextResponse('缺少用户ID', { status: 400 });

    const targetUser = await prisma.user.findUnique({
      where: { id: userId, role: 'STUDENT' },
    });

    if (!targetUser) {
      return new NextResponse('用户不存在', { status: 404 });
    }

    // 默认密码为学号
    const hashedPassword = await bcrypt.hash(targetUser.studentId, 10);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
      select: { id: true, name: true, studentId: true },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('重置密码失败:', error);
    return new NextResponse('重置密码失败', { status: 500 });
  }
}
