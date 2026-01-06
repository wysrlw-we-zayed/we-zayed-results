
import React, { useState } from 'react';
import { Student } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LabelList, ResponsiveContainer } from 'recharts';

interface ResultDisplayProps {
  student: Student;
  onBack: () => void;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ student, onBack }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const chartData = student.grades.map(g => ({
    name: g.name,
    score: g.score,
  }));

  const totalScore = student.grades.reduce((acc, curr) => acc + curr.score, 0);
  const totalMax = student.grades.reduce((acc, curr) => acc + curr.maxScore, 0);
  const percentage = ((totalScore / totalMax) * 100).toFixed(1);

  const handleDownloadPDF = () => {
    const element = document.getElementById('printable-result');
    if (!element) return;

    setIsGenerating(true);

    // Access html2pdf from window safely for TS
    const html2pdf = (window as any).html2pdf;

    if (!html2pdf) {
      alert("عذراً، لم يتم تحميل مكتبة PDF بشكل صحيح. يرجى المحاولة مرة أخرى.");
      setIsGenerating(false);
      return;
    }

    const opt = {
      margin: [10, 10, 10, 10],
      filename: `نتيجة_${student.name}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    setTimeout(() => {
      html2pdf().set(opt).from(element).save().then(() => {
        setIsGenerating(false);
      }).catch((err: any) => {
        console.error('PDF Error:', err);
        setIsGenerating(false);
      });
    }, 500);
  };

  return (
    <div className="max-w-4xl mx-auto mt-8 mb-20 animate-fadeIn text-right">
      <div className="flex justify-between items-center mb-8 no-print px-4">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-[#4b0082] hover:text-[#e60000] font-bold transition-colors group"
        >
          <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 12H5m7 7l-7-7 7-7" />
          </svg>
          <span>العودة للبحث</span>
        </button>

        <button 
          onClick={handleDownloadPDF}
          disabled={isGenerating}
          className={`flex items-center gap-3 bg-[#e60000] text-white px-8 py-3 rounded-full font-bold shadow-xl transform active:scale-95 transition-all ${isGenerating ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#c00000]'}`}
        >
          {isGenerating ? (
            <svg className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" viewBox="0 0 24 24"></svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          )}
          <span>{isGenerating ? 'جاري التحميل...' : 'تحميل النتيجة PDF'}</span>
        </button>
      </div>

      <div 
        id="printable-result" 
        className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
      >
        <div className="bg-[#4b0082] p-8 text-white relative">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <p className="text-purple-300 font-bold mb-1 text-sm">مدرسة WE للتكنولوجيا التطبيقية - الشيخ زايد</p>
              <h2 className="text-3xl font-black mb-4">{student.name}</h2>
              <div className="flex flex-wrap gap-4">
                <span className="bg-white/10 px-3 py-1 rounded-lg text-xs">رقم الجلوس: <b>{student.seatingNumber}</b></span>
                <span className="bg-white/10 px-3 py-1 rounded-lg text-xs">الصف: <b>{student.gradeLevel === '1' ? 'الأول' : 'الثاني'}</b></span>
                <span className="bg-white/10 px-3 py-1 rounded-lg text-xs">الفصل: <b>{student.class}</b></span>
              </div>
            </div>
            
            <div className="bg-white/10 p-4 rounded-2xl text-center backdrop-blur-sm border border-white/20 min-w-[120px]">
              <p className="text-xs uppercase font-bold opacity-70 mb-1">النسبة المئوية</p>
              <p className="text-4xl font-black text-[#ffcc00] leading-none">{percentage}%</p>
              <p className="text-xs mt-1 text-purple-200">{totalScore} / {totalMax}</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-[#e60000] rounded-full"></span>
              تفاصيل الدرجات
            </h3>
            <div className="grid grid-cols-1 gap-1.5">
              {student.grades.map((grade, index) => (
                <div key={index} className="flex items-center justify-between py-2.5 px-5 bg-gray-50 rounded-xl border border-gray-100 transition-hover hover:bg-white hover:shadow-sm">
                  <span className="font-bold text-gray-700 text-sm">{grade.name}</span>
                  <div className="flex items-center gap-10">
                    <div className="text-left w-20" dir="ltr">
                      <span className={`text-base font-black ${grade.score >= 25 ? 'text-green-600' : 'text-red-600'}`}>
                        {grade.score}
                      </span>
                      <span className="text-xs text-gray-400 ml-1">/ 50</span>
                    </div>
                    <div className={`w-2.5 h-2.5 rounded-full ${grade.status === 'Pass' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
            <h4 className="text-[10px] font-bold text-gray-400 mb-4 text-center uppercase tracking-widest">التحليل البياني للمستوى</h4>
            <div className="h-[240px] w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 35, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                  <XAxis type="number" domain={[0, 50]} hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={110} 
                    tick={{ fontSize: 9, fontWeight: 700, fill: '#4b0082' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip cursor={{fill: 'rgba(0,0,0,0.02)'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={12}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.score >= 40 ? '#4b0082' : entry.score >= 25 ? '#6366f1' : '#e60000'} />
                    ))}
                    <LabelList dataKey="score" position="right" style={{ fill: '#4b0082', fontWeight: 'bold', fontSize: '9px' }} offset={8} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
          <div className="text-right">
            <p className="text-[#4b0082] font-bold text-xs">مدرسة WE للكنولوجيا التطبيقية</p>
            <p className="text-gray-400 text-[10px]">صدرت بتاريخ {new Date().toLocaleDateString('ar-EG')}</p>
          </div>
          <div className="bg-[#4b0082] text-white px-3 py-1.5 rounded-lg text-[10px] font-mono shadow-sm">
            REF: {student.seatingNumber}-OFFICIAL
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultDisplay;
