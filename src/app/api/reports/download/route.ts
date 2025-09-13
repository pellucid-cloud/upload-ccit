import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createReadStream } from 'fs';
import { join } from 'path';
import archiver from 'archiver';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'TEACHER') {
      return new NextResponse('未授权', { status: 401 });
    }

    // 获取要下载的文件ID列表
    const { reportIds } = await req.json();

    if (!reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
      return new NextResponse('请选择要下载的文件', { status: 400 });
    }

    // 获取报告信息
    const reports = await prisma.report.findMany({
      where: {
        id: {
          in: reportIds
        }
      },
      include: {
        user: {
          select: {
            name: true
          }
        }
      }
    });

    // 创建一个 ZIP 文件流
    const archive = archiver('zip', {
      zlib: { level: 9 } // 最大压缩级别
    });

    // 设置响应头
    const headers = new Headers({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename=reports-${new Date().toISOString().split('T')[0]}.zip`
    });

    // 创建响应流
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // 错误处理
    archive.on('error', (err) => {
      console.error('打包错误:', err);
      writer.abort(err);
    });

    // 将压缩数据写入响应流
    archive.on('data', chunk => {
      writer.write(chunk);
    });

    // 完成时关闭流
    archive.on('end', () => {
      writer.close();
    });

    // 添加文件到压缩包
    for (const report of reports) {
      const filePath = join(process.cwd(), 'uploads', report.fileName);
      try {
        const fileStream = createReadStream(filePath);
        // 使用学生姓名和原始文件名命名
        const newFileName = `${report.user.name}-${report.fileName}`;
        archive.append(fileStream, { name: newFileName });
      } catch (error) {
        console.error(`添加文件失败: ${report.fileName}`, error);
      }
    }

    // 完成压缩
    archive.finalize();

    // 返回流式响应
    return new Response(stream.readable, { headers });
  } catch (error) {
    console.error('下载报告错误:', error);
    return new NextResponse('下载失败', { status: 500 });
  }
}
