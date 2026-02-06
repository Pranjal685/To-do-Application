import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/Button';
import { Brain, Moon, Sun, LogOut, User, Sparkles } from 'lucide-react';
import MiniPlayer from '@/components/pomodoro/MiniPlayer';

export default function Header() {
  const { user, signOut } = useAuth();
  const { setTheme, actualTheme } = useTheme();
  const isDark = actualTheme === 'dark';

  const toggleTheme = () => {
    setTheme(actualTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 border-b"
      style={{
        background: isDark 
          ? 'rgba(20, 20, 20, 0.6)' 
          : 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: isDark
          ? '1px solid rgba(255, 255, 255, 0.1)'
          : '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: isDark
          ? '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
          : '0 8px 32px 0 rgba(255, 255, 255, 0.1)',
      }}
    >
      <div className="flex items-center justify-between px-6 py-4">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center space-x-3 cursor-pointer"
        >
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-champagne-gold via-crystal-teal to-champagne-gold rounded-xl flex items-center justify-center shadow-lg glow-gold group">
              <Brain className="w-5 h-5 text-charcoal-graphite z-10" />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 rounded-xl border-2 border-champagne-gold/30 opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </div>
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-xl bg-champagne-gold/20 blur-xl -z-10"
            />
          </div>
          <h1 className="text-2xl font-bold gradient-text-gold tracking-tight">
            AI Todo
          </h1>
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Sparkles className="w-4 h-4 text-champagne-gold" />
          </motion.div>
        </motion.div>

        <div className="flex items-center space-x-2 md:space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="w-9 h-9 md:w-10 md:h-10 rounded-xl hover:bg-champagne-gold/10 dark:hover:bg-champagne-gold/20 transition-all"
          >
            <motion.div
              animate={{ rotate: actualTheme === 'dark' ? 0 : 180 }}
              transition={{ duration: 0.5 }}
            >
              {actualTheme === 'dark' ? (
                <Sun className="w-5 h-5 text-champagne-gold" />
              ) : (
                <Moon className="w-5 h-5 text-crystal-teal" />
              )}
            </motion.div>
          </Button>

          {/* Mini Pomodoro player pinned in header (provider is at Layout) */}
          <MiniPlayer />

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center space-x-2 md:space-x-3 px-3 py-1.5 rounded-xl border border-white/10"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-champagne-gold/20 to-crystal-teal/20 rounded-full flex items-center justify-center border border-champagne-gold/30 flex-shrink-0">
              <User className="w-4 h-4 text-champagne-gold" />
            </div>
            <span className="text-sm font-semibold text-foreground hidden sm:block truncate max-w-[120px] md:max-w-none">
              {user?.full_name || user?.email}
            </span>
          </motion.div>

          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            className="w-10 h-10 rounded-xl hover:bg-error-rose/10 hover:text-error-rose"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </motion.header>
  );
}