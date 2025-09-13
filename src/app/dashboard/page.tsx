'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setUploading(true);
    const file = acceptedFiles[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('上传失败');
      }

      router.refresh();
    } catch (error) {
      console.error('上传错误:', error);
    } finally {
      setUploading(false);
    }
  }, [router]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">实验报告提交</h1>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <p>正在上传...</p>
        ) : isDragActive ? (
          <p>拖放文件到这里 ...</p>
        ) : (
          <p>点击或拖放文件到这里上传 (支持 PDF, DOC, DOCX)</p>
        )}
      </div>
    </div>
  );
}
