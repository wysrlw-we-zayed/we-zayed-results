
import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import StudentSearch from './components/StudentSearch';
import ResultDisplay from './components/ResultDisplay';
import FileUpload from './components/FileUpload';
import GeminiChat from './components/GeminiChat';
import { Student, SubjectGrade } from './types';
import * as XLSX from 'xlsx';

const DEFAULT_CLOUD_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ9_AL-QBMHK96tvzqEeCvMl3jgxx1kP5Wi8yT3BfgzUm47nk81hGs3cCfdp4kcfA/pub?output=xlsx"; 

const App: React.FC = () => {
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [password, setPassword] = useState('');
  const [passError, setPassError] = useState(false);
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);
  const [cloudUrl, setCloudUrl] = useState(localStorage.getItem('we_zayed_cloud_url') || DEFAULT_CLOUD_URL);

  const handleBackToSearch = () => setSelectedStudent(null);
  
  const handleDataLoaded = (students: Student[]) => {
    setAllStudents(students);
    localStorage.setItem('we_zayed_students', JSON.stringify(students));
  };

  const processData = useCallback((workbook: XLSX.WorkBook) => {
    let allParsed: Student[] = [];
    
    // دالة تنظيف وتطبيع فائقة القوة
    const normalize = (str: any) => {
      if (str === null || str === undefined) return "";
      return String(str)
        .replace(/[\u064B-\u0652]/g, '') // إزالة التشكيل
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/[ىي]/g, 'ي')
        .replace(/[^a-zA-Z0-9\u0621-\u064A]/g, '') // إزالة أي رمز أو مسافة (حروف وأرقام فقط)
        .toLowerCase();
    };

    workbook.SheetNames.forEach(sName => {
      const sNameNorm = normalize(sName);
      let gradeLevel: '1' | '2' | null = null;
      if (sNameNorm.includes("one") || sNameNorm.includes("اول")) gradeLevel = '1';
      else if (sNameNorm.includes("two") || sNameNorm.includes("ثاني")) gradeLevel = '2';

      if (!gradeLevel) return;

      const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sName], { header: 1, defval: "" }) as any[][];
      
      // البحث عن صف العناوين بدقة
      let headerRowIndex = -1;
      const nameKeywords = ["الاسم", "name", "طالب", "تلميذ"];
      const idKeywords = ["قومي", "national", "id", "هويه"];

      for (let i = 0; i < Math.min(rawRows.length, 30); i++) {
        const rowData = rawRows[i].map(c => normalize(c));
        const hasName = nameKeywords.some(k => rowData.some(cell => cell.includes(normalize(k))));
        const hasId = idKeywords.some(k => rowData.some(cell => cell.includes(normalize(k))));
        if (hasName && hasId) {
          headerRowIndex = i;
          break;
        }
      }

      if (headerRowIndex === -1) return;

      const headers = rawRows[headerRowIndex].map(h => normalize(h));
      const dataRows = rawRows.slice(headerRowIndex + 1);

      const mapped = dataRows.map((row, idx): Student | null => {
        const getValue = (keywords: string[]) => {
          const normalizedK = keywords.map(normalize);
          const colIndex = headers.findIndex(h => normalizedK.some(k => h.includes(k)));
          return colIndex !== -1 ? row[colIndex] : null;
        };

        const nidRaw = getValue(["الرقم القومي", "القومي", "national", "id"]);
        const nid = String(nidRaw || "").replace(/\D/g, '');
        if (nid.length < 10) return null;

        const studentNameRaw = getValue(["الاسم", "name", "الطالب", "fullname"]);
        // التأكد من أن القيمة ليست فارغة قبل تعيين الاسم الافتراضي
        const studentName = (studentNameRaw && String(studentNameRaw).trim().length > 2) 
          ? String(studentNameRaw).trim() 
          : `طالب رقم ${idx + 1}`;

        let subs = gradeLevel === '1' ? [
          { n: "اللغة العربية", k: ["عربي", "arabic"] },
          { n: "التربية الدينية", k: ["دين", "religion"] },
          { n: "Advanced Math", k: ["math", "رياضيات"] },
          { n: "التربية الوطنية", k: ["وطنيه", "national", "التربية الوطنية"] },
          { n: "Advanced Physics", k: ["physics", "فيزياء"] },
          { n: "الدراسات الفنية التخصصية النظرية", k: ["فنيه", "technical"] },
          { n: "Advanced English", k: ["انجليزي", "english"] }
        ] : [
          { n: "اللغة العربية", k: ["عربي", "arabic"] },
          { n: "التربية الدينية", k: ["دين", "religion"] },
          { n: "الدراسات الاجتماعية", k: ["دراسات", "social"] },
          { n: "Advanced Physics", k: ["physics", "فيزياء"] },
          { n: "Advanced English", k: ["انجليزي", "english"] },
          { n: "Advanced Math", k: ["math", "رياضيات"] },
          { n: "الدراسات الفنية التخصصية النظرية", k: ["فنيه", "technical"] }
        ];

        const grades: SubjectGrade[] = subs.map(s => {
          const val = getValue(s.k);
          const score = (val !== undefined && val !== null && val !== "") ? Number(val) : 0;
          return { name: s.n, score: isNaN(score) ? 0 : score, maxScore: 50, status: score >= 25 ? 'Pass' : 'Fail' };
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

      allParsed = [...allParsed, ...mapped];
    });
    return allParsed;
  }, []);

  const fetchCloudData = useCallback(async (url: string) => {
    if (!url || !url.startsWith('http')) return;
    setIsLoadingCloud(true);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Cloud fetch failed");
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
      const students = processData(workbook);
      if (students.length > 0) {
        setAllStudents(students);
        localStorage.setItem('we_zayed_students', JSON.stringify(students));
      }
    } catch (e) {
      console.error("Cloud Sync Error:", e);
    } finally {
      setIsLoadingCloud(false);
    }
  }, [processData]);

  useEffect(() => {
    if (cloudUrl) {
      fetchCloudData(cloudUrl);
    } else {
      const saved = localStorage.getItem('we_zayed_students');
      if (saved) setAllStudents(JSON.parse(saved));
    }
  }, [cloudUrl, fetchCloudData]);

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '1234') { 
      setIsAdminMode(true); 
      setShowPassModal(false); 
      setPassword(''); 
    } else { 
      setPassError(true); 
      setTimeout(() => setPassError(false), 2000); 
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 relative font-['Cairo']">
      <Header onHomeClick={handleBackToSearch} showHomeLink={!!selectedStudent} />
      
      <button 
        onClick={() => isAdminMode ? setIsAdminMode(false) : setShowPassModal(true)} 
        className="fixed top-24 left-6 z-40 p-3 bg-white rounded-full shadow-lg text-gray-400 hover:text-purple-600 transition-colors no-print"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        </svg>
      </button>

      {showPassModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl w-full max-w-xs shadow-2xl">
            <h3 className="text-center font-black mb-4">لوحة التحكم</h3>
            <form onSubmit={handleAdminAuth} className="space-y-4">
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className={`w-full p-3 bg-gray-100 rounded-xl text-center outline-none border-2 ${passError ? 'border-red-500 text-red-500' : 'border-transparent'}`} 
                placeholder="كلمة المرور" 
                autoFocus 
              />
              <button className="w-full bg-[#4b0082] text-white py-3 rounded-xl font-bold">دخول</button>
            </form>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 pt-12">
        {selectedStudent ? (
          <ResultDisplay student={selectedStudent} onBack={handleBackToSearch} />
        ) : (
          <div className="animate-fadeIn">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-black text-gray-900 mb-2">مدرسة WE زايد</h2>
              <p className="text-gray-500 font-medium">نظام النتائج المركزي الموحد</p>
              {isLoadingCloud && (
                <div className="mt-6 flex items-center justify-center gap-2 text-[#e60000] font-bold">
                  <div className="w-2 h-2 bg-[#e60000] rounded-full animate-bounce"></div>
                  <span>جاري تحديث البيانات...</span>
                </div>
              )}
            </div>

            {isAdminMode ? (
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="bg-white p-8 rounded-3xl shadow-xl border border-purple-100">
                  <h3 className="font-black mb-4 text-gray-800">إعدادات المصدر السحابي</h3>
                  <input 
                    type="text" 
                    value={cloudUrl} 
                    onChange={e => setCloudUrl(e.target.value)} 
                    placeholder="رابط ملف XLSX..." 
                    className="w-full p-4 bg-gray-50 rounded-2xl mb-4 border border-gray-200 outline-none" 
                  />
                  <button onClick={() => fetchCloudData(cloudUrl)} className="w-full bg-[#4b0082] text-white py-4 rounded-2xl font-bold">تحديث البيانات الآن</button>
                </div>
                <FileUpload onDataLoaded={handleDataLoaded} />
              </div>
            ) : (
              <StudentSearch students={allStudents} onResultFound={setSelectedStudent} />
            )}
          </div>
        )}
      </main>
      <GeminiChat />
    </div>
  );
};

export default App;
