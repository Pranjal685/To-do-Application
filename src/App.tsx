import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SettingsProvider } from './contexts/SettingsContext';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import KanbanBoard from './pages/KanbanBoard';
import Calendar from './pages/Calendar';
import AnalyticsWindow from './pages/AnalyticsWindow';
import AssistantPage from './pages/Assistant';
import Projects from './pages/Projects';
import Settings from './pages/Settings';
import PomodoroPage from './pages/Pomodoro';
import Login from './pages/Login';
import ProtectedRoute from './components/auth/ProtectedRoute';
import './index.css';
import { registerServiceWorker, startReminderLoop } from './lib/notifications';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

function App() {
  // Start simple in-tab reminder loop and register SW for reliability
  startReminderLoop();
  registerServiceWorker();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SettingsProvider>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-background text-foreground">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Routes>
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/kanban" element={<KanbanBoard />} />
                          <Route path="/calendar" element={<Calendar />} />
                          <Route path="/analytics" element={<AnalyticsWindow />} />
                          <Route path="/chat" element={<AssistantPage />} />
                          <Route path="/projects" element={<Projects />} />
                          <Route path="/pomodoro" element={<PomodoroPage />} />
                          <Route path="/settings" element={<Settings />} />
                        </Routes>
                      </Layout>
                    </ProtectedRoute>
                  }
                />
              </Routes>
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  className: 'bg-card text-card-foreground border border-border',
                }}
              />
            </div>
          </Router>
        </AuthProvider>
        </SettingsProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;