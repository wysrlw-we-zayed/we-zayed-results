
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import StudentSearch from './components/StudentSearch';
import ResultDisplay from './components/ResultDisplay';
import FileUpload from './components/FileUpload';
import { Student } from './types';
import { MOCK_STUDENTS } from './constants';

const App: React.FC = () => {
  const [allStudents, setAllStudents] = useState<Student[]>(MOCK_STUDENTS);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [password, setPassword] = useState('');
  const [passError, setPassError] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('we_zayed_students');
    if (saved) {
      try {
        setAllStudents(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load saved students", e);
      }
    }
  }, []);

  const handleDataLoaded = (students: Student[]) => {
    setAllStudents(students);
    localStorage.setItem('we_zayed_students', JSON.stringify(students));
    setIsAdminMode(false);
    setShowPassModal(false);
  };

  const handleBackToSearch = () => {
    setSelectedStudent(null);
    setIsAdminMode(false);
    setShowPassModal(false);
  };

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '1234') {
      setIsAdminMode(true);
      setShowPassModal(false);
      setPassword('');
      setPassError(false);
    } else {
      setPassError(true);
      setTimeout(() => setPassError(false), 2000);
    }
  };

  const toggleAdminTrigger = () => {
    if (isAdminMode) {
      setIsAdminMode(false);
    } else {
      setShowPassModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 relative">
      <Header 
        onHomeClick={handleBackToSearch} 
        showHomeLink={!!selectedStudent} 
      />

      {/* Admin Toggle Trigger (Gear Icon) */}
      <button 
        onClick={toggleAdminTrigger}
        className={`fixed top-24 left-6 z-40 p-3 rounded-full shadow-lg transition-all transform hover:rotate-90 ${isAdminMode ? 'bg-[#e60000] text-white' : 'bg-white text-gray-400 hover:text-[#4b0082]'}`}
        title={isAdminMode ? "الخروج من وضع المسؤول" : "إعدادات المسؤول"}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {/* Password Modal */}
      {showPassModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-fadeIn">
            <h3 className="text-xl font-black text-center mb-6 text-gray-800">الدخول للمسؤول</h3>
            <form onSubmit={handleAdminAuth} className="space-y-4">
              <input 
                type="password" 
                placeholder="كلمة المرور"
                autoFocus
                className={`w-full px-6 py-4 rounded-2xl border-2 text-center text-xl font-bold outline-none transition-all ${passError ? 'border-red-500 bg-red-50 animate-shake' : 'border-gray-100 bg-gray-50 focus:border-[#4b0082]'}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-[#4b0082] text-white py-3 rounded-xl font-bold hover:bg-[#390066] transition-colors">دخول</button>
                <button type="button" onClick={() => setShowPassModal(false)} className="px-6 py-3 rounded-xl font-bold text-gray-400 hover:text-gray-600 transition-colors">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <main className="container mx-auto px-4 pt-12">
        {selectedStudent ? (
          <ResultDisplay student={selectedStudent} onBack={handleBackToSearch} />
        ) : (
          <div className="animate-fadeIn">
            <div className="text-center mb-12 animate-fadeInDown">
              <h2 className="text-4xl font-black text-gray-900 mb-4">بوابة الطالب الإلكترونية</h2>
              <p className="text-lg text-gray-600 max-w-none mx-auto md:whitespace-nowrap px-4">
                مرحباً بك في البوابة المخصصة لطلاب مدرسة WE-Zayed. 
                اختر <span className="text-[#4b0082] font-bold">صفك الدراسي</span> ثم ادخل <span className="text-[#e60000] font-bold">رقمك القومي</span>.
              </p>
            </div>

            {isAdminMode ? (
              <div className="max-w-xl mx-auto animate-fadeIn">
                <div className="mb-6 flex justify-between items-center">
                   <h3 className="text-2xl font-black text-[#4b0082]">لوحة تحكم المسؤول</h3>
                   <button onClick={() => setIsAdminMode(false)} className="text-sm text-red-500 font-bold hover:underline">إغلاق الوضع</button>
                </div>
                <FileUpload onDataLoaded={handleDataLoaded} />
                <div className="text-center text-[10px] text-gray-400 mt-4 bg-white p-4 rounded-xl border border-gray-100">
                  <p className="font-bold text-gray-500 mb-2">تعليمات ملف الإكسيل:</p>
                  <ul className="space-y-1">
                    <li>1. يجب وجود شيت باسم <b className="text-[#4b0082]">Grade one</b> (لأولى ثانوي)</li>
                    <li>2. يجب وجود شيت باسم <b className="text-[#4b0082]">Grade two</b> (لتانية ثانوي)</li>
                    <li>3. النظام يبحث بذكاء عن أسماء الأعمدة (الوطنية، الدراسات، إلخ)</li>
                  </ul>
                </div>
              </div>
            ) : (
              <StudentSearch students={allStudents} onResultFound={setSelectedStudent} />
            )}
          </div>
        )}
      </main>

      <footer className="mt-20 py-8 text-center text-gray-400 text-sm border-t border-gray-200">
        <p>&copy; {new Date().getFullYear()} مدرسة WE-Zayed للتكنولوجيا التطبيقية. جميع الحقوق محفوظة.</p>
      </footer>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(50px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        .animate-fadeIn { animation: fadeIn 0.6s ease-out forwards; }
        .animate-fadeInDown { animation: fadeInDown 0.6s ease-out forwards; }
        .animate-slideUp { animation: slideUp 0.3s ease-out forwards; }
        .animate-shake { animation: shake 0.2s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default App;
