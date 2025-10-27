"use client";

import { useEffect, useState } from "react";
import { Button, Input, List, message, Popconfirm } from "antd";

interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string | null;
  expectedCount?: number | null;
  allowedExtensions?: string[];
  _count?: { reports: number };
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tasks");
      if (!res.ok) throw new Error("获取任务失败");
      const d = await res.json();
      setTasks(d.tasks || []);
    } catch (_e) {
      message.error("获取任务失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  const createTask = async () => {
    if (!newTitle) return message.error("请填写任务标题");
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          description: newDesc,
          expectedCount: Number((document.getElementById('expectedCount') as HTMLInputElement)?.value) || undefined,
          allowedExtensions: (document.getElementById('allowedExt') as HTMLInputElement)?.value.split(',').map(s => s.trim()).filter(Boolean)
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const d = await res.json();
      setTasks(prev => [d.task, ...prev]);
      setNewTitle(''); setNewDesc('');
      message.success('创建成功');
    } catch (_e) {
      message.error('创建失败');
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      setTasks(prev => prev.filter(t => t.id !== id));
      message.success('删除成功');
    } catch (e: any) {
      message.error(e?.message || '删除失败（可能存在提交）');
    }
  };

  return (
    <div className="h-full">
      <div className="bg-white rounded-lg shadow p-4 mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">任务管理</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-3">
          <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="任务标题" />
          <Input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="描述（可选）" />
          <Input id="expectedCount" placeholder="期望提交数量（可选）" style={{ width: 160 }} />
          <Input id="allowedExt" placeholder="允许后缀, 用逗号分隔 e.g. pdf,docx" style={{ width: 320 }} />
          <Button type="primary" onClick={createTask}>创建</Button>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <List loading={loading} dataSource={tasks} renderItem={t => (
          <List.Item actions={[
            <Popconfirm key="del" title="确认删除该任务？(若存在提交将无法删除)" onConfirm={() => deleteTask(t.id)} okText="删除" cancelText="取消">
              <Button danger size="small">删除</Button>
            </Popconfirm>
          ]}>

            <List.Item.Meta
              title={<div className="flex items-center gap-3"><span>{t.title}</span><span className="text-sm text-gray-500">{t._count?.reports ?? 0} 提交</span></div>}
              description={<div>
                <div>{t.description}</div>
                <div className="text-sm text-gray-500">期望数量: {t.expectedCount ?? '未设置'} • 允许后缀: {(t.allowedExtensions || []).join(', ') || '无限制'}</div>
              </div>}
            />
          </List.Item>
        )} />
      </div>

    </div>
  );
}
