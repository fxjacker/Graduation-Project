import { useState, useEffect, useMemo } from 'react';
import { Star, MapPin, Coffee, Utensils, Camera, ChevronRight, Anchor, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';

export default function Curation() {
  const { t, i18n } = useTranslation(['curation', 'common']);
  
  const [marinas, setMarinas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  /* 기능: 데이터베이스 연동 및 마리나 목록 조회 */
  useEffect(() => {
    async function fetchMarinas() {
      const { data } = await supabase
        .from('marina_list')
        .select('*')
        .order('name', { ascending: true });

      if (data) setMarinas(data);
      setLoading(false);
    }
    fetchMarinas();
  }, []);

  /* 기능: 실시간 검색어 및 다국어 설정에 따른 필터링 로직 */
  const filteredMarinas = useMemo(() => {
    return marinas.filter(m => {
      const search = searchTerm.toLowerCase();
      const idNum = m.id.split('_')[1];

      const currentName = i18n.language === 'ko' ? m.name : t(`curation:marina_${idNum}_name`);
      const currentAddr = i18n.language === 'ko' ? m.address : t(`curation:marina_${idNum}_addr`);
      
      return currentName.toLowerCase().includes(search) || currentAddr.toLowerCase().includes(search);
    });
  }, [marinas, searchTerm, i18n.language, t]);

  /* 기능: 데이터 로딩 중 화면 처리 */
  if (loading) return (
    <div className="h-full w-full flex items-center justify-center text-[#003366] font-bold font-sans">
      {t('curation:loading')}
    </div>
  );

  return (
    <div className="h-full w-full bg-[#f8fafc] overflow-y-auto font-sans">
      <div className="max-w-7xl mx-auto px-4 py-12 md:px-8">
        
        {/* 기능: 검색창 UI 및 텍스트 초기화 기능 */}
        <div className="mb-12 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
            <div className="h-[1px] w-8 bg-blue-500"></div>
            <span className="text-blue-500 font-bold text-xs uppercase tracking-[0.3em]">Lifestyle Curation</span>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-black text-[#003366] mb-6 leading-tight">
            {t('curation:page_title')}
          </h1>
          
          <div className="relative max-w-xl mt-8 mx-auto md:mx-0">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-12 pr-12 py-4 border-none bg-white shadow-lg rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none text-gray-700 font-sans"
              placeholder={t('curation:search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")} 
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* 기능: 검색 결과 리스트 출력 및 개별 카드 렌더링 */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 mb-24">
          {filteredMarinas.length > 0 ? (
            filteredMarinas.map((marina) => {
              const idPart = marina.id.split('_')[1];
              const currentName = i18n.language === 'ko' ? marina.name : t(`curation:marina_${idPart}_name`);

              return (
                <div key={marina.id} className="group bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 flex flex-col">
                  
                  {/* 기능: DB에 등록된 고유 이미지 출력 및 로딩 실패 대응 */}
                  <div className="relative h-64 overflow-hidden bg-gray-200">
                    <img 
                      src={marina.recommend_image} 
                      alt={currentName} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=800&auto=format&fit=crop";
                      }}
                    />
                    <div className="absolute top-5 left-5">
                      <span className="bg-white/90 backdrop-blur-md text-[#003366] text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg border border-white/50">
                        DEPTH {marina.depth || '0.0'}M
                      </span>
                    </div>
                    <div className="absolute bottom-5 right-5 flex items-center gap-1.5 bg-[#003366]/80 backdrop-blur-md text-white px-3 py-1.5 rounded-xl border border-white/20">
                      <Star size={12} fill="#fbbf24" className="text-yellow-400" />
                      <span className="text-xs font-bold">4.8</span>
                    </div>
                  </div>
                  
                  {/* 기능: 마리나 상세 정보 표시 및 다국어 텍스트 적용 */}
                  <div className="p-8 flex-1 flex flex-col">
                    <div className="mb-4">
                      <h3 className="font-black text-xl md:text-2xl text-gray-800 group-hover:text-blue-600 transition-colors mb-2">
                        {currentName}
                      </h3>
                      <p className="text-sm text-gray-400 flex items-start gap-1.5">
                        <MapPin size={16} className="text-blue-400 mt-0.5 flex-shrink-0" /> 
                        <span className="line-clamp-1">
                          {i18n.language === 'ko' ? marina.address : t(`curation:marina_${idPart}_addr`)}
                        </span>
                      </p>
                    </div>

                    {/* 기능: 마리나 주변 카페, 식당, 명소 구글 지도 자동 검색 아이콘 */}
                    <div className="flex gap-5 text-gray-300 mb-8 mt-auto pt-6 border-t border-gray-50">
                      <button 
                        onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(currentName + " 카페")}`, '_blank')}
                        className="hover:text-amber-600 transition-all hover:scale-110 active:scale-95"
                        title="주변 카페 검색"
                      >
                        <Coffee size={20} />
                      </button>
                      <button 
                        onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(currentName + " 맛집")}`, '_blank')}
                        className="hover:text-orange-600 transition-all hover:scale-110 active:scale-95"
                        title="주변 맛집 검색"
                      >
                        <Utensils size={20} />
                      </button>
                      <button 
                        onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(currentName + " 관광명소")}`, '_blank')}
                        className="hover:text-blue-600 transition-all hover:scale-110 active:scale-95"
                        title="주변 명소 검색"
                      >
                        <Camera size={20} />
                      </button>
                    </div>
                    
                    {/* 기능: 상세 페이지 외부 링크 연결 */}
                    <button 
                      onClick={() => marina.recommend_link && window.open(marina.recommend_link, '_blank')}
                      className="w-full bg-[#003366] text-white py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-700 transition-all active:scale-95 shadow-lg group/btn"
                    >
                      {t('common:btn_more')} 
                      <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            /* 기능: 검색 결과가 없을 때의 예외 UI 처리 */
            <div className="col-span-full py-20 text-center">
              <p className="text-gray-400 text-lg font-sans">{t('curation:no_result')}</p>
            </div>
          )}
        </section>

        {/* 기능: 하단 유도 배너 섹션 */}
        <section className="bg-gradient-to-br from-[#003366] to-[#001a33] rounded-[3rem] p-10 md:p-20 text-center text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-10">
            <Anchor size={200} />
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl md:text-4xl font-black mb-6 italic">{t('curation:share_title')}</h2>
            <p className="text-blue-200/70 text-sm md:text-lg mb-10 max-w-xl mx-auto">
              {t('curation:share_subtitle')}
            </p>
            <button className="bg-yellow-400 text-[#003366] px-12 py-5 rounded-2xl font-black hover:bg-yellow-300 transition-all shadow-xl hover:-translate-y-1">
              {t('curation:btn_write')}
            </button>
          </div>
        </section>

        <footer className="text-center py-16 text-gray-300 text-xs tracking-widest font-medium">
          © 2026 GLOBAL MARINA HUB. ALL RIGHTS RESERVED.
        </footer>
      </div>
    </div>
  );
}