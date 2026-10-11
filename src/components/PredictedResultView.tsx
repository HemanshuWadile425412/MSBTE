import React, { useState, useEffect, useMemo } from 'react';
import type { PredictedResult } from '../types';
import { supabase } from '../lib/supabase';
import {
  ELECTIVE_OPTIONS,
  calculateMarksheet,
  createDefaultPredictedResult,
  getElectiveSubjectData,
} from '../lib/predictedResultDefaults';
import {
  ArrowLeft,
  Save,
  RotateCcw,
  Printer,
  AlertCircle,
  Loader2,
  Award,
  AlertTriangle,
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface PredictedResultViewProps {
  userId: string;
  onBack: () => void;
  showToast: (text: string, type?: 'success' | 'error') => void;
}

export const PredictedResultView: React.FC<PredictedResultViewProps> = ({
  userId,
  onBack,
  showToast,
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resultData, setResultData] = useState<PredictedResult>(() =>
    createDefaultPredictedResult(userId)
  );

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Load existing saved predicted result from Supabase
  useEffect(() => {
    async function loadResult() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('predicted_results')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (error) {
          console.error('Error fetching predicted result:', error);
          showToast('Failed to load saved predicted result.', 'error');
        } else if (data && data.subjects_data && Array.isArray(data.subjects_data)) {
          setResultData({
            ...data,
            subjects_data: data.subjects_data,
          });
        }
      } catch (err) {
        console.error('Unexpected error loading predicted result:', err);
      } finally {
        setLoading(false);
      }
    }

    loadResult();
  }, [userId]);

  // Recalculate totals dynamically
  const calculated = useMemo(() => {
    return calculateMarksheet(resultData.subjects_data);
  }, [resultData.subjects_data]);

  // Handle student info change
  const handleInfoChange = (field: keyof PredictedResult, value: string) => {
    setResultData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle elective change
  const handleElectiveChange = (newElectiveCode: string) => {
    const newElectiveSubject = getElectiveSubjectData(newElectiveCode);

    setResultData((prev) => {
      const updatedSubjects = prev.subjects_data.map((sub) =>
        sub.isElective ? newElectiveSubject : sub
      );

      // If no elective subject was present, append it
      const hasElective = updatedSubjects.some((s) => s.isElective);
      const finalSubjects = hasElective ? updatedSubjects : [...updatedSubjects, newElectiveSubject];

      return {
        ...prev,
        elective_code: newElectiveCode,
        subjects_data: finalSubjects,
      };
    });
  };

  // Handle mark change in a specific head
  const handleMarkChange = (
    subjectIndex: number,
    headIndex: number,
    rawValue: string
  ) => {
    setValidationError(null);
    const numValue = rawValue === '' ? null : Number(rawValue);

    setResultData((prev) => {
      const nextSubjects = [...prev.subjects_data];
      const targetSub = { ...nextSubjects[subjectIndex] };
      const nextHeads = [...targetSub.heads];
      const targetHead = { ...nextHeads[headIndex] };

      targetHead.obtainedMarks = numValue !== null && !isNaN(numValue) ? numValue : null;
      nextHeads[headIndex] = targetHead;
      targetSub.heads = nextHeads;
      nextSubjects[subjectIndex] = targetSub;

      return {
        ...prev,
        subjects_data: nextSubjects,
      };
    });
  };

  // Validate all marks against their maximum bounds
  const validateMarks = (): boolean => {
    for (const sub of resultData.subjects_data) {
      for (const head of sub.heads) {
        if (head.obtainedMarks !== null) {
          if (head.obtainedMarks < 0) {
            setValidationError(`Obtained marks cannot be negative for ${sub.abbr} (${head.name}).`);
            return false;
          }
          if (head.obtainedMarks > head.maxMarks) {
            setValidationError(
              `Obtained marks (${head.obtainedMarks}) exceed maximum marks (${head.maxMarks}) for ${sub.abbr} (${head.name}).`
            );
            return false;
          }
        }
      }
    }
    return true;
  };

  // Save to Supabase
  const handleSave = async () => {
    if (!validateMarks()) {
      showToast(validationError || 'Invalid marks values.', 'error');
      return;
    }

    setSaving(true);
    setValidationError(null);

    const payload = {
      user_id: userId,
      student_name: resultData.student_name,
      enrollment_no: resultData.enrollment_no,
      seat_no: resultData.seat_no,
      exam_session: resultData.exam_session,
      course_semester: resultData.course_semester,
      elective_code: resultData.elective_code,
      subjects_data: calculated.recalculatedSubjects,
      overall_max: calculated.overallMax,
      overall_obtained: calculated.overallObtained,
      percentage: calculated.percentage,
      result_class: calculated.resultClass,
      updated_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('predicted_results')
        .upsert(payload, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) {
        console.error('Error saving predicted result:', error);
        showToast(`Failed to save: ${error.message}`, 'error');
      } else {
        if (data) {
          setResultData({
            ...data,
            subjects_data: data.subjects_data,
          });
        }
        showToast('Predicted result saved successfully!');
      }
    } catch (err) {
      console.error('Error saving predicted result:', err);
      showToast('An unexpected error occurred while saving.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Reset to default values
  const handleReset = () => {
    const defaultData = createDefaultPredictedResult(userId);
    setResultData(defaultData);
    setShowResetConfirm(false);
    showToast('Reset to default values. Click Save to persist.');
  };

  // Print marksheet
  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-neutral-400 mb-2" />
        <p className="text-xs text-neutral-500">Loading predicted statement of marks...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Navigation & Action Controls (Hidden on Print) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-4 print:hidden">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Print or Save as PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print / PDF</span>
          </button>

          {/* Reset Button */}
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Reset to default marks"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-md bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-white transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Validation Error Banner */}
      {validationError && (
        <div className="p-3 rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center gap-2 text-xs text-red-600 dark:text-red-400 print:hidden">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Main Formal Statement of Marks Container */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-xs overflow-hidden print:border-none print:shadow-none print:p-0">
        {/* Formal Marksheet Header */}
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 text-center space-y-1.5 bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold tracking-wider uppercase bg-neutral-200/60 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 mb-1">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            <span>Personal Predicted Result • Not an Official MSBTE Statement</span>
          </div>

          <h1 className="text-lg sm:text-xl font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
            Maharashtra State Board of Technical Education, Mumbai
          </h1>
          <h2 className="text-xs sm:text-sm font-semibold tracking-wide text-neutral-600 dark:text-neutral-400">
            Statement of Marks (Semester V — Academic Prediction)
          </h2>
        </div>

        {/* Candidate Information Grid */}
        <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs bg-white dark:bg-neutral-900">
          <div>
            <label className="block text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mb-1">
              Candidate&apos;s Full Name
            </label>
            <input
              type="text"
              value={resultData.student_name}
              onChange={(e) => handleInfoChange('student_name', e.target.value)}
              placeholder="e.g. Hemanshu Wadile"
              className="w-full px-2.5 py-1.5 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-medium focus:outline-none focus:ring-1 focus:ring-neutral-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mb-1">
              Enrollment Number
            </label>
            <input
              type="text"
              value={resultData.enrollment_no}
              onChange={(e) => handleInfoChange('enrollment_no', e.target.value)}
              placeholder="e.g. 2200150..."
              className="w-full px-2.5 py-1.5 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono focus:outline-none focus:ring-1 focus:ring-neutral-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mb-1">
              Seat Number
            </label>
            <input
              type="text"
              value={resultData.seat_no}
              onChange={(e) => handleInfoChange('seat_no', e.target.value)}
              placeholder="e.g. 123456"
              className="w-full px-2.5 py-1.5 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono focus:outline-none focus:ring-1 focus:ring-neutral-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mb-1">
              Examination Session
            </label>
            <input
              type="text"
              value={resultData.exam_session}
              onChange={(e) => handleInfoChange('exam_session', e.target.value)}
              placeholder="e.g. Winter 2026"
              className="w-full px-2.5 py-1.5 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-medium focus:outline-none focus:ring-1 focus:ring-neutral-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mb-1">
              Course &amp; Semester
            </label>
            <input
              type="text"
              value={resultData.course_semester}
              onChange={(e) => handleInfoChange('course_semester', e.target.value)}
              placeholder="Diploma in Computer Engg. - Sem V"
              className="w-full px-2.5 py-1.5 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-medium focus:outline-none focus:ring-1 focus:ring-neutral-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mb-1">
              Semester V Elective Choice
            </label>
            <select
              value={resultData.elective_code}
              onChange={(e) => handleElectiveChange(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-medium focus:outline-none focus:ring-1 focus:ring-neutral-400 cursor-pointer"
            >
              {ELECTIVE_OPTIONS.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.name} ({opt.abbr}) — {opt.code} ({opt.max} Marks)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Detailed Marks Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-100/70 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-800 text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 uppercase">
                <th className="py-2.5 px-3 w-20">Code</th>
                <th className="py-2.5 px-3 min-w-[180px]">Subject Title</th>
                <th className="py-2.5 px-3 min-w-[340px]">
                  Assessment Heads (Max / Min / Obtained)
                </th>
                <th className="py-2.5 px-3 text-right w-24">Sub Max</th>
                <th className="py-2.5 px-3 text-right w-24">Obtained</th>
                <th className="py-2.5 px-3 text-center w-20">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {calculated.recalculatedSubjects.map((sub, subIdx) => (
                <tr
                  key={sub.code}
                  className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 transition-colors"
                >
                  {/* Subject Code */}
                  <td className="py-3 px-3 font-mono font-medium text-neutral-700 dark:text-neutral-300 align-top">
                    {sub.code}
                  </td>

                  {/* Subject Title */}
                  <td className="py-3 px-3 align-top">
                    <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                      {sub.name}
                    </div>
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      Abbr: <span className="font-mono font-medium">{sub.abbr}</span>
                      {sub.isElective && (
                        <span className="ml-1.5 px-1 py-0.2 rounded bg-neutral-200 dark:bg-neutral-800 text-[10px]">
                          Elective
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Assessment Heads Editing Grid */}
                  <td className="py-3 px-3 align-top">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {sub.heads.map((head, headIdx) => {
                        const isExceeded =
                          head.obtainedMarks !== null && head.obtainedMarks > head.maxMarks;
                        const isFailedHead =
                          head.minMarks > 0 &&
                          head.obtainedMarks !== null &&
                          head.obtainedMarks < head.minMarks;

                        return (
                          <div
                            key={head.name}
                            className={`p-2 rounded border text-[11px] transition-colors ${
                              isExceeded
                                ? 'border-red-400 bg-red-50 dark:bg-red-950/40'
                                : isFailedHead
                                ? 'border-amber-400 bg-amber-50/50 dark:bg-amber-950/20'
                                : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/60'
                            }`}
                          >
                            <div className="flex items-center justify-between font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                              <span>{head.name}</span>
                              <span className="text-[10px] text-neutral-400 font-mono">
                                Max {head.maxMarks}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min={0}
                                max={head.maxMarks}
                                value={
                                  head.obtainedMarks !== null ? head.obtainedMarks : ''
                                }
                                onChange={(e) =>
                                  handleMarkChange(subIdx, headIdx, e.target.value)
                                }
                                placeholder="0"
                                className={`w-full px-2 py-1 text-xs rounded border text-right font-mono font-semibold focus:outline-none focus:ring-1 ${
                                  isExceeded
                                    ? 'border-red-500 text-red-600 bg-white dark:bg-neutral-900 focus:ring-red-500'
                                    : 'border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:ring-neutral-400'
                                }`}
                              />
                            </div>

                            <div className="mt-1 flex items-center justify-between text-[10px] text-neutral-400">
                              <span>Min: {head.minMarks}</span>
                              {head.obtainedMarks !== null && (
                                <span
                                  className={
                                    isFailedHead
                                      ? 'text-amber-600 font-medium'
                                      : 'text-neutral-500'
                                  }
                                >
                                  {isFailedHead ? 'Below Min' : 'OK'}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </td>

                  {/* Subject Total Max */}
                  <td className="py-3 px-3 text-right font-mono font-medium text-neutral-600 dark:text-neutral-300 align-top">
                    {sub.totalMax}
                  </td>

                  {/* Subject Total Obtained */}
                  <td className="py-3 px-3 text-right font-mono font-bold text-neutral-900 dark:text-neutral-100 align-top">
                    {sub.totalObtained}
                  </td>

                  {/* Subject Status */}
                  <td className="py-3 px-3 text-center align-top">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase ${
                        sub.isPassed
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                      }`}
                    >
                      {sub.isPassed ? 'Pass' : 'Backlog'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>

            {/* Overall Summary Row */}
            <tfoot>
              <tr className="bg-neutral-100/90 dark:bg-neutral-800 font-bold border-t-2 border-neutral-300 dark:border-neutral-700">
                <td colSpan={3} className="py-3.5 px-4 text-neutral-900 dark:text-neutral-100 uppercase tracking-wide">
                  Total Marks &amp; Predicted Performance Summary
                </td>
                <td className="py-3.5 px-3 text-right font-mono text-neutral-900 dark:text-neutral-100">
                  {calculated.overallMax}
                </td>
                <td className="py-3.5 px-3 text-right font-mono text-sm text-neutral-950 dark:text-white">
                  {calculated.overallObtained}
                </td>
                <td className="py-3.5 px-3 text-center">
                  <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                    {calculated.percentage}%
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Bottom Predicted Class Card */}
        <div className="p-6 bg-neutral-50 dark:bg-neutral-900/80 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-semibold">
                Estimated Result Classification
              </div>
              <div className="text-base sm:text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                {calculated.resultClass}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 sm:border-l sm:border-neutral-200 sm:dark:border-neutral-800 sm:pl-6">
            <div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Total Score
              </div>
              <div className="text-base font-bold font-mono text-neutral-900 dark:text-neutral-100">
                {calculated.overallObtained} / {calculated.overallMax}
              </div>
            </div>

            <div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Percentage
              </div>
              <div className="text-xl font-extrabold font-mono text-neutral-950 dark:text-white">
                {calculated.percentage}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <ConfirmModal
        isOpen={showResetConfirm}
        title="Reset Marksheet to Default?"
        message="This will reset all obtained marks to the default template values. Any unsaved edits will be discarded."
        onConfirm={handleReset}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
};
