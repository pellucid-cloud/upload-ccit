'use client';

import { useState } from 'react';
import { Upload, message, Card, Typography } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { useRouter } from 'next/navigation';

const { Dragger } = Upload;
const { Title } = Typography;

export default function UploadPage() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);

  const props: UploadProps = {
    name: 'file',
    multiple: false,
    customRequest: async (options) => {
      const { file, onSuccess, onError } = options;
      setUploading(true);

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('上传失败');
        }

        onSuccess?.(await response.json());
        message.success('文件上传成功！');
        router.refresh();
      } catch (error) {
        onError?.(error as Error);
        message.error('上传失败，请重试');
      } finally {
        setUploading(false);
      }
    },
    accept: '.pdf,.doc,.docx',
    beforeUpload: (file) => {
      const isValidType = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ].includes(file.type);
      
      if (!isValidType) {
        message.error('只能上传 PDF/DOC/DOCX 格式的文件！');
        return false;
      }
      
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('文件大小不能超过 10MB！');
        return false;
      }
      
      return true;
    },
    maxCount: 1,
    fileList: []
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <Title level={2} className="text-center mb-8">
          实验报告提交
        </Title>
        <Dragger {...props} disabled={uploading}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">
            {uploading ? '正在上传...' : '点击或拖拽文件到此区域上传'}
          </p>
          <p className="ant-upload-hint">
            支持 PDF、DOC、DOCX 格式文件，大小不超过 10MB
          </p>
        </Dragger>
      </Card>
    </div>
  );
}
