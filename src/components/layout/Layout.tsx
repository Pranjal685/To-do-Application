import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { PomodoroProvider } from '@/components/pomodoro/PomodoroContext';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div 
      className="min-h-screen transition-colors duration-300"
      style={{
        backgroundColor: 'hsl(var(--background))',
        minHeight: '100vh',
      }}
    >
      <PomodoroProvider>
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 ml-0 md:ml-72 pt-20 transition-all duration-300">
            <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
              {children}
            </div>
          </main>
        </div>
      </PomodoroProvider>
    </div>
  );
}