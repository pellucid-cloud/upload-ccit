const fs = require('fs').promises;
const { createWriteStream } = require('fs');
const path = require('path');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
// 初始化Prisma客户端
const prisma = new PrismaClient();
const { list } = require('@vercel/blob');


// 配置下载参数
const downloadConfig = {
  downloadDir: './download', // 下载文件保存的目录
  maxConcurrentDownloads: 5,  // 最大并发下载数
  taskName: '实训压缩包',
  filePrefix: ''
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
async function getAllReport (title) {
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
    where: {
      task: {
        title: downloadConfig.taskName
      }
    }
  });

  // 收集所有文件URL
  const files = records.map(record => {
    return {
      fileUrl: record.fileUrl + '?download=1',
      fileName: `软件2531-${record.user.studentId}-${record.user.name}.zip`
    };
  });

  console.log(`共找到 ${files.length} 个文件需要下载`);
  return files;
}
// 主函数：获取数据并下载文件
async function main () {
  try {
    // 确保下载目录存在
    await ensureDownloadDir();

    const files = await getAllReport();

    // for (let file of files) {
    //   console.log(file.fileName);

    // }
    // return;

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
      const result = await deleteReportByTask();
      console.log(`成功清空report表，共删除 ${result.count} 条记录`);
    }

  } catch (error) {
    console.error('发生错误:', error);
  } finally {
    // 关闭Prisma连接
    await prisma.$disconnect();
  }
}
async function deleteReportByTask () {
  try {
    // 不指定where条件，会删除表中所有记录
    const result = await prisma.report.deleteMany({
      where: {
        task: {
          title: downloadConfig.taskName
        }
      }
    });

    console.log(`成功删除${downloadConfig.taskName}任务下所有记录，共删除 ${result.count} 条记录`);
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
async function downloadCurrentAllFiles () {
  let files = await list({
    token: "vercel_blob_rw_LUlQQSnQ5YKv8Gs1_uTw8SnOEAIJBAgxWcaZ1d358GN03rS",
  })
  files = files.blobs;
  files = files.map((file) => {
    return {
      fileUrl: file.downloadUrl,
      fileName: file.pathname
    }
  })
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
}


// downloadCurrentAllFiles()

// 批量修改后缀
async function batchRenameFiles (dirPath, oldExt, newExt) {
  // 结果收集器：成功重命名的文件、失败的文件及原因
  const result = {
    success: [],
    failed: []
  };

  try {
    // 1. 解析并校验目录路径（处理相对路径 -> 绝对路径）
    const absoluteDir = path.resolve(dirPath);
    await fs.access(absoluteDir, fs.constants.F_OK | fs.constants.R_OK); // 校验目录是否存在且可读

    // 2. 读取目录下所有文件/子目录（仅处理文件，跳过子目录）
    const files = await fs.readdir(absoluteDir, { withFileTypes: true });
    const fileEntries = files.filter(entry => entry.isFile()); // 过滤出文件（排除文件夹）

    if (fileEntries.length === 0) {
      console.log(`⚠️  目录 ${absoluteDir} 下无文件可处理`);
      return result;
    }

    // 3. 遍历文件，批量重命名（异步并发执行，效率更高）
    await Promise.all(
      fileEntries.map(async (fileEntry) => {
        const oldFileName = fileEntry.name;
        const oldFilePath = path.join(absoluteDir, oldFileName);

        // 3.1 校验文件是否匹配原后缀（oldExt 为空则匹配无后缀文件）
        // const fileExt = path.extname(oldFileName);
        // if (fileExt !== oldExt) return; // 后缀不匹配，跳过
        if (!oldFileName.startsWith('实验8'))
          return;

        // 3.2 构造新文件名（保留文件名主体，替换后缀）
        const fileNameWithoutExt = path.basename(oldFileName, oldExt); // 去除原后缀的文件名
        const newFileName = "实验8-25113111" + fileNameWithoutExt.slice(-2) + '-' + fileNameWithoutExt.slice(4, -3) + '.doc'
        const newFilePath = path.join(absoluteDir, newFileName);

        // 3.3 避免覆盖已存在的文件
        if (newFileName === oldFileName) {
          result.failed.push({
            file: oldFileName,
            error: '新后缀与原后缀一致，无需修改'
          });
          return;
        }

        try {
          // 3.4 执行重命名（原子操作，fs.rename 会覆盖同名文件，此处加存在性校验）
          await fs.access(newFilePath, fs.constants.F_OK).catch(() => null); // 检查新文件是否存在
          await fs.rename(oldFilePath, newFilePath);
          result.success.push(oldFileName);
          console.log(`✅ 成功：${oldFileName} -> ${newFileName}`);
        } catch (renameErr) {
          result.failed.push({
            file: oldFileName,
            error: renameErr.message
          });
          console.error(`❌ 失败：${oldFileName} - ${renameErr.message}`);
        }
      })
    );

  } catch (initErr) {
    // 目录访问失败（如路径不存在、无权限）
    result.failed.push({
      file: dirPath,
      error: `目录处理失败：${initErr.message}`
    });
    console.error(`❌ 目录错误：${initErr.message}`);
  }

  return result;
}


// batchRenameFiles(
//   './download',
//   '.doc',
//   ''
// )