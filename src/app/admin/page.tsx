'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Input, Modal, message, Select, DatePicker } from 'antd';
import TasksPage from './tasks/page';

interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string | null;
}

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
  task?: { id: string; title: string } | null;
}

export default function AdminPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [view, setView] = useState<'list'|'tasks'>('list');
  const [selectedReportsBulk, setSelectedReportsBulk] = useState<Set<string>>(new Set());
  const [filterName, setFilterName] = useState('');
  const [filterTask, setFilterTask] = useState<string | null>(null);
  const [filterRange, setFilterRange] = useState<[string|null, string|null]>([null, null]);
  const [showSubmissionsFor, setShowSubmissionsFor] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Report[]>([]);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => {
    fetchReports();
    // fetch tasks
    (async () => {
      try {
        const res = await fetch('/api/tasks');
        if (!res.ok) return;
        const d = await res.json();
        setTasks(d.tasks || []);
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const fetchReports = async (opts?: { name?: string; taskId?: string | null; from?: string | null; to?: string | null }) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (opts?.name) params.set('name', opts.name);
      if (opts?.taskId) params.set('taskId', opts.taskId);
      if (opts?.from) params.set('from', opts.from);
      if (opts?.to) params.set('to', opts.to);
      const url = '/api/reports' + (params.toString() ? `?${params.toString()}` : '');
      const response = await fetch(url);
      if (!response.ok) throw new Error('获取报告列表失败');
      const data = await response.json();
      setReports(data.reports || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  const createTask = async () => {
    if (!newTitle) return;
    setCreating(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, description: newDesc }),
      });
      if (!res.ok) throw new Error('创建失败');
      const d = await res.json();
      setTasks(prev => [d.task, ...prev]);
      setNewTitle('');
      setNewDesc('');
    } catch (e) {
      // ignore
    } finally {
      setCreating(false);
    }
  };

  const applyFilters = () => {
    const [from, to] = filterRange as any;
    fetchReports({ name: filterName || undefined, taskId: filterTask || undefined, from: from || undefined, to: to || undefined });
  };

  const toggleSelectReport = (id: string, checked: boolean) => {
    const s = new Set(selectedReportsBulk);
    if (checked) s.add(id); else s.delete(id);
    setSelectedReportsBulk(s);
  };

  const selectAllVisible = (checked: boolean) => {
    if (checked) setSelectedReportsBulk(new Set(reports.map(r => r.id))); else setSelectedReportsBulk(new Set());
  };

  const bulkAssign = async (targetTaskId: string | null) => {
    if (selectedReportsBulk.size === 0) return message.error('请选择要修改的报告');
    try {
      const res = await fetch('/api/reports/bulk-assign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reportIds: Array.from(selectedReportsBulk), taskId: targetTaskId }) });
      if (!res.ok) throw new Error(await res.text());
      message.success('批量修改成功');
      // refresh
      applyFilters();
      setSelectedReportsBulk(new Set());
    } catch (e) {
      message.error('批量修改失败');
    }
  };

  const viewSubmissions = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/submissions`);
      if (!res.ok) throw new Error('获取提交失败');
      const d = await res.json();
      setSubmissions(d.reports || []);
      setShowSubmissionsFor(taskId);
    } catch (e) {
      // ignore
    }
  };

  if (loading) {
    return <div className="text-center py-8">加载中...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  const assignTaskForReport = async (reportId: string, taskId: string | null) => {
    try {
      const res = await fetch('/api/reports/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, taskId }),
      });
      if (!res.ok) throw new Error(await res.text());
      const d = await res.json();
      setReports(prev => prev.map(r => r.id === reportId ? d.report : r));
      message.success('修改成功');
    } catch (e) {
      message.error('修改失败');
    }
  };
  return (
    <div className="flex gap-6 w-full h-full pb-4">
      <aside className="w-56 bg-white rounded shadow p-4 h-full">
        <div className="mb-4 text-lg font-semibold">管理面板</div>
        <div className="flex flex-col gap-2">
          <Button type={view === 'list' ? 'primary' : 'default'} onClick={() => setView('list')}>报告列表</Button>
          <Button type={view === 'tasks' ? 'primary' : 'default'} onClick={() => setView('tasks')}>任务管理</Button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col">
        {
          view === 'tasks' ? '' : 
            <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">实验报告管理</h1>
            <div className="flex gap-2">
              <Input placeholder="按姓名查询" value={filterName} onChange={(e) => setFilterName(e.target.value)} style={{ width: 200 }} />
              <Select allowClear placeholder="按任务过滤" style={{ width: 220 }} value={filterTask ?? undefined} onChange={(v) => setFilterTask(v ?? null)} options={[{ label: '未分配', value: '' }, ...tasks.map(t => ({ label: t.title, value: t.id }))]} />
              <DatePicker.RangePicker onChange={(dates:any) => {
                const toIso = (d: any) => {
                  if (!d) return null;
                  if (typeof d.toISOString === 'function') return d.toISOString();
                  if (typeof d.toDate === 'function') return d.toDate().toISOString();
                  try { return new Date(d).toISOString(); } catch { return null; }
                };
                setFilterRange([toIso(dates?.[0]), toIso(dates?.[1])]);
              }} />
              <Button onClick={applyFilters}>查询</Button>
            </div>
          </div>
        </div>
        }
        

        {view === 'tasks' ? (
          <TasksPage />
        ) : (
          <div className="bg-white rounded-lg shadow p-4 flex-1">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <Button onClick={() => selectAllVisible(true)}>全选</Button>
                <Button onClick={() => selectAllVisible(false)} className="ml-2">取消全选</Button>
              </div>
              <div className="flex items-center gap-2">
                <Select allowClear placeholder="批量修改至任务" style={{ width: 240 }} onChange={(v) => bulkAssign(v ?? null)} options={[{ label: '未分配', value: '' }, ...tasks.map(t => ({ label: t.title, value: t.id }))]} />
              </div>
            </div>

            <div className="overflow-y-auto max-h-[70vh]">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left"><input type="checkbox" checked={selectedReportsBulk.size === reports.length && reports.length>0} onChange={(e) => selectAllVisible(e.target.checked)} /></th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">文件名</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">学生</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">提交时间</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">所属任务</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reports.map((report) => (
                    <tr key={report.id}>
                      <td className="px-4 py-2"><input type="checkbox" checked={selectedReportsBulk.has(report.id)} onChange={(e) => toggleSelectReport(report.id, e.target.checked)} /></td>
                      <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900">{report.title}</div></td>
                      <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900">{report.user.name}</div><div className="text-sm text-gray-500">{report.user.studentId}</div></td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(report.submittedAt).toLocaleString('zh-CN')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Select style={{ width: 220 }} value={report.task?.id ?? ''} onChange={(val) => assignTaskForReport(report.id, val === '' ? null : val)} options={[{ label: '未分配', value: '' }, ...tasks.map(t => ({ label: t.title, value: t.id }))]} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm"><a href={report.fileUrl} target="_blank" rel="noreferrer" className="text-blue-600">下载</a></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
