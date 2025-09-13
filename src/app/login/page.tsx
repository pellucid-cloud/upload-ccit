'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const studentId = formData.get('studentId') as string;
    const password = formData.get('password') as string;

    try {
      const result = await signIn('credentials', {
        studentId,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('登录失败，请检查学号/工号和密码');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (error) {
      setError('登录时发生错误');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold text-center mb-6">登录</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded">
            {error}
          </div>
        )}
        <div>
          <label htmlFor="studentId" className="block text-sm font-medium text-gray-700">
            学号/工号
          </label>
          <input
            type="text"
            name="studentId"
            id="studentId"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            密码
          </label>
          <input
            type="password"
            name="password"
            id="password"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white rounded-md py-2 hover:bg-blue-700"
        >
          登录
        </button>
      </form>
    </div>
  );
}
