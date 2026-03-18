import { useState, useEffect, useMemo } from 'react';
import { Star, MapPin, Coffee, Utensils, Camera, ChevronRight, Anchor, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';

export default function Curation() {
  const { t } = useTranslation(['curation', 'common']);
  const [marinas, setMarinas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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

  const filteredMarinas = useMemo(() => {
    return marinas.filter(m => 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      m.address.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [marinas, searchTerm]);

  if (loading) return <div className="h-full w-full flex items-center justify-center text-[#003366] font-bold font-sans">Loading Premium Experience...</div>;

  return (
    <div className="h-full w-full bg-[#f8fafc] overflow-y-auto font-sans">
      <div className="max-w-7xl mx-auto px-4 py-12 md:px-8">
        
        <div className="mb-12 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
            <div className="h-[1px] w-8 bg-blue-500"></div>
            <span className="text-blue-500 font-bold text-xs uppercase tracking-[0.3em]">Lifestyle Curation</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-[#003366] mb-6">
            전국 39개 마리나 라이프스타일 가이드
          </h1>
          
          <div className="relative max-w-xl mt-8">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-12 pr-12 py-4 border-none bg-white shadow-lg rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none text-gray-700"
              placeholder="찾으시는 마리나 이름이나 지역을 입력하세요..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 mb-24">
          {filteredMarinas.length > 0 ? (
            filteredMarinas.map((marina) => (
              <div key={marina.id} className="group bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 flex flex-col">
                <div className="relative h-64 overflow-hidden">
                  <img 
                    src={marina.recommend_image || `https://images.unsplash.com/photo-1567675411943-957215f6932c?q=80&w=600&auto=format&fit=crop`} 
                    alt={marina.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
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
                
                <div className="p-8 flex-1 flex flex-col">
                  <div className="mb-4">
                    <h3 className="font-black text-xl md:text-2xl text-gray-800 group-hover:text-blue-600 transition-colors mb-2">
                      {marina.name}
                    </h3>
                    <p className="text-sm text-gray-400 flex items-start gap-1.5">
                      <MapPin size={16} className="text-blue-400 mt-0.5 flex-shrink-0" /> 
                      <span className="line-clamp-1">{marina.address}</span>
                    </p>
                  </div>

                  <div className="flex gap-5 text-gray-300 mb-8 mt-auto pt-6 border-t border-gray-50">
                    <Coffee size={20} className="hover:text-amber-600 transition-all" /> 
                    <Utensils size={20} className="hover:text-orange-600 transition-all" /> 
                    <Camera size={20} className="hover:text-blue-600 transition-all" />
                  </div>
                  
                  <button 
                    onClick={() => marina.recommend_link && window.open(marina.recommend_link, '_blank')}
                    className="w-full bg-[#003366] text-white py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-700 transition-all active:scale-95 shadow-lg group/btn"
                  >
                    {t('common:btn_more')} 
                    <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center">
              <p className="text-gray-400 text-lg">검색 결과와 일치하는 마리나가 없습니다. ⚓️</p>
            </div>
          )}
        </section>

        <section className="bg-gradient-to-br from-[#003366] to-[#001a33] rounded-[3rem] p-10 md:p-20 text-center text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-10">
            <Anchor size={200} />
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl md:text-4xl font-black mb-6 italic">Explore All 39 Global Marinas</h2>
            <p className="text-blue-200/70 text-sm md:text-lg mb-10 max-w-xl mx-auto">
              대한민국 전역의 마리나 데이터를 완벽하게 구축했습니다.<br/>
              이제 당신의 완벽한 항해 시나리오를 시작해 보세요.
            </p>
            <button className="bg-yellow-400 text-[#003366] px-12 py-5 rounded-2xl font-black hover:bg-yellow-300 transition-all shadow-xl hover:-translate-y-1">
              마리나 제보하기
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