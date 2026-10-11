import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import {
  ArrowLeft,
  Check,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface ChapterProgressViewProps {
  userId: string;
  onBack: () => void;
  showToast: (text: string, type?: 'success' | 'error') => void;
}

interface TrackedSubject {
  code: 'OSY' | 'STE' | 'DAN';
  name: string;
  subjectCode: string;
}

const TRACKED_SUBJECTS: TrackedSubject[] = [
  { code: 'OSY', name: 'Operating System', subjectCode: '315319' },
  { code: 'STE', name: 'Software Engineering', subjectCode: '315323' },
  { code: 'DAN', name: 'Data Analytics', subjectCode: '315326' },
];

const CHAPTER_COUNT = 6;
const TOTAL_CHAPTERS = TRACKED_SUBJECTS.length * CHAPTER_COUNT; // 18

export const ChapterProgressView: React.FC<ChapterProgressViewProps> = ({
  userId,
  onBack,
  showToast,
}) => {
  // Key format: `${subject_code}_${chapter_number}` -> boolean
  const [progressState, setProgressState] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Load progress from Supabase
  useEffect(() => {
    async function loadProgress() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('chapter_progress')
          .select('subject_code, chapter_number, is_completed')
          .eq('user_id', userId);

        if (error) {
          console.error('Error fetching chapter progress:', error);
          showToast('Could not load chapter progress.', 'error');
        } else if (data) {
          const mapped: Record<string, boolean> = {};
          data.forEach((item) => {
            mapped[`${item.subject_code}_${item.chapter_number}`] = Boolean(item.is_completed);
          });
          setProgressState(mapped);
        }
      } catch (err) {
        console.error('Unexpected error loading progress:', err);
      } finally {
        setLoading(false);
      }
    }

    loadProgress();
  }, [userId]);

  // Derived progress statistics
  const stats = useMemo(() => {
    let totalCompleted = 0;
    const perSubject: Record<'OSY' | 'STE' | 'DAN', { completed: number; percentage: number }> = {
      OSY: { completed: 0, percentage: 0 },
      STE: { completed: 0, percentage: 0 },
      DAN: { completed: 0, percentage: 0 },
    };

    TRACKED_SUBJECTS.forEach((sub) => {
      let count = 0;
      for (let ch = 1; ch <= CHAPTER_COUNT; ch++) {
        if (progressState[`${sub.code}_${ch}`]) {
          count++;
          totalCompleted++;
        }
      }
      perSubject[sub.code] = {
        completed: count,
        percentage: Math.round((count / CHAPTER_COUNT) * 100),
      };
    });

    const overallPercentage = Math.round((totalCompleted / TOTAL_CHAPTERS) * 100);

    return {
      totalCompleted,
      overallPercentage,
      perSubject,
    };
  }, [progressState]);

  // Toggle chapter completion
  const handleToggleChapter = async (subjectCode: 'OSY' | 'STE' | 'DAN', chapterNumber: number) => {
    const key = `${subjectCode}_${chapterNumber}`;
    const nextState = !progressState[key];

    // Optimistic local state update
    setProgressState((prev) => ({
      ...prev,
      [key]: nextState,
    }));

    // Persist to Supabase
    try {
      const { error } = await supabase.from('chapter_progress').upsert(
        {
          user_id: userId,
          subject_code: subjectCode,
          chapter_number: chapterNumber,
          is_completed: nextState,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,subject_code,chapter_number' }
      );

      if (error) {
        console.error('Failed to update chapter progress:', error);
        // Revert on failure
        setProgressState((prev) => ({
          ...prev,
          [key]: !nextState,
        }));
        showToast('Failed to save progress update.', 'error');
      }
    } catch (err) {
      console.error('Unexpected error updating chapter progress:', err);
      setProgressState((prev) => ({
        ...prev,
        [key]: !nextState,
      }));
      showToast('Error saving progress.', 'error');
    }
  };

  // Reset all progress
  const handleResetProgress = async () => {
    setIsResetting(true);
    try {
      const { error } = await supabase
        .from('chapter_progress')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Failed to reset progress:', error);
        showToast('Could not reset progress.', 'error');
      } else {
        setProgressState({});
        showToast('All chapter progress has been reset.');
      }
    } finally {
      setIsResetting(false);
      setShowResetConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-neutral-400 mb-2" />
        <p className="text-xs text-neutral-500">Loading syllabus progress tracker...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Top Bar Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Reset All Progress Button */}
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Reset all checkboxes"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset All</span>
          </button>
        </div>
      </div>

      {/* Header Banner */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-neutral-500 dark:text-neutral-400">
                Semester V Revision Checklist
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                18 Chapters Total
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              See Your Progress
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-lg">
              Check off each chapter as you finish reading its syllabus, exam answers, and previous year questions.
            </p>
          </div>

          {/* Overall Completion Metric Card */}
          <div className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shrink-0 min-w-[200px]">
            <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-1.5">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Overall Completion</span>
              <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
                {stats.totalCompleted} / {TOTAL_CHAPTERS}
              </span>
            </div>

            <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-2.5 rounded-full overflow-hidden mb-2">
              <div
                className="bg-neutral-900 dark:bg-neutral-100 h-full transition-all duration-300"
                style={{ width: `${stats.overallPercentage}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-[11px] text-neutral-400">Total Progress</span>
              <span className="text-sm font-extrabold font-mono text-neutral-950 dark:text-white">
                {stats.overallPercentage}%
              </span>
            </div>
          </div>
        </div>

        {/* Subject Progress Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-6 pt-5 border-t border-neutral-100 dark:border-neutral-800">
          {TRACKED_SUBJECTS.map((sub) => {
            const subStat = stats.perSubject[sub.code];
            const isCompletedAll = subStat.completed === CHAPTER_COUNT;

            return (
              <div
                key={sub.code}
                className={`p-3.5 rounded-md border transition-all ${
                  isCompletedAll
                    ? 'border-emerald-300 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-emerald-950/20'
                    : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono font-bold text-neutral-900 dark:text-neutral-100">
                      {sub.code}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono">({sub.subjectCode})</span>
                  </div>

                  <span className="text-xs font-mono font-semibold text-neutral-700 dark:text-neutral-300">
                    {subStat.completed} / {CHAPTER_COUNT}
                  </span>
                </div>

                <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mb-2.5" title={sub.name}>
                  {sub.name}
                </div>

                <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isCompletedAll
                        ? 'bg-emerald-600 dark:bg-emerald-400'
                        : 'bg-neutral-800 dark:bg-neutral-200'
                    }`}
                    style={{ width: `${subStat.percentage}%` }}
                  />
                </div>

                <div className="mt-1.5 flex items-center justify-between text-[10px]">
                  <span className="text-neutral-400">Chapters Done</span>
                  <span
                    className={`font-mono font-semibold ${
                      isCompletedAll ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    {subStat.percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Interactive Checklist Table */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Interactive Chapter Completion Matrix
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Click any cell to toggle completion. Every change is saved automatically.
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-neutral-400">
            <span className="inline-block w-3 h-3 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800" />
            <span>Pending</span>
            <span className="ml-2 inline-block w-3 h-3 rounded bg-neutral-900 dark:bg-neutral-100" />
            <span>Completed</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 text-xs">
                <th className="py-3.5 px-4 text-left font-semibold text-neutral-700 dark:text-neutral-300 w-1/4">
                  Chapter
                </th>
                {TRACKED_SUBJECTS.map((sub) => (
                  <th key={sub.code} className="py-3.5 px-4 font-semibold text-neutral-900 dark:text-neutral-100 w-1/4">
                    <div className="text-sm font-mono font-bold">{sub.code}</div>
                    <div className="text-[11px] font-normal text-neutral-500 dark:text-neutral-400 truncate max-w-[150px] mx-auto">
                      {sub.name}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-xs">
              {Array.from({ length: CHAPTER_COUNT }, (_, idx) => {
                const chapterNumber = idx + 1;
                return (
                  <tr
                    key={chapterNumber}
                    className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-colors"
                  >
                    {/* Chapter Label Column */}
                    <td className="py-4 px-4 text-left font-medium text-neutral-800 dark:text-neutral-200">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-[11px] font-mono flex items-center justify-center font-bold">
                          {chapterNumber}
                        </span>
                        <span className="text-xs font-semibold">
                          Chapter {chapterNumber}
                        </span>
                      </div>
                    </td>

                    {/* Subject Checkbox Columns */}
                    {TRACKED_SUBJECTS.map((sub) => {
                      const key = `${sub.code}_${chapterNumber}`;
                      const isCompleted = Boolean(progressState[key]);

                      return (
                        <td key={sub.code} className="py-3 px-4 text-center align-middle">
                          <button
                            type="button"
                            onClick={() => handleToggleChapter(sub.code, chapterNumber)}
                            className={`w-12 h-12 sm:w-14 sm:h-14 mx-auto rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer ${
                              isCompleted
                                ? 'bg-neutral-900 border-neutral-900 text-white dark:bg-neutral-100 dark:border-neutral-100 dark:text-neutral-900 shadow-xs scale-102'
                                : 'border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-transparent hover:border-neutral-500 dark:hover:border-neutral-500'
                            }`}
                            aria-label={`${sub.code} Chapter ${chapterNumber} ${isCompleted ? 'Completed' : 'Incomplete'}`}
                            title={`Click to mark ${sub.code} Chapter ${chapterNumber} as ${
                              isCompleted ? 'incomplete' : 'completed'
                            }`}
                          >
                            <Check
                              className={`w-6 h-6 sm:w-7 sm:h-7 stroke-[3] transition-transform ${
                                isCompleted ? 'scale-100' : 'scale-0'
                              }`}
                            />
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>

            {/* Matrix Footer */}
            <tfoot>
              <tr className="bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 text-xs font-semibold">
                <td className="py-3 px-4 text-left text-neutral-600 dark:text-neutral-400">
                  Subject Totals
                </td>
                {TRACKED_SUBJECTS.map((sub) => {
                  const subStat = stats.perSubject[sub.code];
                  return (
                    <td key={sub.code} className="py-3 px-4 font-mono">
                      <span className="text-neutral-900 dark:text-neutral-100 font-bold">
                        {subStat.completed}
                      </span>
                      <span className="text-neutral-400 font-normal"> / {CHAPTER_COUNT}</span>
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Confirmation Modal for Reset */}
      <ConfirmModal
        isOpen={showResetConfirm}
        title="Reset All Progress?"
        message="Are you sure you want to uncheck all 18 chapters? This will clear your completion records across OSY, STE, and DAN."
        isLoading={isResetting}
        onConfirm={handleResetProgress}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
};
