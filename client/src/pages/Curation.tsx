import { Star, MapPin, Coffee, Utensils, Camera, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// 임시 큐레이션 데이터: 윤석님이 DB 구축 후 API로 불러올 영역 //
const CURATION_DATA = [
  { id: 1, title: '여수 밤바다 요트 투어', location: '여수 마리나', rating: 4.9, tags: ['낭만', '야경'], img: 'https://images.unsplash.com/photo-1540944030791-4d5140bbad6e?auto=format&fit=crop&q=80&w=400' },
  { id: 2, title: '수영만 요트 경기장 클래식 코스', location: '부산 수영만', rating: 4.8, tags: ['클래식', '가족'], img: 'https://images.unsplash.com/photo-1567675411943-957215f6932c?auto=format&fit=crop&q=80&w=400' },
];

export default function Curation() {
  const { t } = useTranslation();

  return (
    <div className="min-h-[calc(100vh-64px)] bg-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 섹션 */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-[#003366] mb-2">{t('curation_title', '마리나 라이프스타일 큐레이션')}</h1>
          <p className="text-gray-500">항해 그 이상의 즐거움, 당신만을 위한 완벽한 마리나 경험을 추천합니다.</p>
        </div>

        {/* 메인 큐레이션 카드 그리드: 정윤석님이 설계할 DB 데이터 렌더링 지점 // */}
        <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {CURATION_DATA.map(item => (
            <div key={item.id} className="group rounded-2xl overflow-hidden shadow-lg border border-gray-100 hover:shadow-2xl transition-all cursor-pointer">
              <div className="relative h-56">
                <img src={item.img} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute top-4 left-4 flex gap-2">
                  {item.tags.map(tag => (
                    <span key={tag} className="bg-white/90 backdrop-blur-sm text-[#003366] text-[10px] font-bold px-2 py-1 rounded-md">#{tag}</span>
                  ))}
                </div>
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-gray-800">{item.title}</h3>
                  <span className="flex items-center gap-1 text-yellow-500 text-sm font-bold"><Star size={14} fill="currentColor" /> {item.rating}</span>
                </div>
                <p className="text-sm text-gray-400 flex items-center gap-1 mb-4"><MapPin size={14} /> {item.location}</p>
                <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                   <div className="flex gap-3 text-gray-400">
                    <Coffee size={18} /> <Utensils size={18} /> <Camera size={18} />
                   </div>
                   <button className="text-[#003366] font-bold text-sm flex items-center group-hover:translate-x-1 transition-transform">
                    상세보기 <ChevronRight size={16} />
                   </button>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* 하단 배너: 해양 관광 활성화 홍보 지점 // */}
        <section className="bg-blue-50 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between">
          <div className="mb-6 md:mb-0">
            <h2 className="text-xl font-bold text-[#003366] mb-2">당신의 마리나 경험을 공유해 주세요</h2>
            <p className="text-sm text-blue-600/70 text-gray-500">글로벌 항해사들이 가장 선호하는 정박지 정보를 업데이트하고 있습니다.</p>
          </div>
          <button className="bg-[#003366] text-white px-6 py-3 rounded-xl font-bold hover:brightness-110 transition-all">스토리 작성하기</button>
        </section>
      </div>
    </div>
  );
}