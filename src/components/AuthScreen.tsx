import React, { useState } from 'react';
import { useAuth } from '../context/useAuth';
import { BookOpen, Mail, ArrowRight, ShieldCheck, Sun, Moon, Loader2 } from 'lucide-react';
import { useTheme } from '../context/useTheme';


export const AuthScreen: React.FC = () => {
  const { loginWithEmail } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await loginWithEmail(cleanEmail);
      if (error) {
        setErrorMessage(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors">
      {/* Top right theme toggle */}
      <div className="absolute top-4 right-4">
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-md border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-neutral-700" />
          )}
        </button>
      </div>

      <div className="w-full max-w-sm">
        {/* Notebook Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 mb-4">
            <BookOpen className="w-6 h-6 text-neutral-800 dark:text-neutral-200" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Academic Workspace
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Personal syllabus, exam answers &amp; revision notes
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-6 shadow-xs">
          <div className="flex items-center justify-between mb-5 border-b border-neutral-200 dark:border-neutral-800 pb-3">
            <div className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              Personal Access
            </div>
            <div className="flex items-center gap-1 text-xs text-neutral-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Instant Entry</span>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 text-xs rounded border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Your Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  autoFocus
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-400 transition-colors"
                />
              </div>
              <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1.5">
                No password or confirmation email needed. Just enter your email to access your workspace.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium rounded-md bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white text-white disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Entering Workspace...</span>
                </>
              ) : (
                <>
                  <span>Enter Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security Notice */}
        <p className="mt-6 text-center text-xs text-neutral-400 dark:text-neutral-500">
          Private single-user workspace. Protected by Row Level Security.
        </p>
      </div>
    </div>
  );
};
