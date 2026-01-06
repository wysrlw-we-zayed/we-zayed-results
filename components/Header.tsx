
import React from 'react';

interface HeaderProps {
  onHomeClick?: () => void;
  showHomeLink?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onHomeClick, showHomeLink = true }) => {
  return (
    <header className="bg-[#4b0082] text-white shadow-lg py-4 px-6 flex justify-between items-center sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <div 
          className={`bg-white p-2 rounded-full ${showHomeLink ? 'cursor-pointer' : ''}`} 
          onClick={showHomeLink ? onHomeClick : undefined}
        >
          <div className="w-10 h-10 bg-[#e60000] rounded-full flex items-center justify-center font-bold text-white text-xl">WE</div>
        </div>
        <div className={showHomeLink ? 'cursor-pointer' : ''} onClick={showHomeLink ? onHomeClick : undefined}>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">مدرسة WE للتكنولوجيا التطبيقية - الشيخ زايد</h1>
          <p className="text-xs text-purple-200">بوابة النتائج والخدمات الطلابية</p>
        </div>
      </div>
      <nav className="hidden md:flex gap-6 font-medium">
        {showHomeLink && (
          <button 
            onClick={(e) => {
              e.preventDefault();
              if (onHomeClick) onHomeClick();
            }} 
            className="hover:text-[#ffcc00] transition-colors"
          >
            الرئيسية
          </button>
        )}
        <a href="#" className="hover:text-[#ffcc00] transition-colors">عن المدرسة</a>
        <a href="#" className="hover:text-[#ffcc00] transition-colors">اتصل بنا</a>
      </nav>
    </header>
  );
};

export default Header;
