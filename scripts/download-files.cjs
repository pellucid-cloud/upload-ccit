const fs = require('fs').promises;
const { createWriteStream } = require('fs');
const path = require('path');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
// 初始化Prisma客户端
const prisma = new PrismaClient();

// 配置下载参数
const downloadConfig = {
  downloadDir: './download', // 下载文件保存的目录
  maxConcurrentDownloads: 5,  // 最大并发下载数
  filePrefix: '实验5'
};

// 确保下载目录存在
async function ensureDownloadDir () {
  try {
    await fs.mkdir(downloadConfig.downloadDir, { recursive: true });
  } catch (error) {
    console.error('创建下载目录失败:', error);
    throw error;
  }
}

// 从URL下载单个文件
async function downloadFile (url, filename) {
  const filePath = path.join(downloadConfig.downloadDir, filename);
  const writer = createWriteStream(filePath);

  try {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
      timeout: 300000000,
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (error) {
    console.error(`下载文件失败: ${url}`, error.message);
    // 清理可能已部分下载的文件
    try {
      await fs.unlink(filePath);
    } catch (cleanupError) {
      console.error('清理部分下载文件失败:', cleanupError);
    }
    throw error;
  }
}

// 批量下载文件
async function downloadFiles (files) {
  const downloadPromises = [];
  const batchSize = downloadConfig.maxConcurrentDownloads;

  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    const batchPromises = batch.map(async (file) => {
      try {
        const url = file.fileUrl;
        const filename = file.fileName;
        console.log(`开始下载: ${filename}`);
        await downloadFile(url, filename);
        console.log(`下载完成: ${filename}`);
        return { filename, status: 'success' };
      } catch (error) {
        return {
          filename: filename,
          status: 'failed',
          error: error.message
        };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    downloadPromises.push(...batchResults);

    // 批次之间添加延迟，避免服务器压力过大
    if (i + batchSize < files.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return downloadPromises;
}

// 主函数：获取数据并下载文件
async function main () {
  try {
    // 确保下载目录存在
    await ensureDownloadDir();

    const records = await prisma.report.findMany({
      select: {
        userId: true,
        fileUrl: true,
        fileName: true,
        user: {
          select: {
            name: true,
            studentId: true
          }
        }
      },
    });

    // 收集所有文件URL
    const files = records.map(record => {
      return {
        fileUrl: record.fileUrl + '?download=1',
        fileName: `${downloadConfig.filePrefix}-${record.user.studentId}-${record.user.name}.doc`,
      };
    });

    console.log(`共找到 ${files.length} 个文件需要下载`);

    // 开始下载文件
    const results = await downloadFiles(files);

    // 输出下载结果统计
    const successCount = results.filter(r => r.status === 'success').length;
    const failCount = results.filter(r => r.status === 'failed').length;
    console.log(`下载完成: 成功 ${successCount} 个, 失败 ${failCount} 个`);

    // 输出失败的文件信息
    if (failCount > 0) {
      console.log('失败的文件:');
      results.filter(r => r.status === 'failed').forEach(result => {
        console.log(`- ${result.filename}: ${result.error}`);
      });
    }

    if (successCount == files.length) {
      const result = await prisma.report.deleteMany({});
      console.log(`成功清空report表，共删除 ${result.count} 条记录`);
    }

  } catch (error) {
    console.error('发生错误:', error);
  } finally {
    // 关闭Prisma连接
    await prisma.$disconnect();
  }
}
async function clearReportTable () {
  try {
    // 不指定where条件，会删除表中所有记录
    const result = await prisma.report.deleteMany({});

    console.log(`成功清空report表，共删除 ${result.count} 条记录`);
    return result;
  } catch (error) {
    console.error('清空report表失败:', error);
    throw error; // 抛出错误供上层处理
  } finally {
    // 关闭Prisma客户端连接
    await prisma.$disconnect();
  }
}

// 执行清空操作
// clearReportTable();

// 执行主函数
main().catch(console.error);


