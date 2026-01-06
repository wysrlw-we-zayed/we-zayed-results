
import { Student } from './types';

export const MOCK_STUDENTS: Student[] = [
  {
    id: "1",
    name: "أحمد محمد علي",
    seatingNumber: "102030",
    nationalId: "29901011234567",
    class: "الصف الثاني الثانوي - فصل 1",
    gradeLevel: '1',
    specialization: "Programming",
    gpa: 3.8,
    grades: [
      { name: "اللغة العربية", score: 45, maxScore: 50, status: 'Pass' },
      { name: "التربية الدينية", score: 48, maxScore: 50, status: 'Pass' },
      { name: "Advanced Math", score: 42, maxScore: 50, status: 'Pass' },
      { name: "التربية الوطنية", score: 40, maxScore: 50, status: 'Pass' },
      { name: "Advanced Physics", score: 38, maxScore: 50, status: 'Pass' },
      { name: "الدراسات الفنية التخصصية النظرية", score: 44, maxScore: 50, status: 'Pass' },
      { name: "Advanced English", score: 46, maxScore: 50, status: 'Pass' }
    ]
  },
  {
    id: "2",
    name: "سارة محمود حسن",
    seatingNumber: "102031",
    nationalId: "30105151234568",
    class: "الصف الثاني الثانوي - فصل 2",
    gradeLevel: '2',
    specialization: "Networks",
    gpa: 3.9,
    grades: [
      { name: "اللغة العربية", score: 49, maxScore: 50, status: 'Pass' },
      { name: "التربية الدينية", score: 50, maxScore: 50, status: 'Pass' },
      { name: "Advanced Math", score: 47, maxScore: 50, status: 'Pass' },
      { name: "التربية الوطنية", score: 45, maxScore: 50, status: 'Pass' },
      { name: "Advanced Physics", score: 44, maxScore: 50, status: 'Pass' },
      { name: "الدراسات الفنية التخصصية النظرية", score: 48, maxScore: 50, status: 'Pass' },
      { name: "Advanced English", score: 49, maxScore: 50, status: 'Pass' }
    ]
  }
];

export const SCHOOL_THEME = {
  primary: "#4b0082", 
  secondary: "#e60000", 
  accent: "#ffcc00"
};
