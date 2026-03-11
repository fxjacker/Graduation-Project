import { Ship, ShieldCheck, Globe, Map as MapIcon, ChevronRight, Anchor } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function MainLanding() {
  const { t } = useTranslation('main');

  return (
    // 전체 페이지를 감싸는 컨테이너: h-full과 overflow-y-auto로 스크롤 가능하게 설정
    <div className="flex flex-col w-full h-full overflow-y-auto bg-white">
      
      {/* --- 1. Hero Section: 메인 비주얼 --- */}
      {/* md:h-[600px]로 PC 높이 고정, 모바일은 내용에 맞춰 늘어나도록 설정 */}
      <section className="relative min-h-[500px] md:h-[600px] flex items-center justify-center bg-[#003366] text-white overflow-hidden px-6 py-20 md:py-0">
        
        {/* 배경 디자인: 모바일에서는 아이콘 크기를 줄여서 배치가 깨지지 않게 조절 */}
        <div className="absolute inset-0 opacity-10 flex justify-center items-center pointer-events-none">
          <Ship className="w-[300px] h-[300px] md:w-[500px] md:h-[500px]" strokeWidth={0.5} />
        </div>
        
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          {/* 🚩 [BACKEND] 정윤석님: 서비스 메인 타이틀이나 문구를 관리자 페이지(DB)에서 수정 가능하게 할 경우 연동 필요 */}
          <h1 className="text-4xl md:text-7xl font-extrabold mb-6 tracking-tight leading-tight">
            Global Marina <br />
            <span className="text-yellow-400">Navigation Hub</span>
          </h1>
          
          <p className="text-base md:text-xl text-blue-100/80 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            대통령 민생토론회에서 제기된 해양 행정 사각지대 해소, <br className="hidden md:block" />
            실시간 데이터 기반의 안전하고 스마트한 입항 가이드를 시작하세요.
          </p>

          {/* 버튼 영역: 모바일에서는 위아래로 쌓임(flex-col), PC는 나란히(sm:flex-row) */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/map" className="w-full sm:w-auto px-10 py-4 bg-yellow-400 text-[#003366] rounded-full font-bold text-lg hover:scale-105 transition-all shadow-lg flex items-center justify-center gap-2">
              <MapIcon size={20} /> {t('view_map', '실시간 지도 보기')}
            </Link>
            <Link to="/guide" className="w-full sm:w-auto px-10 py-4 bg-white/10 backdrop-blur-md border border-white/30 rounded-full font-bold text-lg hover:bg-white/20 transition-all flex items-center justify-center gap-2">
              <ShieldCheck size={20} /> {t('start_guide', '입항 가이드 시작')}
            </Link>
          </div>
        </div>
      </section>

      {/* --- 2. Problem & Solution: 핵심 기능 소개 --- */}
      <section className="py-16 md:py-24 bg-white px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 md:mb-20">
            <h2 className="text-2xl md:text-4xl font-bold text-[#003366] mb-4">현장의 목소리에 답하는 3가지 솔루션</h2>
            <div className="w-20 h-1.5 bg-yellow-400 mx-auto rounded-full"></div>
          </div>
          
          {/* 그리드 레이아웃: 모바일 1열(기본), PC 3열(md:grid-cols-3) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16">
            {/* 솔루션 1 */}
            <div className="group flex flex-col items-center text-center p-6 rounded-3xl hover:bg-gray-50 transition-colors">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform">
                <ShieldCheck size={36} />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">의도치 않은 범법 예방</h3>
              <p className="text-gray-500 text-sm md:text-base leading-relaxed">
                복잡한 해양 법규를 7단계 스마트 체크리스트로 시각화하여 외국인 선장의 사법 리스크를 최소화합니다.
              </p>
            </div>

            {/* 솔루션 2 */}
            <div className="group flex flex-col items-center text-center p-6 rounded-3xl hover:bg-gray-50 transition-colors">
              <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform">
                <Anchor size={36} />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">실시간 인프라 정보</h3>
              {/* 🚩 [BACKEND] 정윤석님: 나중에 '142년 전 데이터가 아닌'이라는 문구 옆에 실제 연동된 API 개수 등을 표기하면 신뢰도 상승 */}
              <p className="text-gray-500 text-sm md:text-base leading-relaxed">
                기상청/해수부 API 연동을 통한 실시간 수심 및 기상 데이터를 제공하여 항해의 안전성을 높입니다.
              </p>
            </div>

            {/* 솔루션 3 */}
            <div className="group flex flex-col items-center text-center p-6 rounded-3xl hover:bg-gray-50 transition-colors">
              <div className="w-20 h-20 bg-purple-50 text-purple-500 rounded-3xl flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform">
                <Globe size={36} />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">완벽한 다국어 지원</h3>
              <p className="text-gray-500 text-sm md:text-base leading-relaxed">
                해외 항해사를 위한 고품질 영문 인터페이스와 단위 변환을 지원하여 글로벌 마리나로 도약합니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- 3. CTA: 마지막 행동 유도 --- */}
      <section className="py-16 md:py-24 px-6 bg-gray-50">
        {/* 모바일에서는 패딩을 줄이고(p-8), PC에서는 넉넉하게(p-16) */}
        <div className="max-w-5xl mx-auto bg-[#003366] rounded-[2rem] md:rounded-[3rem] p-8 md:p-16 flex flex-col md:flex-row items-center justify-between text-white shadow-2xl gap-8">
          <div className="text-center md:text-left">
            {/* 🚩 [BACKEND] 정윤석님: '전국 30여 개' 숫자를 DB에 등록된 실제 마리나 숫자로 치환 가능 */}
            <h2 className="text-2xl md:text-4xl font-bold mb-4">지금 바로 스마트한 항해를 경험하세요</h2>
            <p className="text-blue-200 md:text-lg">전국 30여 개 마리나의 데이터를 실시간으로 확인 가능합니다.</p>
          </div>
          
          <Link to="/map" className="group bg-yellow-400 text-[#003366] px-10 py-5 rounded-2xl font-bold text-lg flex items-center gap-2 hover:bg-yellow-300 transition-all whitespace-nowrap">
            무료로 시작하기 <ChevronRight className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>
      
      {/* 푸터 영역 (선택 사항) */}
      <footer className="py-10 text-center text-gray-400 text-sm border-t border-gray-100">
        © 2026 Global Marina Navigation Hub. All rights reserved.
      </footer>
    </div>
  );
}