import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2, '姓名至少需要2个字符'),
  studentId: z.string().length(10, '学号必须为10个字符'),
  password: z.string().min(6, '密码至少需要6个字符'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 验证输入数据
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { message: '输入数据无效', errors: result.error },
        { status: 400 }
      );
    }

    const { name, studentId, password } = body;

    // 检查邮箱是否已注册
    const existingUser = await prisma.user.findUnique({
      where: { studentId },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: '该邮箱已被注册' },
        { status: 400 }
      );
    }

    // 创建新用户
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        studentId,
        password: hashedPassword,
        role: 'STUDENT',
      },
    });

    // 移除密码后返回用户数据
    const { password: _p, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('注册错误:', error);
    return NextResponse.json(
      { message: '注册失败，请稍后重试' },
      { status: 500 }
    );
  }
}