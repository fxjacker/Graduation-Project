import { useState, useEffect, useMemo } from 'react';
import { Star, MapPin, Coffee, Utensils, Camera, ChevronRight, Anchor, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';

export default function Curation() {
  const { t, i18n } = useTranslation(['curation', 'common']);
  
  // [상태 관리] 마리나 데이터, 로딩 상태, 검색어 저장
  const [marinas, setMarinas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // [기능 1] 컴포넌트 마운트 시 Supabase DB에서 마리나 리스트 호출
  useEffect(() => {
    async function fetchMarinas() {
      const { data } = await supabase
        .from('marina_list')
        .select('*')
        .order('name', { ascending: true }); // 이름순으로 정렬해서 가져오기

      if (data) setMarinas(data);
      setLoading(false);
    }
    fetchMarinas();
  }, []);

  // [기능 2] 실시간 필터링 로직: 입력한 검색어와 언어 설정에 맞춰 결과 도출
  const filteredMarinas = useMemo(() => {
    return marinas.filter(m => {
      const search = searchTerm.toLowerCase();
      const idNum = m.id.split('_')[1];

      // 현재 언어가 한국어면 DB의 원본 데이터를, 영어면 언어팩(JSON)의 번역본을 기준으로 검색
      const currentName = i18n.language === 'ko' ? m.name : t(`curation:marina_${idNum}_name`);
      const currentAddr = i18n.language === 'ko' ? m.address : t(`curation:marina_${idNum}_addr`);
      
      return currentName.toLowerCase().includes(search) || currentAddr.toLowerCase().includes(search);
    });
  }, [marinas, searchTerm, i18n.language, t]);

  // [기능 3] 로딩 중일 때 표시할 UI (언어팩 연동)
  if (loading) return (
    <div className="h-full w-full flex items-center justify-center text-[#003366] font-bold font-sans">
      {t('curation:loading')}
    </div>
  );

  return (
    <div className="h-full w-full bg-[#f8fafc] overflow-y-auto font-sans">
      <div className="max-w-7xl mx-auto px-4 py-12 md:px-8">
        
        {/* [기능 4] 헤더 및 다국어 검색창 영역 */}
        <div className="mb-12 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
            <div className="h-[1px] w-8 bg-blue-500"></div>
            <span className="text-blue-500 font-bold text-xs uppercase tracking-[0.3em]">Lifestyle Curation</span>
          </div>
          
          {/* 대제목 번역 적용: curation.json의 page_title 참조 */}
          <h1 className="text-3xl md:text-5xl font-black text-[#003366] mb-6 leading-tight">
            {t('curation:page_title')}
          </h1>
          
          {/* 검색창 UI: 실시간 입력값 반영 및 초기화 기능 포함 */}
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
            {/* 검색어 초기화 버튼 */}
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

        {/* [기능 5] 큐레이션 카드 그리드: 필터링된 마리나 리스트를 반복 렌더링 */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 mb-24">
          {filteredMarinas.length > 0 ? (
            filteredMarinas.map((marina) => {
              const idNum = marina.id.split('_')[1]; // ID값에서 숫자 추출 (예: MARINA_1 -> 1)
              
              return (
                <div key={marina.id} className="group bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 flex flex-col">
                  {/* 카드 상단: 이미지 및 기술 사양 정보 */}
                  <div className="relative h-64 overflow-hidden">
                    <img 
                      src={marina.recommend_image || `https://images.unsplash.com/photo-1567675411943-957215f6932c?auto=format&fit=crop&q=80&w=800&sig=${idNum}`} 
                      alt={marina.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                    />
                    <div className="absolute top-5 left-5">
                      <span className="bg-white/90 backdrop-blur-md text-[#003366] text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg border border-white/50">
                        DEPTH {marina.depth || '0.0'}M
                      </span>
                    </div>
                    {/* 별점 영역 */}
                    <div className="absolute bottom-5 right-5 flex items-center gap-1.5 bg-[#003366]/80 backdrop-blur-md text-white px-3 py-1.5 rounded-xl border border-white/20">
                      <Star size={12} fill="#fbbf24" className="text-yellow-400" />
                      <span className="text-xs font-bold">4.8</span>
                    </div>
                  </div>
                  
                  {/* 카드 하단: 다국어가 적용된 마리나 정보 */}
                  <div className="p-8 flex-1 flex flex-col">
                    <div className="mb-4">
                      <h3 className="font-black text-xl md:text-2xl text-gray-800 group-hover:text-blue-600 transition-colors mb-2">
                        {/* 언어 설정에 따른 조건부 텍스트 출력 */}
                        {i18n.language === 'ko' ? marina.name : t(`curation:marina_${idNum}_name`)}
                      </h3>
                      <p className="text-sm text-gray-400 flex items-start gap-1.5">
                        <MapPin size={16} className="text-blue-400 mt-0.5 flex-shrink-0" /> 
                        <span className="line-clamp-1">
                          {i18n.language === 'ko' ? marina.address : t(`curation:marina_${idNum}_addr`)}
                        </span>
                      </p>
                    </div>

                    {/* 편의 시설 아이콘 */}
                    <div className="flex gap-5 text-gray-300 mb-8 mt-auto pt-6 border-t border-gray-50">
                      <Coffee size={20} className="hover:text-amber-600 transition-all" /> 
                      <Utensils size={20} className="hover:text-orange-600 transition-all" /> 
                      <Camera size={20} className="hover:text-blue-600 transition-all" />
                    </div>
                    
                    {/* [기능 6] 상세 보기 버튼: 네이버 지도 링크 연동 */}
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
            // 검색 결과 없음 UI
            <div className="col-span-full py-20 text-center">
              <p className="text-gray-400 text-lg font-sans">{t('curation:no_result')}</p>
            </div>
          )}
        </section>

        {/* [기능 7] 하단 배너 섹션 */}
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

        {/* 푸터 영역 */}
        <footer className="text-center py-16 text-gray-300 text-xs tracking-widest font-medium">
          © 2026 GLOBAL MARINA HUB. ALL RIGHTS RESERVED.
        </footer>
      </div>
    </div>
  );
}