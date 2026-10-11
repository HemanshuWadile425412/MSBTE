import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { ArrowLeft } from "lucide-react";

type Subject = {
  code: string;
  name: string;
  maxMarks: number;
  obtainedMarks: number | "";
};

type ResultDraft = {
  studentName: string;
  enrollmentNo: string;
  seatNo: string;
  examSession: string;
  courseName: string;
  semester: string;
  subjects: Subject[];
};

const createInitialResult = (): ResultDraft => ({
  studentName: "",
  enrollmentNo: "",
  seatNo: "",
  examSession: "",
  courseName: "Computer Engineering",
  semester: "Semester 5",
  subjects: [
    { code: "315319", name: "Operating System (OSY)", maxMarks: 175, obtainedMarks: 0 },
    { code: "315323", name: "Software Engineering (STE)", maxMarks: 175, obtainedMarks: 0 },
    { code: "315002", name: "Entrepreneurship Development and Startups (ENDS)", maxMarks: 75, obtainedMarks: 0 },
    { code: "315003", name: "Seminar and Project Initiation Course (SPI)", maxMarks: 75, obtainedMarks: 0 },
    { code: "315004", name: "Internship (12 Weeks)", maxMarks: 200, obtainedMarks: 0 },
    { code: "315321", name: "Advance Computer Network (ACN)", maxMarks: 150, obtainedMarks: 0 },
  ],
});

const electives: Record<string, { code: string; name: string }> = {
  ACN: { code: "315321", name: "Advance Computer Network (ACN)" },
  CLC: { code: "315325", name: "Cloud Computing (CLC)" },
  DAN: { code: "315326", name: "Data Analytics (DAN)" },
};

interface PredictedResultProps {
  onBack?: () => void;
}

export default function PredictedResult({ onBack }: PredictedResultProps) {
  const [draft, setDraft] = useState<ResultDraft>(createInitialResult);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadResult() {
      setLoading(true);
      setError("");

      try {
        const { data: authData, error: authError } =
          await supabase.auth.getUser();

        if (authError) throw authError;

        if (!authData.user) {
          throw new Error("Please sign in to access your predicted result.");
        }

        const { data, error: fetchError } = await supabase
          .from("predicted_results")
          .select("result_data")
          .eq("user_id", authData.user.id)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (active && data?.result_data && Object.keys(data.result_data).length > 0) {
          const saved = data.result_data as Partial<ResultDraft>;

          // Merge with defaults so newly added fields do not break older data.
          const initial = createInitialResult();

          setDraft({
            ...initial,
            ...saved,
            subjects:
              Array.isArray(saved.subjects) && saved.subjects.length === 6
                ? saved.subjects.map((subject, index) => ({
                    ...initial.subjects[index],
                    ...subject,
                    maxMarks: initial.subjects[index].maxMarks,
                    obtainedMarks: subject.obtainedMarks ?? 0,
                  }))
                : initial.subjects,
          });
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Could not load the result."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadResult();

    return () => {
      active = false;
    };
  }, []);

  const totalObtained = useMemo(
    () =>
      draft.subjects.reduce(
        (total, subject) => total + Number(subject.obtainedMarks || 0),
        0
      ),
    [draft.subjects]
  );

  const totalMaximum = useMemo(
    () => draft.subjects.reduce((total, subject) => total + subject.maxMarks, 0),
    [draft.subjects]
  );

  const percentage =
    totalMaximum > 0 ? (totalObtained / totalMaximum) * 100 : 0;

  function updateField<K extends keyof Omit<ResultDraft, "subjects">>(
    field: K,
    value: ResultDraft[K]
  ) {
    setDraft((current) => ({ ...current, [field]: value }));
    setMessage("");
  }

  function updateSubject(
    index: number,
    field: "name" | "code" | "obtainedMarks",
    value: string
  ) {
    setDraft((current) => {
      const subjects = [...current.subjects];
      const subject = { ...subjects[index] };

      if (field === "obtainedMarks") {
        if (value.trim() === "") {
          subject.obtainedMarks = "";
        } else {
          const numberValue = Number(value);
          subject.obtainedMarks = Number.isFinite(numberValue)
            ? Math.max(0, Math.min(subject.maxMarks, numberValue))
            : 0;
        }
      } else {
        subject[field] = value;
      }

      subjects[index] = subject;
      return { ...current, subjects };
    });

    setMessage("");
  }

  function updateElective(value: string) {
    const selected = electives[value];
    if (!selected) return;

    setDraft((current) => {
      const subjects = [...current.subjects];
      subjects[5] = {
        ...subjects[5],
        code: selected.code,
        name: selected.name,
      };

      return { ...current, subjects };
    });

    setMessage("");
  }

  async function persistResult(result: ResultDraft) {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError) throw authError;
      if (!authData.user) {
        throw new Error("Please sign in before saving your result.");
      }

      const safeResult: ResultDraft = {
        ...result,
        subjects: result.subjects.map((subject) => ({
          ...subject,
          obtainedMarks: Number(subject.obtainedMarks || 0),
        })),
      };

      const { error: saveError } = await supabase
        .from("predicted_results")
        .upsert(
          {
            user_id: authData.user.id,
            result_data: safeResult,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

      if (saveError) throw saveError;

      setDraft(safeResult);
      setMessage("Changes saved successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save your result."
      );
    } finally {
      setSaving(false);
    }
  }

  async function resetResult() {
    const confirmed = window.confirm(
      "Reset the entire predicted result? Your saved details and marks will be replaced."
    );

    if (!confirmed) return;

    const initial = createInitialResult();
    setDraft(initial);
    await persistResult(initial);
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-sm text-neutral-500">
        Loading your predicted result...
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 text-neutral-900 dark:text-neutral-100 sm:px-6">
      <style>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .result-print { color: #111 !important; background: white !important; }
          input, select { color: #111 !important; background: transparent !important; }
          .result-print { max-width: none !important; padding: 0 !important; }
        }
      `}</style>

      {onBack && (
        <div className="mb-4 no-print">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Predicted Result
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Semester 5 · Computer Engineering
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800 cursor-pointer"
          >
            Print
          </button>

          <button
            type="button"
            onClick={resetResult}
            disabled={saving}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800 cursor-pointer"
          >
            Reset
          </button>

          <button
            type="button"
            onClick={() => persistResult(draft)}
            disabled={saving}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 cursor-pointer"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="mb-5 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
        This is a personal predicted result for planning purposes. It is not an
        official MSBTE marksheet. Verify subject assessment heads and maximum
        marks against your official curriculum.
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
        >
          {error}
        </div>
      )}

      {message && (
        <div
          role="status"
          className="mb-4 rounded-lg border border-neutral-200 p-3 text-sm dark:border-neutral-800"
        >
          {message}
        </div>
      )}

      <section className="result-print rounded-xl border border-neutral-300 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950 sm:p-6">
        <div className="mb-6 border-b border-neutral-300 pb-4 text-center dark:border-neutral-700">
          <h2 className="text-lg font-bold uppercase tracking-wide">
            Semester Examination — Predicted Result
          </h2>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Maharashtra State Board of Technical Education · Personal Draft
          </p>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block text-neutral-500">Student Name</span>
            <input
              value={draft.studentName}
              onChange={(e) => updateField("studentName", e.target.value)}
              placeholder="Enter student name"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-700 dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-neutral-500">Enrollment Number</span>
            <input
              value={draft.enrollmentNo}
              onChange={(e) => updateField("enrollmentNo", e.target.value)}
              placeholder="Enter enrollment number"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-700 dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-neutral-500">Seat Number</span>
            <input
              value={draft.seatNo}
              onChange={(e) => updateField("seatNo", e.target.value)}
              placeholder="Enter seat number"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-700 dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-neutral-500">Exam Session</span>
            <input
              value={draft.examSession}
              onChange={(e) => updateField("examSession", e.target.value)}
              placeholder="e.g. Winter 2026"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-700 dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
        </div>

        <div className="mb-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block text-neutral-500">Course</span>
            <input
              value={draft.courseName}
              onChange={(e) => updateField("courseName", e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-700 dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-neutral-500">Semester</span>
            <input
              value={draft.semester}
              onChange={(e) => updateField("semester", e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-700 dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] border-collapse text-left text-sm">
            <thead>
              <tr className="bg-neutral-100 dark:bg-neutral-900">
                <th className="border border-neutral-300 px-3 py-3 dark:border-neutral-700">
                  Sr. No.
                </th>
                <th className="border border-neutral-300 px-3 py-3 dark:border-neutral-700">
                  Subject Code
                </th>
                <th className="border border-neutral-300 px-3 py-3 dark:border-neutral-700">
                  Subject Name
                </th>
                <th className="border border-neutral-300 px-3 py-3 text-center dark:border-neutral-700">
                  Maximum Marks
                </th>
                <th className="border border-neutral-300 px-3 py-3 text-center dark:border-neutral-700">
                  Obtained Marks
                </th>
              </tr>
            </thead>

            <tbody>
              {draft.subjects.map((subject, index) => (
                <tr key={index}>
                  <td className="border border-neutral-300 px-3 py-3 dark:border-neutral-700">
                    {index + 1}
                  </td>

                  <td className="border border-neutral-300 px-2 py-2 dark:border-neutral-700">
                    <input
                      aria-label={`Subject ${index + 1} code`}
                      value={subject.code}
                      onChange={(e) =>
                        updateSubject(index, "code", e.target.value)
                      }
                      className="w-24 rounded border border-neutral-200 px-2 py-2 dark:border-neutral-700 dark:bg-neutral-900"
                    />
                  </td>

                  <td className="border border-neutral-300 px-2 py-2 dark:border-neutral-700">
                    <input
                      aria-label={`Subject ${index + 1} name`}
                      value={subject.name}
                      onChange={(e) =>
                        updateSubject(index, "name", e.target.value)
                      }
                      className="w-full min-w-48 rounded border border-neutral-200 px-2 py-2 dark:border-neutral-700 dark:bg-neutral-900"
                    />

                    {index === 5 && (
                      <select
                        aria-label="Choose elective"
                        value={
                          Object.keys(electives).find(
                            (key) => electives[key].code === subject.code
                          ) ?? "ACN"
                        }
                        onChange={(e) => updateElective(e.target.value)}
                        className="mt-2 w-full rounded border border-neutral-200 px-2 py-2 dark:border-neutral-700 dark:bg-neutral-900 cursor-pointer"
                      >
                        <option value="ACN">ACN — Advance Computer Network</option>
                        <option value="CLC">CLC — Cloud Computing</option>
                        <option value="DAN">DAN — Data Analytics</option>
                      </select>
                    )}
                  </td>

                  <td className="border border-neutral-300 px-3 py-3 text-center dark:border-neutral-700">
                    {subject.maxMarks}
                  </td>

                  <td className="border border-neutral-300 px-2 py-2 dark:border-neutral-700">
                    <input
                      aria-label={`Marks obtained for ${subject.name}`}
                      type="number"
                      min={0}
                      max={subject.maxMarks}
                      step={1}
                      value={subject.obtainedMarks}
                      onChange={(e) =>
                        updateSubject(
                          index,
                          "obtainedMarks",
                          e.target.value
                        )
                      }
                      className="mx-auto block w-24 rounded border border-neutral-200 px-2 py-2 text-center dark:border-neutral-700 dark:bg-neutral-900"
                    />
                    <p className="mt-1 text-center text-xs text-neutral-500">
                      Out of {subject.maxMarks}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>

            <tfoot>
              <tr className="bg-neutral-100 font-semibold dark:bg-neutral-900">
                <td
                  colSpan={3}
                  className="border border-neutral-300 px-3 py-3 dark:border-neutral-700"
                >
                  Grand Total
                </td>
                <td className="border border-neutral-300 px-3 py-3 text-center dark:border-neutral-700">
                  {totalMaximum}
                </td>
                <td className="border border-neutral-300 px-3 py-3 text-center dark:border-neutral-700">
                  {totalObtained}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
            <p className="text-sm text-neutral-500">Maximum Marks</p>
            <p className="mt-1 text-2xl font-semibold">{totalMaximum}</p>
          </div>

          <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
            <p className="text-sm text-neutral-500">Marks Obtained</p>
            <p className="mt-1 text-2xl font-semibold">{totalObtained}</p>
          </div>

          <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
            <p className="text-sm text-neutral-500">Predicted Percentage</p>
            <p className="mt-1 text-2xl font-semibold">
              {percentage.toFixed(2)}%
            </p>
          </div>
        </div>

        <p className="mt-6 text-xs text-neutral-500">
          This editable document is for personal academic planning. Marks,
          totals, and percentage are estimates based on the values entered.
        </p>
      </section>
    </main>
  );
}
export { PredictedResult };
