import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Kanban,
  Calendar,
  BarChart3,
  Settings,
  MessageCircle,
  Timer,
  FolderOpen,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Kanban Board', href: '/kanban', icon: Kanban },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Analytics Window', href: '/analytics', icon: BarChart3 },
  { name: 'AI Assistant', href: '/chat', icon: MessageCircle },
  { name: 'Pomodoro', href: '/pomodoro', icon: Timer },
  { name: 'Projects', href: '/projects', icon: FolderOpen },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const { actualTheme } = useTheme();
  const isDark = actualTheme === 'dark';
  
  return (
    <motion.aside
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="hidden md:block fixed left-0 top-20 bottom-0 w-64 lg:w-72 overflow-y-auto scrollbar-thin z-40"
      style={{
        background: isDark 
          ? 'rgba(20, 20, 20, 0.6)' 
          : 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderRight: isDark
          ? '1px solid rgba(255, 255, 255, 0.1)'
          : '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: isDark
          ? '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
          : '0 8px 32px 0 rgba(255, 255, 255, 0.1)',
      }}
    >
      <nav className="p-4 space-y-2">
        {navigation.map((item, index) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 overflow-hidden',
                isActive
                  ? 'bg-gradient-to-r from-champagne-gold/20 to-crystal-teal/20 text-champagne-gold border border-champagne-gold/30 shadow-lg glow-gold-hover'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5 dark:hover:bg-white/5 border border-transparent hover:border-white/10'
              )
            }
          >
            {({ isActive }) => (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <item.icon
                    className={cn(
                      'w-5 h-5 transition-colors',
                      isActive ? 'text-champagne-gold' : 'text-muted-foreground group-hover:text-champagne-gold'
                    )}
                  />
                </motion.div>
                <span className="relative z-10">{item.name}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-champagne-gold/10 to-crystal-teal/10 rounded-xl"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"
                />
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </motion.aside>
  );
}