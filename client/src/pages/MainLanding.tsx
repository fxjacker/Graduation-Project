import { Ship, ShieldCheck, Globe, Map as MapIcon, ChevronRight, Anchor } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function MainLanding() {
  // 'main' 네임스페이스를 사용하여 main.json의 데이터를 불러옵니다.
  const { t } = useTranslation('main');

  return (
    <div className="flex flex-col w-full h-full overflow-y-auto bg-white">
      
      {/* --- 1. Hero Section --- */}
      <section className="relative min-h-[500px] md:h-[600px] flex items-center justify-center bg-[#003366] text-white overflow-hidden px-6 py-20 md:py-0">
        <div className="absolute inset-0 opacity-10 flex justify-center items-center pointer-events-none">
          <Ship className="w-[300px] h-[300px] md:w-[500px] md:h-[500px]" strokeWidth={0.5} />
        </div>
        
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-7xl font-extrabold mb-6 tracking-tight leading-tight">
            {t('hero_title_1')} <br />
            <span className="text-yellow-400">{t('hero_title_2')}</span>
          </h1>
          
          <p className="text-base md:text-xl text-blue-100/80 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            {t('hero_subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/map" className="w-full sm:w-auto px-10 py-4 bg-yellow-400 text-[#003366] rounded-full font-bold text-lg hover:scale-105 transition-all shadow-lg flex items-center justify-center gap-2">
              <MapIcon size={20} /> {t('btn_view_map')}
            </Link>
            <Link to="/guide" className="w-full sm:w-auto px-10 py-4 bg-white/10 backdrop-blur-md border border-white/30 rounded-full font-bold text-lg hover:bg-white/20 transition-all flex items-center justify-center gap-2">
              <ShieldCheck size={20} /> {t('btn_start_guide')}
            </Link>
          </div>
        </div>
      </section>

      {/* --- 2. Problem & Solution --- */}
      <section className="py-16 md:py-24 bg-white px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 md:mb-20">
            <h2 className="text-2xl md:text-4xl font-bold text-[#003366] mb-4">{t('solution_title')}</h2>
            <div className="w-20 h-1.5 bg-yellow-400 mx-auto rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16">
            {/* 솔루션 1 */}
            <div className="group flex flex-col items-center text-center p-6 rounded-3xl hover:bg-gray-50 transition-colors">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform">
                <ShieldCheck size={36} />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">{t('solution_1_title')}</h3>
              <p className="text-gray-500 text-sm md:text-base leading-relaxed">
                {t('solution_1_desc')}
              </p>
            </div>

            {/* 솔루션 2 */}
            <div className="group flex flex-col items-center text-center p-6 rounded-3xl hover:bg-gray-50 transition-colors">
              <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform">
                <Anchor size={36} />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">{t('solution_2_title')}</h3>
              <p className="text-gray-500 text-sm md:text-base leading-relaxed">
                {t('solution_2_desc')}
              </p>
            </div>

            {/* 솔루션 3 */}
            <div className="group flex flex-col items-center text-center p-6 rounded-3xl hover:bg-gray-50 transition-colors">
              <div className="w-20 h-20 bg-purple-50 text-purple-500 rounded-3xl flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform">
                <Globe size={36} />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">{t('solution_3_title')}</h3>
              <p className="text-gray-500 text-sm md:text-base leading-relaxed">
                {t('solution_3_desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- 3. CTA --- */}
      <section className="py-16 md:py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto bg-[#003366] rounded-[2rem] md:rounded-[3rem] p-8 md:p-16 flex flex-col md:flex-row items-center justify-between text-white shadow-2xl gap-8">
          <div className="text-center md:text-left">
            <h2 className="text-2xl md:text-4xl font-bold mb-4">{t('cta_title')}</h2>
            <p className="text-blue-200 md:text-lg">{t('cta_subtitle')}</p>
          </div>
          
          <Link to="/map" className="group bg-yellow-400 text-[#003366] px-10 py-5 rounded-2xl font-bold text-lg flex items-center gap-2 hover:bg-yellow-300 transition-all whitespace-nowrap">
            {t('btn_start_free')} <ChevronRight className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>
      
      <footer className="py-10 text-center text-gray-400 text-sm border-t border-gray-100">
        © 2026 Global Marina Navigation Hub. All rights reserved.
      </footer>
    </div>
  );
}