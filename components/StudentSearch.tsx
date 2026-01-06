
import React, { useState } from 'react';
import { Student } from '../types';

interface StudentSearchProps {
  students: Student[];
  onResultFound: (student: Student | null) => void;
}

const StudentSearch: React.FC<StudentSearchProps> = ({ students, onResultFound }) => {
  const [nationalId, setNationalId] = useState('');
  const [gradeLevel, setGradeLevel] = useState<'1' | '2'>('1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (nationalId.length !== 14) {
      setError('يرجى إدخال رقم قومي صحيح مكون من 14 رقماً.');
      return;
    }

    setLoading(true);
    setError('');

    // Search by BOTH National ID and Grade Level
    setTimeout(() => {
      const student = students.find(s => 
        s.nationalId === nationalId && s.gradeLevel === gradeLevel
      );
      
      if (student) {
        onResultFound(student);
      } else {
        setError(`عذراً، لم يتم العثور على طالب بهذا الرقم في ${gradeLevel === '1' ? 'الصف الأول' : 'الصف الثاني'}.`);
        onResultFound(null);
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div className="max-w-xl mx-auto mt-12 p-8 bg-white rounded-3xl shadow-xl border border-gray-100">
      <h2 className="text-2xl font-black text-center mb-8 text-gray-800">استعلام عن النتيجة</h2>
      
      <form onSubmit={handleSearch} className="space-y-6">
        {/* Grade Selection */}
        <div className="flex bg-gray-100 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setGradeLevel('1')}
            className={`flex-1 py-3 rounded-xl font-bold transition-all ${gradeLevel === '1' ? 'bg-[#4b0082] text-white shadow-lg' : 'text-gray-500 hover:text-gray-700'}`}
          >
            الصف الأول
          </button>
          <button
            type="button"
            onClick={() => setGradeLevel('2')}
            className={`flex-1 py-3 rounded-xl font-bold transition-all ${gradeLevel === '2' ? 'bg-[#4b0082] text-white shadow-lg' : 'text-gray-500 hover:text-gray-700'}`}
          >
            الصف الثاني
          </button>
        </div>

        {/* National ID Input */}
        <div>
          <label className="block text-sm font-bold text-gray-600 mb-2 mr-2">الرقم القومي للطالب</label>
          <input
            type="text"
            maxLength={14}
            placeholder="أدخل 14 رقماً"
            className="w-full px-6 py-4 rounded-2xl border-2 border-transparent bg-[#4b0082] text-white placeholder-purple-300 focus:ring-4 focus:ring-purple-100 focus:border-[#e60000] outline-none transition-all text-center text-2xl font-black tracking-widest shadow-inner"
            value={nationalId}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, ''); 
              setNationalId(val);
            }}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#e60000] hover:bg-[#c00000] text-white font-black py-4 rounded-2xl shadow-xl transform active:scale-95 transition-all flex justify-center items-center text-lg"
        >
          {loading ? (
            <svg className="animate-spin h-6 w-6 border-4 border-white border-t-transparent rounded-full" viewBox="0 0 24 24"></svg>
          ) : 'عرض بيان الدرجات الآن'}
        </button>
      </form>
      
      {error && (
        <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-2xl text-center font-bold animate-fadeIn">
          {error}
        </div>
      )}
    </div>
  );
};

export default StudentSearch;
