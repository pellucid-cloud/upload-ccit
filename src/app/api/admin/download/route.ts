import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import archiver from 'archiver';
import { PassThrough, Readable } from 'stream';

export const runtime = 'nodejs';

function sanitizeFileName(name: string) {
  return name.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, ' ').trim();
}

function getExt(fileName: string) {
  const index = fileName.lastIndexOf('.');
  return index >= 0 ? fileName.slice(index) : '';
}

function buildMissingStudentIds(reports: Array<{ user: { studentId: string } }>) {
  const exc = '2311311123'
  let isContain = false;
  const collected = reports
    .map((report) => {
      const id = report.user.studentId;
      if (id == exc) {
        isContain = true;
        return 0
      } else {
        return Number.parseInt(id.slice(-2), 10)
      }
    })
    .filter((num) => num > 0 && Number.isFinite(num));

  const ignore = [8, 9, 16, 18, 31, 32, 35, 36, 38, 39];
  const submittedSet = new Set(collected);
  const ignoreSet = new Set(ignore);
  const missing: number[] = [];

  for (let i = 1; i <= 42; i += 1) {
    if (!submittedSet.has(i) && !ignoreSet.has(i)) {
      missing.push(i);
    }
  }
  if (!isContain)
    missing.push(+exc)
  return missing;
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'TEACHER') {
      return new Response('未授权', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('taskId');
    if (!taskId) {
      return new Response('缺少 taskId 参数', { status: 400 });
    }
    const prefix = searchParams.get('prefix');

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, title: true },
    });

    if (!task) {
      return new Response('任务不存在', { status: 404 });
    }

    const reports = await prisma.report.findMany({
      where: { taskId },
      select: {
        id: true,
        title: true,
        fileName: true,
        fileUrl: true,
        user: {
          select: {
            name: true,
            studentId: true,
          },
        },
      },
      orderBy: { submittedAt: 'asc' },
    });
    if (reports.length === 0) {
      return new Response('该任务下暂无报告可下载', { status: 404 });
    }

    const missingStudentIds = buildMissingStudentIds(reports);
    const missingText = missingStudentIds.join(',');

    const passThrough = new PassThrough();
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.on('warning', (err) => {
      console.warn('ZIP warning:', err);
    });

    archive.on('error', (err) => {
      console.error('ZIP error:', err);
      passThrough.destroy(err);
    });

    archive.pipe(passThrough);

    const job = (async () => {
      for (let index = 0; index < reports.length; index += 1) {
        const report = reports[index];
        try {
          const res = await fetch(report.fileUrl);
          if (!res.ok || !res.body) {
            console.warn('下载文件失败，已跳过:', report.id, res.status);
            continue;
          }

          const ext = getExt(report.fileName);
          const student = sanitizeFileName(report.user.studentId || 'unknown');
          const userName = sanitizeFileName(report.user.name || 'unknown');
          const entryName = `${prefix}-${task?.title || ''}-软件2531-${student.slice(-2)}-${userName}${ext}`;

          archive.append(Readable.fromWeb(res.body as any), { name: entryName });
        } catch (error) {
          console.warn('处理文件失败，已跳过:', report.id, error);
        }
      }

      archive.append(missingText, { name: '未交学号.txt' });

      await archive.finalize();
    })().catch((err) => {
      console.error('生成压缩包失败:', err);
      passThrough.destroy(err);
    });

    void job;

    const zipName = `${sanitizeFileName(task.title)}.zip`;
    const stream = Readable.toWeb(passThrough) as ReadableStream;
    return new Response(stream, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(zipName)}`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('按任务下载失败:', error);
    return new Response('下载失败', { status: 500 });
  }
}
