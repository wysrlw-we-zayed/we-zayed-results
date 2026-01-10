
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Student, SubjectGrade } from '../types';

interface FileUploadProps {
  onDataLoaded: (students: Student[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded }) => {
  const [isUploading, setIsUploading] = useState(false);

  const normalize = (str: any) => {
    if (!str) return "";
    return str.toString().trim()
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/[ىي]/g, 'ي')
      .replace(/\s+/g, '')
      .toLowerCase();
  };

  const findValue = (row: any, keys: string[]) => {
    const rowKeys = Object.keys(row);
    const targetKeys = keys.map(normalize);
    
    const actualKey = rowKeys.find(rk => {
      const nrk = normalize(rk);
      return targetKeys.some(tk => nrk.includes(tk) || tk.includes(nrk));
    });
    
    return actualKey ? row[actualKey] : null;
  };

  const processWorkbook = (workbook: XLSX.WorkBook) => {
    let allStudents: Student[] = [];
    
    const configs = [
      { name: "Grade one", level: '1' as const },
      { name: "Grade two", level: '2' as const }
    ];

    configs.forEach(config => {
      const sheetName = workbook.SheetNames.find(n => normalize(n).includes(normalize(config.name)));
      if (!sheetName) return;

      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet) as any[];

      const students = data.map((row, idx): Student | null => {
        const nationalId = String(findValue(row, ["الرقم القومي", "National ID", "ID"]) || "").replace(/\D/g, '');
        if (nationalId.length < 10) return null;

        const subjects = [
          { name: "اللغة العربية", search: ["عربي", "Arabic"] },
          { name: "التربية الدينية", search: ["دين", "Religion"] },
          { name: "Advanced Math", search: ["Math", "رياضيات"] },
          { name: "التربية الوطنية", search: ["وطنيه", "National"] },
          { name: "Advanced Physics", search: ["Physics", "فيزياء"] },
          { name: "الدراسات الفنية", search: ["الفنيه", "Technical"] },
          { name: "Advanced English", search: ["انجليزي", "English"] }
        ];

        const grades: SubjectGrade[] = subjects.map(s => {
          const val = findValue(row, s.search);
          const score = val !== null ? Number(val) : 0;
          return {
            name: s.name,
            score: isNaN(score) ? 0 : score,
            maxScore: 50,
            status: score >= 25 ? 'Pass' : 'Fail'
          };
        });

        return {
          id: `${config.level}-${idx}-${Date.now()}`,
          name: String(findValue(row, ["الاسم", "Name", "اسم الطالب"]) || "طالب غير معروف"),
          seatingNumber: String(findValue(row, ["رقم الجلوس", "Seating"]) || "000"),
          nationalId,
          class: String(findValue(row, ["الفصل", "Class"]) || "غير محدد"),
          gradeLevel: config.level,
          specialization: "Programming",
          grades,
          gpa: 0
        };
      }).filter((s): s is Student => s !== null);

      allStudents = [...allStudents, ...students];
    });

    return allStudents;
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const students = processWorkbook(workbook);
        
        if (students.length > 0) {
          onDataLoaded(students);
          alert(`تم بنجاح استيراد ${students.length} طالب.`);
        } else {
          alert("لم يتم العثور على بيانات صحيحة. تأكد من وجود شيتات باسم Grade one و Grade two.");
        }
      } catch (err) {
        alert("خطأ في قراءة الملف.");
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border-4 border-dashed border-gray-200 rounded-3xl p-12 text-center hover:border-[#4b0082] transition-all group relative overflow-hidden">
        <input type="file" id="up" hidden onChange={handleFile} accept=".xlsx, .xls" />
        <label htmlFor="up" className="cursor-pointer">
          <div className="bg-purple-50 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:rotate-12 transition-transform">
            <svg className="w-10 h-10 text-[#4b0082]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <p className="text-xl font-black text-gray-800">رفع ملف Excel محلي</p>
          <p className="text-sm text-gray-400 mt-2">سيتم حفظ البيانات في متصفحك الحالي</p>
        </label>
        {isUploading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-[#4b0082] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="bg-blue-500 text-white p-2 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="font-bold text-blue-900 mb-1">نصيحة للمشاركة العامة:</h4>
            <p className="text-sm text-blue-700 leading-relaxed">
              لجعل النتائج متاحة لجميع الطلاب تلقائياً، يفضل استخدام رابط Google Sheets المباشر. 
              (يمكنك طلب المساعدة لربط الموقع بـ Firebase لمزامنة دائمة).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
