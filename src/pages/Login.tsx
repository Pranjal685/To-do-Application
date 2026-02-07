import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Brain, CheckCircle, Zap, Sun, Moon } from 'lucide-react';
import { validateLoginForm, validateSignupForm } from '@/lib/validation';
import toast from 'react-hot-toast';

export default function Login() {
  const { user, signIn, signUp, setDevAdmin } = useAuth();
  const { actualTheme, setTheme } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ password?: string }>({});
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
  });

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    // Validate form (includes password validation for signup)
    const validation = isLogin
      ? validateLoginForm({ email: formData.email, password: formData.password })
      : validateSignupForm({ email: formData.email, password: formData.password, fullName: formData.fullName });

    if (!validation.valid) {
      // Show field-specific error for password
      if (validation.error?.toLowerCase().includes('password')) {
        setFieldErrors({ password: validation.error });
      }
      toast.error(validation.error || 'Please check your input');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        await signIn(formData.email, formData.password);
        toast.success('Welcome back!');
      } else {
        await signUp(formData.email, formData.password, formData.fullName);
        toast.success('Account created successfully!');
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDevAdmin = () => {
    setDevAdmin();
  };

  // Show only 3 key features on login page to avoid overflow
  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Assistant',
      description: 'Intelligent suggestions and productivity coaching',
    },
    {
      icon: CheckCircle,
      title: 'Smart Task Management',
      description: 'Natural language task organization',
    },
    {
      icon: Zap,
      title: 'Productivity Tools',
      description: 'Pomodoro timer and focus sessions',
    },
  ];

  return (
    <div
      className="h-screen overflow-hidden transition-colors duration-300 relative"
      style={{
        backgroundColor: 'hsl(var(--background))',
      }}
    >
      {/* Theme Toggle - Debug Tool */}
      <button
        onClick={() => setTheme(actualTheme === 'dark' ? 'light' : 'dark')}
        className="absolute top-4 right-4 p-2 rounded-lg border border-border hover:bg-muted transition-colors duration-200 hover-lift"
        aria-label="Toggle theme"
        title={`Switch to ${actualTheme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {actualTheme === 'dark' ? (
          <Sun className="w-5 h-5 text-foreground" />
        ) : (
          <Moon className="w-5 h-5 text-foreground" />
        )}
      </button>
      <div className="container mx-auto px-4 py-6 lg:py-8 h-full flex items-center">
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 items-center w-full">
          {/* Left side - Branding and Features */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6 lg:space-y-8"
          >
            <div className="space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2, type: 'spring' }}
                className="flex items-center space-x-3"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-3xl font-bold text-foreground">AI Todo</h1>
              </motion.div>
              <div className="space-y-3">
                <h2 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                  Supercharge Your
                  <br />
                  <span className="text-primary">Productivity</span>
                </h2>
                <p className="text-base lg:text-lg text-muted-foreground leading-relaxed max-w-md">
                  The next-generation task management app powered by AI. Get more done with intelligent assistance and smart scheduling.
                </p>
              </div>
            </div>

            <div className="space-y-3 hidden lg:block">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                  className="glass-card p-3 border border-white/10 feature-hover cursor-pointer rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 border border-border">
                      <feature.icon className="w-5 h-5 text-muted-foreground icon-hover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground text-sm text-hover">
                        {feature.title}
                      </h3>
                      <p className="text-xs text-muted-foreground description-hover">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right side - Login Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex justify-center"
          >
            <Card variant="glass" className="w-full max-w-md login-card">
              <CardHeader className="space-y-2 pb-6">
                <CardTitle className="text-2xl font-semibold text-center text-foreground">
                  {isLogin ? 'Welcome back' : 'Create account'}
                </CardTitle>
                <CardDescription className="text-center text-base">
                  {isLogin
                    ? 'Sign in to your account to continue'
                    : 'Sign up to get started with AI Todo'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {!isLogin && (
                    <div className="space-y-2">
                      <label htmlFor="fullName" className="text-sm font-medium text-muted-foreground">
                        Full Name
                      </label>
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="Enter your full name"
                        className="input-calm"
                        value={formData.fullName}
                        onChange={(e) =>
                          setFormData({ ...formData, fullName: e.target.value })
                        }
                        required={!isLogin}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-muted-foreground">
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      className="input-calm"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium text-muted-foreground">
                      Password
                    </label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      className={`input-calm ${fieldErrors.password ? 'border-destructive' : ''}`}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required
                    />
                    {!isLogin && (
                      <p className="text-xs text-muted-foreground">
                        Min 8 characters, include a letter and number
                      </p>
                    )}
                    {fieldErrors.password && (
                      <p className="text-xs text-destructive">{fieldErrors.password}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    variant="premium"
                    size="lg"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Sign Up'}
                  </Button>
                  {/* Dev admin button - only visible in development */}
                  {import.meta.env.DEV && (
                    <Button
                      type="button"
                      variant="glass"
                      className="w-full"
                      onClick={handleDevAdmin}
                    >
                      Dev Admin Access
                    </Button>
                  )}
                </form>

                <div className="mt-6 pt-6 border-t border-white/10 text-center">
                  <button
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
                  >
                    {isLogin
                      ? "Don't have an account? Sign up"
                      : 'Already have an account? Sign in'}
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}