import { Star, MapPin, Coffee, Utensils, Camera, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// 🚩 [데이터 수정] title -> titleKey, location -> locationKey로 변경했습니다.
const CURATION_DATA = [
  { 
    id: 1, 
    titleKey: 'tour_1_title', 
    locationKey: 'tour_1_loc', 
    rating: 4.9, 
    tags: ['romance', 'night'], 
    img: 'https://images.unsplash.com/photo-1540944030791-4d5140bbad6e?auto=format&fit=crop&q=80&w=400' 
  },
  { 
    id: 2, 
    titleKey: 'tour_2_title', 
    locationKey: 'tour_2_loc', 
    rating: 4.8, 
    tags: ['classic', 'family'], 
    img: 'https://images.unsplash.com/photo-1567675411943-957215f6932c?auto=format&fit=crop&q=80&w=400' 
  },
];

export default function Curation() {
  const { t } = useTranslation(['curation', 'common']);

  return (
    <div className="h-full w-full bg-white overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 py-8 md:px-8 md:py-12">
        
        {/* 1. 헤더 섹션 */}
        <div className="mb-10 md:mb-16">
          <span className="text-blue-500 font-bold text-xs md:text-sm uppercase tracking-[0.2em] mb-2 block">Premium Experience</span>
          <h1 className="text-2xl md:text-4xl font-black text-[#003366] mb-3">
            {t('curation:page_title')}
          </h1>
          <p className="text-gray-500 text-sm md:text-lg leading-relaxed max-w-2xl">
            {t('curation:page_subtitle')}
          </p>
        </div>

        {/* 2. 메인 큐레이션 카드 그리드 */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-20">
          {CURATION_DATA.map(item => (
            <div key={item.id} className="group bg-white rounded-[2rem] overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 cursor-pointer">
              <div className="relative h-52 md:h-64">
                <img src={item.img} alt={t(`curation:${item.titleKey}`)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                  {item.tags.map(tag => (
                    <span key={tag} className="bg-white/90 backdrop-blur-md text-[#003366] text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-sm">
                      #{t(`curation:tag_${tag}`, tag)}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  {/* 🚩 [수정] t() 함수를 사용해 제목을 번역합니다. */}
                  <h3 className="font-bold text-lg md:text-xl text-gray-800 group-hover:text-[#003366] transition-colors">
                    {t(`curation:${item.titleKey}`)}
                  </h3>
                  <div className="flex items-center gap-1 text-yellow-500 bg-yellow-50 px-2 py-1 rounded-lg">
                    <Star size={14} fill="currentColor" />
                    <span className="text-xs font-black">{item.rating}</span>
                  </div>
                </div>
                
                {/* 🚩 [수정] t() 함수를 사용해 위치를 번역합니다. */}
                <p className="text-sm text-gray-400 flex items-center gap-1 mb-6">
                  <MapPin size={14} className="text-blue-400" /> 
                  {t(`curation:${item.locationKey}`)}
                </p>
                
                <div className="flex justify-between items-center pt-5 border-t border-gray-50">
                   <div className="flex gap-4 text-gray-300">
                    <Coffee size={20} className="hover:text-amber-600 transition-colors" /> 
                    <Utensils size={20} className="hover:text-orange-600 transition-colors" /> 
                    <Camera size={20} className="hover:text-blue-600 transition-colors" />
                   </div>
                   <button className="text-[#003366] font-extrabold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                    {t('common:btn_more')} <ChevronRight size={18} />
                   </button>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* 3. 하단 배너 섹션 */}
        <section className="bg-[#003366] rounded-[2.5rem] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between text-white shadow-2xl gap-8 mb-10">
          <div className="text-center md:text-left">
            <h2 className="text-xl md:text-2xl font-bold mb-3">{t('curation:share_title')}</h2>
            <p className="text-blue-200/70 text-sm md:text-base">
              {t('curation:share_subtitle')}
            </p>
          </div>
          <button className="w-full md:w-auto bg-yellow-400 text-[#003366] px-8 py-4 rounded-2xl font-black hover:bg-yellow-300 transition-all shadow-lg active:scale-95">
            {t('curation:btn_write')}
          </button>
        </section>

        <footer className="text-center py-10 text-gray-300 text-xs">
          © 2026 Global Marina Hub Curation Service.
        </footer>
      </div>
    </div>
  );
}