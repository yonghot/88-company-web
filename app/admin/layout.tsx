'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut, Settings, FileText } from 'lucide-react';
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', {
        method: 'DELETE',
      });
      router.push('/admin-login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      <nav className="bg-gray-800 border-b border-gray-700 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-white mr-8">88 관리자</h1>
              <div className="flex items-center space-x-4">
                <Link href="/admin">
                  <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-gray-700">
                    <FileText className="w-4 h-4 mr-2" />
                    리드 관리
                  </Button>
                </Link>
                <Link href="/admin/questions">
                  <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-gray-700">
                    <Settings className="w-4 h-4 mr-2" />
                    질문 관리
                  </Button>
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="text-gray-300 hover:text-white hover:bg-gray-700"
              >
                <LogOut className="w-4 h-4 mr-2" />
                로그아웃
              </Button>
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}