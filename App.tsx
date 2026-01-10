
import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import StudentSearch from './components/StudentSearch';
import ResultDisplay from './components/ResultDisplay';
import FileUpload from './components/FileUpload';
import GeminiChat from './components/GeminiChat';
import { Student } from './types';
import { MOCK_STUDENTS } from './constants';
import * as XLSX from 'xlsx';

const App: React.FC = () => {
  const [allStudents, setAllStudents] = useState<Student[]>(MOCK_STUDENTS);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [password, setPassword] = useState('');
  const [passError, setPassError] = useState(false);
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);
  const [cloudUrl, setCloudUrl] = useState(localStorage.getItem('we_zayed_cloud_url') || '');

  // Fixed: Added handleBackToSearch function
  const handleBackToSearch = () => {
    setSelectedStudent(null);
  };

  // Fixed: Added handleDataLoaded function
  const handleDataLoaded = (students: Student[]) => {
    setAllStudents(students);
    localStorage.setItem('we_zayed_students', JSON.stringify(students));
  };

  // وظيفة معالجة البيانات الموحدة
  const processData = useCallback((workbook: XLSX.WorkBook) => {
    let allParsed: Student[] = [];
    const normalize = (str: any) => String(str || "").trim().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/[ىي]/g, 'ي').replace(/\s+/g, '').toLowerCase();
    
    const findVal = (row: any, search: string[]) => {
      const keys = Object.keys(row);
      const target = search.map(normalize);
      const found = keys.find(k => target.some(t => normalize(k).includes(t)));
      return found ? row[found] : null;
    };

    const configs = [{ n: "Grade one", l: '1' as const }, { n: "Grade two", l: '2' as const }];
    
    configs.forEach(conf => {
      const sName = workbook.SheetNames.find(n => normalize(n).includes(normalize(conf.n)));
      if (!sName) return;
      const data = XLSX.utils.sheet_to_json(workbook.Sheets[sName]) as any[];
      
      const mapped = data.map((row, idx): Student | null => {
        const nid = String(findVal(row, ["الرقم القومي", "ID", "National"]) || "").replace(/\D/g, '');
        if (nid.length < 10) return null;
        
        const subs = [
          { n: "اللغة العربية", s: ["عربي", "Arabic"] },
          { n: "التربية الدينية", s: ["دين", "Religion"] },
          { n: "Advanced Math", s: ["Math", "رياضيات"] },
          { n: "التربية الوطنية", s: ["وطنيه", "National"] },
          { n: "Advanced Physics", s: ["Physics", "فيزياء"] },
          { n: "الدراسات الفنية", s: ["فنيه", "Technical"] },
          { n: "Advanced English", s: ["انجليزي", "English"] }
        ];

        return {
          id: `${conf.l}-${idx}`,
          name: String(findVal(row, ["الاسم", "Name"]) || "طالب"),
          seatingNumber: String(findVal(row, ["جلوس", "Seating"]) || "0"),
          nationalId: nid,
          class: String(findVal(row, ["فصل", "Class"]) || "-"),
          gradeLevel: conf.l,
          specialization: "Programming",
          grades: subs.map(s => ({ name: s.n, score: Number(findVal(row, s.s) || 0), maxScore: 50, status: Number(findVal(row, s.s)) >= 25 ? 'Pass' : 'Fail' })),
          gpa: 0
        };
      }).filter((s): s is Student => s !== null);
      allParsed = [...allParsed, ...mapped];
    });
    return allParsed;
  }, []);

  const fetchCloudData = useCallback(async (url: string) => {
    if (!url.startsWith('http')) return;
    setIsLoadingCloud(true);
    try {
      const res = await fetch(url);
      const ab = await res.arrayBuffer();
      const wb = XLSX.read(new Uint8Array(ab), { type: 'array' });
      const students = processData(wb);
      if (students.length > 0) {
        setAllStudents(students);
        console.log("Cloud Sync Success:", students.length);
      }
    } catch (e) {
      console.error("Sync Error", e);
    } finally {
      setIsLoadingCloud(false);
    }
  }, [processData]);

  useEffect(() => {
    const saved = localStorage.getItem('we_zayed_students');
    if (cloudUrl) {
      fetchCloudData(cloudUrl);
    } else if (saved) {
      setAllStudents(JSON.parse(saved));
    }
  }, [cloudUrl, fetchCloudData]);

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '1234') { setIsAdminMode(true); setShowPassModal(false); setPassword(''); }
    else { setPassError(true); setTimeout(() => setPassError(false), 2000); }
  };

  const saveCloudUrl = () => {
    localStorage.setItem('we_zayed_cloud_url', cloudUrl);
    fetchCloudData(cloudUrl);
    alert("تم حفظ رابط المزامنة السحابية بنجاح.");
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 relative font-['Cairo']">
      <Header onHomeClick={handleBackToSearch} showHomeLink={!!selectedStudent} />
      
      <button onClick={() => isAdminMode ? setIsAdminMode(false) : setShowPassModal(true)} className="fixed top-24 left-6 z-40 p-3 bg-white rounded-full shadow-lg text-gray-400">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
      </button>

      {showPassModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="bg-white p-8 rounded-3xl w-full max-w-xs shadow-2xl">
            <h3 className="text-center font-black mb-4">كلمة مرور الإدارة</h3>
            <form onSubmit={handleAdminAuth} className="space-y-4">
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 bg-gray-100 rounded-xl text-center outline-none border-2 border-transparent focus:border-purple-600" autoFocus />
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
              <h2 className="text-4xl font-black text-gray-900 mb-2">بوابة نتائج مدرسة WE زايد</h2>
              <p className="text-gray-500">استعلم عن نتائجك الرسمية بسهولة وأمان</p>
              {isLoadingCloud && <div className="mt-4 text-[#e60000] font-bold animate-pulse">جاري تحديث البيانات من السحابة...</div>}
            </div>

            {isAdminMode ? (
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                  <h3 className="font-black text-[#4b0082] mb-4">الربط مع Google Sheets</h3>
                  <p className="text-xs text-gray-500 mb-4">انسخ رابط "Publish as CSV" من جوجل شيت هنا ليتم تحديث الموقع تلقائياً للطلاب.</p>
                  <div className="flex gap-2">
                    <input type="text" value={cloudUrl} onChange={e => setCloudUrl(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/.../pub?output=csv" className="flex-1 p-3 bg-gray-50 rounded-xl border border-gray-200 text-sm outline-none" />
                    <button onClick={saveCloudUrl} className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold text-sm">حفظ</button>
                  </div>
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
