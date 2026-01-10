
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
          id: `${conf.l}-${idx}-${Date.now()}`,
          name: String(findVal(row, ["الاسم", "Name"]) || "طالب"),
          seatingNumber: String(findVal(row, ["جلوس", "Seating"]) || "0"),
          nationalId: nid,
          class: String(findVal(row, ["فصل", "Class"]) || "-"),
          gradeLevel: conf.l,
          specialization: "Programming",
          grades: subs.map(s => ({ 
            name: s.n, 
            score: Number(findVal(row, s.s) || 0), 
            maxScore: 50, 
            status: Number(findVal(row, s.s)) >= 25 ? 'Pass' : 'Fail' 
          })),
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
      // إضافة تذييل للرابط لمنع التخزين المؤقت (Cache Busting)
      const separator = url.includes('?') ? '&' : '?';
      const finalUrl = `${url}${separator}t=${Date.now()}`;
      
      const res = await fetch(finalUrl);
      if (!res.ok) throw new Error("فشل الاتصال بجوجل شيت");
      
      const ab = await res.arrayBuffer();
      const wb = XLSX.read(new Uint8Array(ab), { type: 'array' });
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
    const saved = localStorage.getItem('we_zayed_students');
    const storedUrl = localStorage.getItem('we_zayed_cloud_url');
    
    if (storedUrl) {
      fetchCloudData(storedUrl);
    } else if (saved) {
      try {
        setAllStudents(JSON.parse(saved));
      } catch(e) {}
    }
  }, [fetchCloudData]);

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '1234') { setIsAdminMode(true); setShowPassModal(false); setPassword(''); }
    else { setPassError(true); setTimeout(() => setPassError(false), 2000); }
  };

  const saveCloudUrl = () => {
    if (!cloudUrl.includes('pub?output=csv')) {
      alert("تنبيه: تأكد أن الرابط ينتهي بـ pub?output=csv ليتمكن الموقع من قراءة البيانات.");
    }
    localStorage.setItem('we_zayed_cloud_url', cloudUrl);
    fetchCloudData(cloudUrl);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 relative font-['Cairo']">
      <Header onHomeClick={handleBackToSearch} showHomeLink={!!selectedStudent} />
      
      <button onClick={() => isAdminMode ? setIsAdminMode(false) : setShowPassModal(true)} className="fixed top-24 left-6 z-40 p-3 bg-white rounded-full shadow-lg text-gray-400 hover:text-purple-600 transition-colors">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
      </button>

      {showPassModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="bg-white p-8 rounded-3xl w-full max-w-xs shadow-2xl animate-fadeIn">
            <h3 className="text-center font-black mb-4">لوحة التحكم</h3>
            <form onSubmit={handleAdminAuth} className="space-y-4">
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className={`w-full p-3 bg-gray-100 rounded-xl text-center outline-none border-2 ${passError ? 'border-red-500' : 'border-transparent'}`} placeholder="كلمة المرور" autoFocus />
              <button className="w-full bg-[#4b0082] text-white py-3 rounded-xl font-bold">دخول</button>
              <button type="button" onClick={() => setShowPassModal(false)} className="w-full text-gray-400 text-sm">إلغاء</button>
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
              <h2 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">بوابة نتائج مدرسة WE زايد</h2>
              <p className="text-gray-500">استعلم عن نتيجتك الرسمية باستخدام الرقم القومي</p>
              {isLoadingCloud && (
                <div className="mt-6 flex items-center justify-center gap-2 text-[#e60000] font-bold">
                  <div className="w-4 h-4 border-2 border-[#e60000] border-t-transparent rounded-full animate-spin"></div>
                  <span>جاري تحديث البيانات من السحابة...</span>
                </div>
              )}
            </div>

            {isAdminMode ? (
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="bg-white p-8 rounded-3xl shadow-xl border border-purple-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-purple-100 p-2 rounded-lg text-[#4b0082]">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    </div>
                    <h3 className="font-black text-lg text-gray-800">مزامنة Google Sheets</h3>
                  </div>
                  <p className="text-sm text-gray-500 mb-6">تأكد من اختيار صيغة CSV عند النشر على الويب لضمان عمل المزامنة.</p>
                  <div className="flex flex-col md:flex-row gap-3">
                    <input 
                      type="text" 
                      value={cloudUrl} 
                      onChange={e => setCloudUrl(e.target.value)} 
                      placeholder="رابط CSV المباشر..." 
                      className="flex-1 p-4 bg-gray-50 rounded-2xl border border-gray-200 text-sm outline-none focus:border-purple-600 transition-colors" 
                    />
                    <button onClick={saveCloudUrl} className="bg-[#4b0082] text-white px-8 py-4 rounded-2xl font-bold shadow-lg hover:bg-[#390066] transition-all">
                      حفظ وتحديث
                    </button>
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
