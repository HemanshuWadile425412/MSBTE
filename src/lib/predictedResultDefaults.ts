import type { SubjectMarksheetData, PredictedResult } from '../types';

export interface ElectiveOption {
  code: string;
  abbr: string;
  name: string;
  max: number;
}

export const ELECTIVE_OPTIONS: ElectiveOption[] = [
  { code: '315326', abbr: 'DAN', name: 'Data Analytics', max: 150 },
  { code: '315321', abbr: 'ACN', name: 'Advance Computer Network', max: 150 },
  { code: '315325', abbr: 'CLC', name: 'Cloud Computing', max: 150 },
];

export function getElectiveSubjectData(electiveCode: string): SubjectMarksheetData {
  const chosen = ELECTIVE_OPTIONS.find((e) => e.code === electiveCode) || ELECTIVE_OPTIONS[0];

  return {
    code: chosen.code,
    abbr: chosen.abbr,
    name: chosen.name,
    isElective: true,
    heads: [
      {
        name: 'TH-ESE',
        title: 'Theory End Semester',
        maxMarks: 70,
        minMarks: 28,
        obtainedMarks: 50,
      },
      {
        name: 'TH-PA',
        title: 'Theory Progressive Assessment (Test)',
        maxMarks: 30,
        minMarks: 0,
        obtainedMarks: 24,
      },
      {
        name: 'PR-PA',
        title: 'Practical / Term Work Assessment',
        maxMarks: 50,
        minMarks: 20,
        obtainedMarks: 44,
      },
    ],
    totalMax: 150,
    totalObtained: 118,
    isPassed: true,
  };
}

export function getDefaultSubjects(electiveCode: string = '315326'): SubjectMarksheetData[] {
  const fixedSubjects: SubjectMarksheetData[] = [
    {
      code: '315319',
      abbr: 'OSY',
      name: 'Operating System',
      isElective: false,
      heads: [
        {
          name: 'TH-ESE',
          title: 'Theory End Semester',
          maxMarks: 70,
          minMarks: 28,
          obtainedMarks: 54,
        },
        {
          name: 'TH-PA',
          title: 'Theory Progressive Assessment (Test)',
          maxMarks: 30,
          minMarks: 0,
          obtainedMarks: 25,
        },
        {
          name: 'PR-ESE',
          title: 'Practical End Semester (Viva)',
          maxMarks: 25,
          minMarks: 10,
          obtainedMarks: 21,
        },
        {
          name: 'PR-PA',
          title: 'Practical Term Work',
          maxMarks: 50,
          minMarks: 20,
          obtainedMarks: 45,
        },
      ],
      totalMax: 175,
      totalObtained: 145,
      isPassed: true,
    },
    {
      code: '315323',
      abbr: 'STE',
      name: 'Software Engineering',
      isElective: false,
      heads: [
        {
          name: 'TH-ESE',
          title: 'Theory End Semester',
          maxMarks: 70,
          minMarks: 28,
          obtainedMarks: 52,
        },
        {
          name: 'TH-PA',
          title: 'Theory Progressive Assessment (Test)',
          maxMarks: 30,
          minMarks: 0,
          obtainedMarks: 26,
        },
        {
          name: 'PR-ESE',
          title: 'Practical End Semester (Viva)',
          maxMarks: 25,
          minMarks: 10,
          obtainedMarks: 20,
        },
        {
          name: 'PR-PA',
          title: 'Practical Term Work',
          maxMarks: 50,
          minMarks: 20,
          obtainedMarks: 44,
        },
      ],
      totalMax: 175,
      totalObtained: 142,
      isPassed: true,
    },
    {
      code: '315002',
      abbr: 'ENDS',
      name: 'Entrepreneurship Development and Startups',
      isElective: false,
      heads: [
        {
          name: 'PR-ESE',
          title: 'Practical / Business Pitch (Oral)',
          maxMarks: 25,
          minMarks: 10,
          obtainedMarks: 22,
        },
        {
          name: 'PR-PA',
          title: 'Term Work (Business Model)',
          maxMarks: 50,
          minMarks: 20,
          obtainedMarks: 46,
        },
      ],
      totalMax: 75,
      totalObtained: 68,
      isPassed: true,
    },
    {
      code: '315003',
      abbr: 'SPI',
      name: 'Seminar and Project Initiation Course',
      isElective: false,
      heads: [
        {
          name: 'PR-ESE',
          title: 'Seminar Presentation & Oral',
          maxMarks: 25,
          minMarks: 10,
          obtainedMarks: 23,
        },
        {
          name: 'PR-PA',
          title: 'Project Synopsis & Report',
          maxMarks: 50,
          minMarks: 20,
          obtainedMarks: 45,
        },
      ],
      totalMax: 75,
      totalObtained: 68,
      isPassed: true,
    },
    {
      code: '315004',
      abbr: 'INT',
      name: 'Internship (12 Weeks)',
      isElective: false,
      heads: [
        {
          name: 'PR-ESE',
          title: 'Industry Evaluation & External Viva',
          maxMarks: 100,
          minMarks: 40,
          obtainedMarks: 90,
        },
        {
          name: 'PR-PA',
          title: 'Institute Mentor Assessment & Logbook',
          maxMarks: 100,
          minMarks: 40,
          obtainedMarks: 92,
        },
      ],
      totalMax: 200,
      totalObtained: 182,
      isPassed: true,
    },
  ];

  const electiveSubject = getElectiveSubjectData(electiveCode);
  return [...fixedSubjects, electiveSubject];
}

export function calculateMarksheet(
  subjects: SubjectMarksheetData[]
): {
  recalculatedSubjects: SubjectMarksheetData[];
  overallMax: number;
  overallObtained: number;
  percentage: number;
  resultClass: string;
} {
  let hasAnyBacklog = false;
  let overallMax = 0;
  let overallObtained = 0;

  const recalculatedSubjects = subjects.map((sub) => {
    let subMax = 0;
    let subObtained = 0;
    let subPassed = true;

    const recalculatedHeads = sub.heads.map((head) => {
      const obt = head.obtainedMarks !== null ? Math.max(0, head.obtainedMarks) : 0;
      subMax += head.maxMarks;
      subObtained += obt;

      if (head.minMarks > 0 && obt < head.minMarks) {
        subPassed = false;
      }
      return head;
    });

    // Subject 40% aggregate passing threshold
    if (subObtained < Math.ceil(subMax * 0.4)) {
      subPassed = false;
    }

    if (!subPassed) {
      hasAnyBacklog = true;
    }

    overallMax += subMax;
    overallObtained += subObtained;

    return {
      ...sub,
      heads: recalculatedHeads,
      totalMax: subMax,
      totalObtained: subObtained,
      isPassed: subPassed,
    };
  });

  const percentage = overallMax > 0 ? Number(((overallObtained / overallMax) * 100).toFixed(2)) : 0;

  let resultClass = 'PASS CLASS';
  if (hasAnyBacklog) {
    resultClass = 'FAIL (BACKLOG / ATKT)';
  } else if (percentage >= 75) {
    resultClass = 'FIRST CLASS WITH DISTINCTION';
  } else if (percentage >= 60) {
    resultClass = 'FIRST CLASS';
  } else if (percentage >= 50) {
    resultClass = 'SECOND CLASS';
  } else if (percentage >= 40) {
    resultClass = 'PASS CLASS';
  } else {
    resultClass = 'FAIL';
  }

  return {
    recalculatedSubjects,
    overallMax,
    overallObtained,
    percentage,
    resultClass,
  };
}

export function createDefaultPredictedResult(userId: string): PredictedResult {
  const defaultElective = '315326';
  const subjects = getDefaultSubjects(defaultElective);
  const { recalculatedSubjects, overallMax, overallObtained, percentage, resultClass } =
    calculateMarksheet(subjects);

  return {
    user_id: userId,
    student_name: '',
    enrollment_no: '',
    seat_no: '',
    exam_session: 'Winter 2026',
    course_semester: 'Diploma in Computer Engineering - Semester V',
    elective_code: defaultElective,
    subjects_data: recalculatedSubjects,
    overall_max: overallMax,
    overall_obtained: overallObtained,
    percentage,
    result_class: resultClass,
  };
}
