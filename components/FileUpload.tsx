
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Student, SubjectGrade } from '../types';

interface FileUploadProps {
  onDataLoaded: (students: Student[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded }) => {
  const [isUploading, setIsUploading] = useState(false);

  const normalizeString = (str: string) => {
    if (!str) return "";
    return str
      .toString()
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/\s+/g, '')
      .trim()
      .toLowerCase();
  };

  const getVal = (row: any, searchTerms: string[]) => {
    const keys = Object.keys(row);
    const normalizedSearchTerms = searchTerms.map(normalizeString);
    
    const foundKey = keys.find(k => {
      const normalizedKey = normalizeString(k);
      return normalizedSearchTerms.some(term => 
        normalizedKey.includes(term) || term.includes(normalizedKey)
      );
    });
    
    return foundKey ? row[foundKey] : 0;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        let allParsedStudents: Student[] = [];

        // Definition of subjects for each grade
        const gradeConfigs = [
          {
            sheetName: "Grade one",
            level: '1' as const,
            subjects: [
              { name: "اللغة العربية", search: ["عربية", "اللغة العربية", "Arabic"] },
              { name: "التربية الدينية", search: ["دين", "دينية", "Religion"] },
              { name: "Advanced Math", search: ["Math", "رياضيات", "Advanced Math"] },
              { name: "التربية الوطنية", search: ["وطنية", "الوطنيه", "تربية وطنية", "National Education"] },
              { name: "Advanced Physics", search: ["Physics", "فيزياء", "Advanced Physics"] },
              { name: "الدراسات الفنية التخصصية النظرية", search: ["الدراسات الفنية", "تخصصية", "Technical Studies"] },
              { name: "Advanced English", search: ["انجليزي", "English", "Advanced English"] },
            ]
          },
          {
            sheetName: "Grade two",
            level: '2' as const,
            subjects: [
              { name: "اللغة العربية", search: ["عربية", "اللغة العربية", "Arabic"] },
              { name: "التربية الدينية", search: ["دين", "دينية", "Religion"] },
              { name: "الدراسات الاجتماعية", search: ["اجتماعية", "دراسات اجتماعية", "Social Studies"] },
              { name: "Advanced Physics", search: ["Physics", "فيزياء", "Advanced Physics"] },
              { name: "Advanced English", search: ["انجليزي", "English", "Advanced English"] },
              { name: "Advanced Math", search: ["Math", "رياضيات", "Advanced Math"] },
              { name: "الدراسات الفنية التخصصية النظرية", search: ["الدراسات الفنية", "تخصصية", "Technical Studies"] },
            ]
          }
        ];

        gradeConfigs.forEach(config => {
          const worksheet = workbook.Sheets[config.sheetName];
          if (!worksheet) return;

          const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];
          const students = jsonData.map((row, index): Student => {
            const grades: SubjectGrade[] = config.subjects.map(sub => {
              const score = Number(getVal(row, sub.search) || 0);
              return {
                name: sub.name,
                score: score,
                maxScore: 50,
                status: score >= 25 ? 'Pass' : 'Fail'
              };
            });

            const totalScore = grades.reduce((sum, g) => sum + g.score, 0);
            const gpa = (totalScore / (grades.length * 50)) * 4;

            return {
              id: `${config.level}-${index}`,
              name: String(getVal(row, ["اسم الطالب", "Name"]) || "بدون اسم"),
              seatingNumber: String(getVal(row, ["رقم الجلوس", "Seating Number"]) || ""),
              nationalId: String(getVal(row, ["الرقم القومي", "National ID"]) || "").replace(/\D/g, ''),
              class: String(getVal(row, ["الفصل", "Class"]) || ""),
              gradeLevel: config.level,
              specialization: "Programming" as const, // Fixed type mismatch
              grades: grades,
              gpa: parseFloat(gpa.toFixed(2))
            };
          });
          allParsedStudents = [...allParsedStudents, ...students];
        });

        if (allParsedStudents.length === 0) {
          throw new Error("لم يتم العثور على شيتات باسم Grade one أو Grade two");
        }

        onDataLoaded(allParsedStudents);
        alert(`تم بنجاح تحميل بيانات ${allParsedStudents.length} طالب من الصفين الأول والثاني.`);
      } catch (error) {
        console.error("Error parsing excel:", error);
        alert(`خطأ: ${error instanceof Error ? error.message : "فشل في قراءة الملف"}`);
      } finally {
        setIsUploading(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="bg-white border-2 border-dashed border-purple-200 rounded-2xl p-8 text-center hover:border-purple-400 transition-colors shadow-sm">
      <input type="file" id="excel-upload" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} />
      <label htmlFor="excel-upload" className="cursor-pointer block">
        <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-[#4b0082]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-800">تحميل ملف الإكسيل الشامل</h3>
        <p className="text-sm text-gray-500 mt-2 italic">يجب أن يحتوي الملف على شيت باسم "Grade one" وشيت باسم "Grade two"</p>
      </label>
      {isUploading && <p className="mt-4 text-purple-600 animate-pulse font-bold">جاري تحليل بيانات Grade 1 & Grade 2...</p>}
    </div>
  );
};

export default FileUpload;
