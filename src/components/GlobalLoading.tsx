import { Spin } from 'antd';
import { useLoading } from '@/contexts/LoadingContext';
import { useEffect, useState } from 'react';

const GlobalLoading = () => {
  const { loading } = useLoading();
  const [displayLoading, setDisplayLoading] = useState(false);

  // 添加延迟显示，避免闪烁
  useEffect(() => {
    let timer = null;
    if (loading) {
      // 0.3秒后才显示，避免短暂的加载闪烁
      timer = setTimeout(() => setDisplayLoading(true), 300);
    } else {
      setDisplayLoading(false);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [loading]);

  if (!displayLoading) return null;

  return <Spin size="large" tip="加载中..." fullscreen />;
};

export default GlobalLoading;
