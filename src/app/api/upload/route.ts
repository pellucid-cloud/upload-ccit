import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { put } from '@vercel/blob';

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

    // 去重
    const existingReport = await prisma.report.findFirst({
      where: {
        userId: session.user.id,
      },
    });

    if (existingReport) {
      return new NextResponse('文件已存在，请先删除后再进行提交！', { status: 400 });
    }

    // 创建上传目录
    const blob = await put(file.name, file, {
      access: 'public'
    })

    // 保存文件记录到数据库
    const report = await prisma.report.create({
      data: {
        title: file.name,
        fileName: file.name,
        fileUrl: blob.url,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error('上传错误:', error);
    return new NextResponse('上传失败', { status: 500 });
  }
}
