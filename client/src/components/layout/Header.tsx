import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';

export default function Header() {
  const { t, i18n } = useTranslation();

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === 'ko' ? 'en' : 'ko');
  };

  return (
    <header className="bg-[#003366] text-white p-4 flex items-center justify-between sticky top-0 z-[1000] w-full">
      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-white/10 rounded-lg md:hidden">
          <Menu size={24} />
        </button>
        <Link to="/" className="text-xl font-bold tracking-tight">
          {/* JSON에 nav_home이 있으니 이걸로 로고 제목을 씁니다 */}
          {t('nav_home')} MARINA
        </Link>
      </div>

      <nav className="hidden md:flex gap-8 font-medium">
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

      <button 
        onClick={toggleLang}
        className="bg-[#FFCC00] text-[#003366] px-4 py-1.5 rounded-lg font-bold hover:scale-105 transition-transform text-sm"
      >
        {i18n.language === 'ko' ? 'English' : '한국어'}
      </button>
    </header>
  );
}