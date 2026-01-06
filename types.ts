
export interface SubjectGrade {
  name: string;
  score: number;
  maxScore: number;
  status: 'Pass' | 'Fail';
}

export interface Student {
  id: string;
  name: string;
  seatingNumber: string;
  nationalId: string;
  class: string;
  gradeLevel: '1' | '2'; // Added to distinguish between sheets
  specialization: 'Networks' | 'Telecom' | 'Programming';
  grades: SubjectGrade[];
  gpa: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
