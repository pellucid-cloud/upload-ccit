import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // 根据用户角色重定向
  if (session.user.role === 'TEACHER') {
    redirect('/admin');
  } else {
    redirect('/upload');
  }

}