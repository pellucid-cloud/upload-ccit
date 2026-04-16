'use client';

import { useEffect, useState } from 'react';
import { Table, Button, Input, message, Popconfirm } from 'antd';

interface User {
  id: string;
  name: string;
  studentId: string;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('获取用户失败');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (_e) {
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleResetPassword = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/users/${id}/reset-password`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error(await res.text() || '重置失败');
      message.success(`已重置用户 ${name} 的密码（默认与其学号一致）`);
    } catch (e: any) {
      message.error(e?.message || '操作失败');
    }
  };

  const filteredUsers = [...users]
    .filter(u => u.name.includes(filterText) || u.studentId.includes(filterText))
    .sort((a, b) => a.studentId.localeCompare(b.studentId));

  const columns = [
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '学号', dataIndex: 'studentId', key: 'studentId' },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text: string) => new Date(text).toLocaleString('zh-CN')
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: User) => (
        <Popconfirm
          title="确定要重置该用户的密码吗？"
          description="密码将重置为其对应的学号。"
          onConfirm={() => handleResetPassword(record.id, record.name)}
          okText="重置"
          cancelText="取消"
        >
          <Button danger size="small">重置密码</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-4 flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex justify-between items-center mb-4 shrink-0">
        <h1 className="text-xl font-bold">用户管理</h1>
        <Input
          placeholder="按姓名或学号搜索"
          value={filterText}
          onChange={e => setFilterText(e.target.value)}
          style={{ width: 250 }}
          allowClear
        />
      </div>
      <div className="flex-1">
        <Table
          className="flex-1 overflow-hidden"
          rowKey="id"
          columns={columns}
          dataSource={filteredUsers}
          loading={loading}
          pagination={{ pageSize: 15 }}
          scroll={{ y: 'calc(100vh - 300px)' }}
        /></div>
    </div>
  );
}
