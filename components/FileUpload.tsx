
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
    return String(str).trim()
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/[ىي]/g, 'ي')
      .replace(/[\u064B-\u0652]/g, '')
      .replace(/\s+/g, '')
      .toLowerCase();
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
        let allParsed: Student[] = [];

        workbook.SheetNames.forEach(sName => {
          const sNameNorm = normalize(sName);
          let gradeLevel: '1' | '2' | null = null;
          if (sNameNorm.includes('one') || sNameNorm.includes('اول')) gradeLevel = '1';
          else if (sNameNorm.includes('two') || sNameNorm.includes('ثاني')) gradeLevel = '2';

          if (!gradeLevel) return;

          const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sName], { header: 1 }) as any[][];
          
          let headerRowIndex = -1;
          for (let i = 0; i < Math.min(rawRows.length, 20); i++) {
            const rowStr = rawRows[i].map(c => normalize(c)).join("|");
            if (rowStr.includes("الاسم") && (rowStr.includes("القومي") || rowStr.includes("id"))) {
              headerRowIndex = i;
              break;
            }
          }

          if (headerRowIndex === -1) return;

          const headers = rawRows[headerRowIndex].map(h => normalize(h));
          const dataRows = rawRows.slice(headerRowIndex + 1);

          const students = dataRows.map((row, idx): Student | null => {
            const getValue = (keywords: string[]) => {
              const colIndex = headers.findIndex(h => keywords.some(k => h.includes(normalize(k))));
              return colIndex !== -1 ? row[colIndex] : null;
            };

            const nidRaw = getValue(["الرقم القومي", "القومي", "national", "id"]);
            const nid = String(nidRaw || "").replace(/\D/g, '');
            if (nid.length < 10) return null;

            const studentNameRaw = getValue(["الاسم", "name", "الطالب"]);
            const studentName = studentNameRaw ? String(studentNameRaw).trim() : `طالب ${idx + 1}`;

            let subjects = [];
            if (gradeLevel === '1') {
              subjects = [
                { name: "اللغة العربية", k: ["عربي", "arabic"] },
                { name: "التربية الدينية", k: ["دين", "religion"] },
                { name: "Advanced Math", k: ["math", "رياضيات"] },
                { name: "التربية الوطنية", k: ["وطنيه", "national", "التربية الوطنية"] },
                { name: "Advanced Physics", k: ["physics", "فيزياء"] },
                { name: "الدراسات الفنية التخصصية النظرية", k: ["فنيه", "technical"] },
                { name: "Advanced English", k: ["انجليزي", "english"] }
              ];
            } else {
              subjects = [
                { name: "اللغة العربية", k: ["عربي", "arabic"] },
                { name: "التربية الدينية", k: ["دين", "religion"] },
                { name: "الدراسات الاجتماعية", k: ["دراسات", "social"] },
                { name: "Advanced Physics", k: ["physics", "فيزياء"] },
                { name: "Advanced English", k: ["انجليزي", "english"] },
                { name: "Advanced Math", k: ["math", "رياضيات"] },
                { name: "الدراسات الفنية التخصصية النظرية", k: ["فنيه", "technical"] }
              ];
            }

            const grades: SubjectGrade[] = subjects.map(s => {
              const val = getValue(s.k);
              const score = (val !== undefined && val !== null && val !== "") ? Number(val) : 0;
              return { name: s.name, score: isNaN(score) ? 0 : score, maxScore: 50, status: score >= 25 ? 'Pass' : 'Fail' };
            });

            return {
              id: `${gradeLevel}-${idx}-${Date.now()}`,
              name: studentName,
              seatingNumber: String(getValue(["جلوس", "seating", "رقم الجلوس"]) || "0"),
              nationalId: nid,
              class: String(getValue(["فصل", "class", "الفصل"]) || "-"),
              gradeLevel: gradeLevel as '1' | '2',
              specialization: "Programming",
              grades,
              gpa: 0
            };
          }).filter((s): s is Student => s !== null);
          allParsed = [...allParsed, ...students];
        });

        if (allParsed.length > 0) {
          onDataLoaded(allParsed);
          alert(`تم استيراد ${allParsed.length} طالب بنجاح.`);
        }
      } catch (err) {
        alert("خطأ في معالجة الملف.");
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="bg-white border-4 border-dashed border-gray-200 rounded-3xl p-12 text-center hover:border-[#4b0082] transition-all group relative overflow-hidden">
      <input type="file" id="up" hidden onChange={handleFile} accept=".xlsx, .xls" />
      <label htmlFor="up" className="cursor-pointer">
        <div className="bg-purple-50 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:rotate-12 transition-transform">
          <svg className="w-10 h-10 text-[#4b0082]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <p className="text-xl font-black text-gray-800">رفع ملف Excel محلي</p>
        <p className="text-sm text-gray-400 mt-2">تأكد أن الشيتات تحتوي على أسماء الصفوف (Grade one / Grade two)</p>
      </label>
      {isUploading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-[#4b0082] border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
