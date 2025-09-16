'use client';

import { Layout, Menu, Button, Flex } from 'antd';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const { Header, Content } = Layout;

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();

  const getMenuItems = () => {
    if (!session) {
      return [
        {
          key: '/login',
          label: <Link href="/login">登录</Link>,
        }
      ];
    }

    const commonItems = [
      {
        key: '/dashboard/password',
        label: <Link href="/dashboard/password">修改密码</Link>,
      }
    ];

    return session.user.role === 'TEACHER'
      ? [
          { key: '/admin', label: <Link href="/admin">管理面板</Link> },
          { key: '/dashboard', label: <Link href="/dashboard">数据面板</Link> },
          ...commonItems
        ]
      : [
          { key: '/upload', label: <Link href="/upload">上传报告</Link> },
          ...commonItems
        ];
  };

  return (
    // 将Layout设置为flex布局，以适应不同屏幕尺寸
    <Layout style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header style={{ background: '#fff', padding: '0 16px' }}>
        <Flex justify="space-between" align="center" style={{ height: '100%' }}>
          <Flex align="center" gap="middle">
            <Link href="/" className="text-xl font-bold">
              实验报告系统
            </Link>
            <Menu
              mode="horizontal"
              selectedKeys={[pathname]}
              items={getMenuItems()}
              style={{ border: 'none' }}
            />
          </Flex>
          {session && (
            <Flex align="center" gap="middle">
              <span>{session.user.name}</span>
              <Button onClick={() => {
                signOut({ callbackUrl: '/login' })
              }}>
                退出登录
              </Button>
            </Flex>
          )}
        </Flex>
      </Header>
      <Content style={{ padding: '0 50px', marginTop: 24 }}>
        <div className="site-layout-content">{children}</div>
      </Content>
    </Layout>
  );
}
