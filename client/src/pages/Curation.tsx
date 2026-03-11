import { Star, MapPin, Coffee, Utensils, Camera, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// 🚩 [BACKEND] 정윤석님: 나중에 이 Mock 데이터 대신 서버 API에서 받아온 실제 큐레이션 데이터를 여기에 넣으세요.
// DB 설계 시 title, location, rating, tags(배열), img(URL) 필드가 필요합니다.
const CURATION_DATA = [
  { id: 1, title: '여수 밤바다 요트 투어', location: '여수 마리나', rating: 4.9, tags: ['낭만', '야경'], img: 'https://images.unsplash.com/photo-1540944030791-4d5140bbad6e?auto=format&fit=crop&q=80&w=400' },
  { id: 2, title: '수영만 요트 경기장 클래식 코스', location: '부산 수영만', rating: 4.8, tags: ['클래식', '가족'], img: 'https://images.unsplash.com/photo-1567675411943-957215f6932c?auto=format&fit=crop&q=80&w=400' },
];

export default function Curation() {
  const { t } = useTranslation();

  return (
    // h-full과 overflow-y-auto로 휴대폰에서 스크롤이 부드럽게 작동하도록 설정
    <div className="h-full w-full bg-white overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 py-8 md:px-8 md:py-12">
        
        {/* 1. 헤더 섹션: 모바일에서는 텍스트 크기를 살짝 줄여 가독성 확보 */}
        <div className="mb-10 md:mb-16">
          <span className="text-blue-500 font-bold text-xs md:text-sm uppercase tracking-[0.2em] mb-2 block">Premium Experience</span>
          <h1 className="text-2xl md:text-4xl font-black text-[#003366] mb-3">
            {t('curation_title', '마리나 라이프스타일 큐레이션')}
          </h1>
          <p className="text-gray-500 text-sm md:text-lg leading-relaxed max-w-2xl">
            항해 그 이상의 즐거움, 당신만을 위한 완벽한 마리나 경험을 추천합니다.
          </p>
        </div>

        {/* 2. 메인 큐레이션 카드 그리드 */}
        {/* 🚩 [BACKEND] 정윤석님: 나중에 useEffect와 axios를 사용해 서버에서 데이터를 받아와 CURATION_DATA를 갈아끼우는 지점입니다. */}
        {/* grid-cols-1(모바일), sm:2(태블릿), lg:3(PC)로 자동 레이아웃 설정 */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-20">
          {CURATION_DATA.map(item => (
            <div key={item.id} className="group bg-white rounded-[2rem] overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 cursor-pointer">
              {/* 이미지 영역 */}
              <div className="relative h-52 md:h-64">
                <img src={item.img} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                  {item.tags.map(tag => (
                    <span key={tag} className="bg-white/90 backdrop-blur-md text-[#003366] text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-sm">#{tag}</span>
                  ))}
                </div>
              </div>
              
              {/* 텍스트 정보 영역 */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg md:text-xl text-gray-800 group-hover:text-[#003366] transition-colors">{item.title}</h3>
                  <div className="flex items-center gap-1 text-yellow-500 bg-yellow-50 px-2 py-1 rounded-lg">
                    <Star size={14} fill="currentColor" />
                    <span className="text-xs font-black">{item.rating}</span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-400 flex items-center gap-1 mb-6">
                  <MapPin size={14} className="text-blue-400" /> {item.location}
                </p>
                
                <div className="flex justify-between items-center pt-5 border-t border-gray-50">
                   <div className="flex gap-4 text-gray-300">
                    <Coffee size={20} className="hover:text-amber-600 transition-colors" /> 
                    <Utensils size={20} className="hover:text-orange-600 transition-colors" /> 
                    <Camera size={20} className="hover:text-blue-600 transition-colors" />
                   </div>
                   <button className="text-[#003366] font-extrabold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                    상세보기 <ChevronRight size={18} />
                   </button>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* 3. 하단 배너: 모바일은 세로, PC는 가로로 배치 */}
        <section className="bg-[#003366] rounded-[2.5rem] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between text-white shadow-2xl gap-8 mb-10">
          <div className="text-center md:text-left">
            <h2 className="text-xl md:text-2xl font-bold mb-3">당신의 마리나 경험을 공유해 주세요</h2>
            <p className="text-blue-200/70 text-sm md:text-base">
              글로벌 항해사들이 가장 선호하는 정박지 정보를 업데이트하고 있습니다.
            </p>
          </div>
          {/* 🚩 [BACKEND] 정윤석님: 스토리 작성 버튼 클릭 시 글쓰기 페이지로 이동하거나 모달을 띄우는 기능 연동 */}
          <button className="w-full md:w-auto bg-yellow-400 text-[#003366] px-8 py-4 rounded-2xl font-black hover:bg-yellow-300 transition-all shadow-lg active:scale-95">
            스토리 작성하기
          </button>
        </section>

        <footer className="text-center py-10 text-gray-300 text-xs">
          © 2026 Global Marina Hub Curation Service.
        </footer>
      </div>
    </div>
  );
}