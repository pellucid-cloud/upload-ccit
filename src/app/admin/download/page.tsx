'use client';

import { useEffect, useState } from 'react';
import { Button, Input, Select, message } from 'antd';

interface Task {
  id: string;
  title: string;
  enable: boolean;
}

export default function AdminDownloadPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [prefix, setPrefix] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const loadTasks = async () => {
      setFetching(true);
      try {
        const res = await fetch('/api/tasks?enable=2');
        if (!res.ok) throw new Error('获取任务失败');
        const data = await res.json();
        setTasks(data.tasks || []);
      } catch {
        message.error('获取任务列表失败');
      } finally {
        setFetching(false);
      }
    };

    loadTasks();
  }, []);

  const downloadByTask = async () => {
    if (!taskId) {
      message.warning('请先选择任务');
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({ taskId });
      if (prefix?.trim()) params.set('prefix', prefix.trim());
      const url = `/api/admin/download?${params.toString()}`;
      // 直接打开下载地址，浏览器会按附件流下载。
      window.open(url, '_blank');
      message.success('已开始下载，请稍候');
    } catch {
      message.error('下载失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full">
      <div className="bg-white rounded-lg shadow p-4 mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">按任务下载</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col gap-4 max-w-2xl">
          <div className="text-gray-600">选择一个任务，下载该任务下所有报告文件的 ZIP 压缩包。</div>
          <Select
            loading={fetching}
            allowClear
            placeholder="选择任务"
            value={taskId ?? undefined}
            onChange={(value) => setTaskId(value ?? null)}
            options={tasks.map((task) => ({
              label: `${task.title}${task.enable ? '' : '（已禁用）'}`,
              value: task.id,
            }))}
          />
          <Input
            placeholder="输入文件名前缀（可选）"
            value={prefix ?? ''}
            onChange={(e) => setPrefix(e.target.value || null)}
          />

          <div>
            <Button type="primary" onClick={downloadByTask} loading={loading} disabled={!taskId}>
              下载当前任务压缩包
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
