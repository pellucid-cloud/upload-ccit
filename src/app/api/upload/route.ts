import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse('未授权', { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new NextResponse('未找到文件', { status: 400 });
    }

    // 创建上传目录
    const uploadDir = path.join(process.cwd(), 'uploads');
    await writeFile(path.join(uploadDir, file.name), Buffer.from(await file.arrayBuffer()));

    // 保存文件记录到数据库
    const report = await prisma.report.create({
      data: {
        title: file.name,
        fileName: file.name,
        fileUrl: `/uploads/${file.name}`,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error('上传错误:', error);
    return new NextResponse('上传失败', { status: 500 });
  }
}
