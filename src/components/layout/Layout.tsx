import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { PomodoroProvider } from '@/components/pomodoro/PomodoroContext';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <PomodoroProvider>
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 ml-64 pt-16">
            <div className="p-6">
              {children}
            </div>
          </main>
        </div>
      </PomodoroProvider>
    </div>
  );
}