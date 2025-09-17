import { createContext, useContext, useState } from 'react';
// 定义Loading上下文的类型
interface LoadingContextType {
  loading: boolean;
  startLoading: () => void;
  endLoading: () => void;
  forceEndLoading: () => void;
}

// 创建Loading上下文，并提供正确的类型和默认值
const LoadingContext = createContext<LoadingContextType | null>(null);

// Loading提供者组件
export const LoadingProvider = ({ children }: { children: React.ReactNode }) => {
  // 维护加载状态和计数器
  const [loading, setLoading] = useState(false);
  const [loadingCount, setLoadingCount] = useState(0);

  // 开始加载（支持叠加）
  const startLoading = () => {
    setLoadingCount(prev => {
      const newCount = prev + 1;
      if (newCount > 0) setLoading(true);
      return newCount;
    });
  };

  // 结束加载
  const endLoading = () => {
    setLoadingCount(prev => {
      const newCount = prev - 1;
      if (newCount <= 0) {
        setLoading(false);
        return 0;
      }
      return newCount;
    });
  };

  // 强制结束所有加载
  const forceEndLoading = () => {
    setLoading(false);
    setLoadingCount(0);
  };

  return (
    <LoadingContext.Provider
      value={{
        loading,
        startLoading,
        endLoading,
        forceEndLoading,
      }}>
      {children}
    </LoadingContext.Provider>
  );
};

// 自定义Hook，用于在组件中使用Loading状态
export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};
