'use client';

import { useState, useEffect } from 'react';
import { Upload, message, Card, Typography, Button, Table, Popconfirm, Spin, Flex } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { useRouter } from 'next/navigation';

const { Dragger } = Upload;
const { Title } = Typography;

interface Report {
  id: string;
  title: string;
  fileName: string;
  fileUrl: string;
  submittedAt: string;
  user: {
    name: string;
    studentId: string;
  };
}

export default function UploadPage() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set());

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
          throw new Error(await response.text() || '文件上传失败');
        }

        onSuccess?.(await response.json());
        message.success('文件上传成功！');
        router.refresh();
      } catch (error) {
        onError?.(error as Error);
        message.error((error as Error).message || '文件上传失败');
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

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/reports');
        if (!res.ok) throw new Error('获取报告失败');
        const data = await res.json();
        setReports(data.reports);
      } catch (e) {
        message.error('获取报告失败');
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [uploading]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch('/api/reports/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId: id })
      });
      if (!res.ok) throw new Error('删除失败');
      message.success('删除成功');
      setReports(reports.filter(r => r.id !== id));
    } catch (e) {
      message.error('删除失败');
    }
  };

  const columns = [
    { title: '文件名', dataIndex: 'fileName', key: 'fileName', render: (text: string, record: Report) => <a href={record.fileUrl} target="_blank" rel="noopener noreferrer">{text}</a> },
    { title: '提交时间', dataIndex: 'submittedAt', key: 'submittedAt' },
    { title: '姓名', dataIndex: ['user', 'name'], key: 'name' },
    { title: '学号', dataIndex: ['user', 'studentId'], key: 'studentId' },
    {
      title: '操作',
      key: 'action',
      render: (_: Report, record: Report) => {
        return (
        <Flex gap="small">
          <Button
            size="small"
            type='link'
            href={record.fileUrl}
          >
            下载
          </Button>
          <Popconfirm title="确定删除该报告吗？" onConfirm={() => handleDelete(record.id)} okText="删除" cancelText="取消">
            <Button danger size="small">删除</Button>
          </Popconfirm>
        </Flex>
      )
      }
    }
  ];

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
      <Card className="mt-8">
        <Flex justify="space-between" align="center" className="mb-4">
          <Title level={4} style={{ margin: 0 }}>已上传报告</Title>
        </Flex>
        {loading ? (
          <Spin />
        ) : (
          <Table
            rowKey="id"
            columns={columns}
            dataSource={reports}
            pagination={false}
          />
        )}
      </Card>
    </div>
  );
}
