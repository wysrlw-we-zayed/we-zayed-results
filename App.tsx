
import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import StudentSearch from './components/StudentSearch';
import ResultDisplay from './components/ResultDisplay';
import FileUpload from './components/FileUpload';
import GeminiChat from './components/GeminiChat';
import { Student } from './types';
import * as XLSX from 'xlsx';

/**
 * رابط Google Sheets المنشور بصيغة CSV لمدرسة WE-Zayed
 */
const DEFAULT_CLOUD_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ9_AL-QBMHK96tvzqEeCvMl3jgxx1kP5Wi8yT3BfgzUm47nk81hGs3cCfdp4kcfA/pub?output=csv"; 

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
    const normalize = (str: any) => String(str || "").trim().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/[ىي]/g, 'ي').replace(/\s+/g, '').toLowerCase();
    
    const findVal = (row: any, search: string[]) => {
      const keys = Object.keys(row);
      const target = search.map(normalize);
      const found = keys.find(k => target.some(t => normalize(k).includes(t)));
      return found ? row[found] : null;
    };

    workbook.SheetNames.forEach(sName => {
      const data = XLSX.utils.sheet_to_json(workbook.Sheets[sName]) as any[];
      const isGrade2 = normalize(sName).includes('two') || normalize(sName).includes('ثاني');
      const gradeLevel: '1' | '2' = isGrade2 ? '2' : '1';

      const mapped = data.map((row, idx): Student | null => {
        const nid = String(findVal(row, ["الرقم القومي", "ID", "National"]) || "").replace(/\D/g, '');
        if (nid.length < 10) return null;
        
        const subs = [
          { n: "اللغة العربية", s: ["عربي", "Arabic"] },
          { n: "التربية الدينية", s: ["دين", "Religion"] },
          { n: "Advanced Math", s: ["Math", "رياضيات"] },
          { n: "التربية الوطنية", s: ["وطنيه", "National", "التربية الوطنية", "التربيه الوطنيه"] },
          { n: "Advanced Physics", s: ["Physics", "فيزياء"] },
          { n: "الدراسات الفنية التخصصية النظرية", s: ["فنيه", "Technical"] },
          { n: "Advanced English", s: ["انجليزي", "English"] }
        ];

        return {
          id: `${gradeLevel}-${idx}-${Date.now()}`,
          name: String(findVal(row, ["الاسم", "Name", "اسم الطالب"]) || "طالب"),
          seatingNumber: String(findVal(row, ["جلوس", "Seating", "رقم الجلوس"]) || "0"),
          nationalId: nid,
          class: String(findVal(row, ["فصل", "Class", "الفصل"]) || "-"),
          gradeLevel: gradeLevel,
          specialization: "Programming",
          grades: subs.map(s => {
            const val = findVal(row, s.s);
            const score = val !== null ? Number(val) : 0;
            return { 
              name: s.n, 
              score: isNaN(score) ? 0 : score, 
              maxScore: 50, 
              status: score >= 25 ? 'Pass' : 'Fail' 
            };
          }),
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
      const separator = url.includes('?') ? '&' : '?';
      const finalUrl = `${url}${separator}nocache=${Date.now()}`;
      
      const res = await fetch(finalUrl);
      if (!res.ok) throw new Error("فشل الاتصال");
      
      const text = await res.text();
      const wb = XLSX.read(text, { type: 'string' });
      const students = processData(wb);
      
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
                  <span>جاري تحديث البيانات من السحابة...</span>
                </div>
              )}
            </div>

            {isAdminMode ? (
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="bg-white p-8 rounded-3xl shadow-xl border border-purple-100">
                  <h3 className="font-black mb-4 text-gray-800">إعدادات الربط السحابي</h3>
                  <p className="text-xs text-gray-500 mb-4">يتم سحب البيانات حالياً من Google Sheets تلقائياً.</p>
                  <input 
                    type="text" 
                    value={cloudUrl} 
                    onChange={e => setCloudUrl(e.target.value)} 
                    placeholder="رابط CSV المنشور..." 
                    className="w-full p-4 bg-gray-50 rounded-2xl mb-4 border border-gray-200 focus:ring-2 focus:ring-purple-200 outline-none" 
                  />
                  <button onClick={() => fetchCloudData(cloudUrl)} className="w-full bg-[#4b0082] text-white py-4 rounded-2xl font-bold hover:shadow-lg transition-shadow">تحديث المصدر لجميع الطلاب</button>
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
