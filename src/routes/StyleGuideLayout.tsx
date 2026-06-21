import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';

export default function StyleGuideLayout() {
  return (
    <div className="flex h-screen bg-transparent">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}