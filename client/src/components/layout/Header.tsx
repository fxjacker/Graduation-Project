import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';

export default function Header() {
  const { t, i18n } = useTranslation();

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === 'ko' ? 'en' : 'ko');
  };

  return (
    <header className="bg-[#003366] text-white p-4 flex items-center justify-between sticky top-0 z-[1000]">
      <div className="flex items-center gap-4">
        {/* 메뉴 아이콘 - 나중에 사이드바 토글용 */}
        <button className="p-2 hover:bg-white/10 rounded-lg">
          <Menu size={24} />
        </button>
        {/* 로고 및 서비스 명 */}
        <Link to="/" className="text-xl font-bold tracking-tight">
          {t('header_title')}
        </Link>
      </div>

      {/* 상단 네비게이션 */}
      <nav className="hidden md:flex gap-6 font-medium">
        <Link to="/map" className="hover:text-[#FFCC00] transition-colors">
          {t('nav_map')}
        </Link>
        <Link to="/guide" className="hover:text-[#FFCC00] transition-colors">
          {t('nav_guide')}
        </Link>
        <Link to="/curation" className="hover:text-[#FFCC00] transition-colors">
          {t('nav_curation')}
        </Link>
      </nav>

      {/* KR/EN 토글 버튼 */}
      <button 
        onClick={toggleLang}
        className="bg-[#FFCC00] text-[#003366] px-4 py-1.5 rounded-lg font-bold hover:scale-105 transition-transform"
      >
        {i18n.language.toUpperCase()}
      </button>
    </header>
  );
}