import React from 'react';
import { useAuth } from '../context/useAuth';
import { useTheme } from '../context/useTheme';
import { BookOpen, Search, Sun, Moon, LogOut, ChevronRight } from 'lucide-react';
import type { Subject, Chapter, Topic, ViewMode } from '../types';

interface NavbarProps {
  currentView: ViewMode;
  currentSubject?: Subject | null;
  currentChapter?: Chapter | null;
  currentTopic?: Topic | null;
  onNavigateHome: () => void;
  onNavigateSubject: (subjectId: string) => void;
  onNavigateChapter: (subjectId: string, chapterId: string) => void;
  onOpenSearch: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  currentSubject,
  currentChapter,
  currentTopic,
  onNavigateHome,
  onNavigateSubject,
  onNavigateChapter,
  onOpenSearch,
}) => {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-xs border-b border-neutral-200 dark:border-neutral-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Left: Brand + Breadcrumbs */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-2 text-sm font-bold tracking-tight text-neutral-900 dark:text-neutral-100 hover:opacity-80 transition-opacity shrink-0"
          >
            <div className="p-1 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
              <BookOpen className="w-4 h-4 text-neutral-800 dark:text-neutral-200" />
            </div>
            <span className="hidden sm:inline">Academic Workspace</span>
          </button>

          {/* Breadcrumb Path */}
          {currentView.type !== 'subjects' && (
            <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 min-w-0">
              <ChevronRight className="w-3.5 h-3.5 shrink-0 text-neutral-400" />

              <button
                onClick={onNavigateHome}
                className="hover:text-neutral-900 dark:hover:text-neutral-100 truncate shrink-0"
              >
                Subjects
              </button>

              {currentSubject && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
                  <button
                    onClick={() => onNavigateSubject(currentSubject.id)}
                    className={`hover:text-neutral-900 dark:hover:text-neutral-100 truncate ${
                      currentView.type === 'subject-detail'
                        ? 'font-semibold text-neutral-900 dark:text-neutral-100'
                        : ''
                    }`}
                  >
                    {currentSubject.subject_code || currentSubject.name}
                  </button>
                </>
              )}

              {currentChapter && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
                  <button
                    onClick={() => onNavigateChapter(currentChapter.subject_id, currentChapter.id)}
                    className={`hover:text-neutral-900 dark:hover:text-neutral-100 truncate ${
                      currentView.type === 'chapter-detail'
                        ? 'font-semibold text-neutral-900 dark:text-neutral-100'
                        : ''
                    }`}
                  >
                    {currentChapter.chapter_number ? `${currentChapter.chapter_number}` : currentChapter.name}
                  </button>
                </>
              )}

              {currentTopic && currentView.type === 'topic-detail' && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100 truncate max-w-[140px] sm:max-w-[200px]">
                    {currentTopic.name}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right: Search, Theme Toggle, User, Sign Out */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Search Button */}
          <button
            type="button"
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 text-xs transition-colors cursor-pointer"
            title="Search Workspace (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Search...</span>
            <kbd className="hidden lg:inline font-mono text-[10px] text-neutral-400 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-1 rounded">
              Ctrl+K
            </kbd>
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 rounded-md border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-neutral-700" />
            )}
          </button>

          {/* User Sign Out */}
          {user && (
            <div className="flex items-center gap-1.5 pl-1">
              <span className="hidden xl:inline text-xs text-neutral-500 dark:text-neutral-400 max-w-[150px] truncate">
                {user.email}
              </span>
              <button
                type="button"
                onClick={signOut}
                className="p-1.5 rounded-md border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                title="Sign out of personal workspace"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
