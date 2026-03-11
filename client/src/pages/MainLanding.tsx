import { Ship, ShieldCheck, Globe, Map as MapIcon, ChevronRight, Anchor } from 'lucide-react';
import { Link } from 'react-router-dom'; // 페이지 이동을 위한 라우터 링크
import { useTranslation } from 'react-i18next';

export default function MainLanding() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col w-full">
      {/* --- 1. Hero Section: 프로젝트의 핵심 비전 제시 --- */}
      <section className="relative h-[600px] flex items-center justify-center bg-[#003366] text-white overflow-hidden">
        {/* 배경 디자인 요소 (나중에 실제 요트 이미지로 대체 가능) */}
        <div className="absolute inset-0 opacity-20 flex justify-center items-center">
          <Ship size={500} strokeWidth={0.5} />
        </div>
        
        <div className="relative z-10 text-center px-4">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 tracking-tight">
            Global Marina <br />
            <span className="text-yellow-400">Navigation Hub</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            대통령 민생토론회에서 제기된 해양 행정 사각지대 해소, <br />
            실시간 데이터 기반의 안전하고 스마트한 입항 가이드를 시작하세요. //
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/map" className="px-8 py-4 bg-yellow-400 text-[#003366] rounded-full font-bold text-lg hover:scale-105 transition-all shadow-lg flex items-center gap-2">
              <MapIcon size={20} /> 실시간 지도 보기
            </Link>
            <Link to="/entry-guide" className="px-8 py-4 bg-white/10 backdrop-blur-md border border-white/30 rounded-full font-bold text-lg hover:bg-white/20 transition-all flex items-center gap-2">
              <ShieldCheck size={20} /> 입항 가이드 시작
            </Link>
          </div>
        </div>
      </section>

      {/* --- 2. Problem & Solution: 왜 이 서비스가 필요한가? --- */}
      <section className="py-20 bg-white px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-[#003366] mb-16">현장의 목소리에 답하는 3가지 솔루션</h2> //
          
          <div className="grid md:grid-cols-3 gap-12">
            {/* 문제 1: 사법 리스크 해소 */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <ShieldCheck size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3">의도치 않은 범법 예방</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                복잡한 해양 법규를 7단계 스마트 체크리스트로 시각화하여 외국인 선장의 사법 리스크를 최소화합니다. //
              </p>
            </div>

            {/* 문제 2: 실시간 데이터 격차 해소 */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <Anchor size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3">실시간 인프라 정보</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                142년 전 데이터가 아닌 기상청/해수부 API 연동을 통한 실시간 수심 및 기상 데이터를 제공합니다. //
              </p>
            </div>

            {/* 문제 3: 글로벌 영문 서비스 부재 해소 */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <Globe size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3">완벽한 다국어 지원</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                해외 항해사를 위한 고품질 영문 인터페이스와 단위 변환을 지원하여 글로벌 마리나로 도약합니다. //
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- 3. CTA: 마지막 행동 유도 --- */}
      <section className="py-20 bg-gray-50 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-6 bg-[#003366] rounded-3xl p-10 md:p-16 flex flex-col md:flex-row items-center justify-between text-white shadow-2xl">
          <div className="mb-8 md:mb-0">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">지금 바로 스마트한 항해를 경험하세요</h2>
            <p className="text-blue-200">전국 30여 개 마리나의 데이터를 한눈에 확인 가능합니다.</p> //
          </div>
          <Link to="/map" className="group bg-yellow-400 text-[#003366] px-8 py-4 rounded-xl font-bold flex items-center gap-2 hover:bg-yellow-300 transition-all">
            시작하기 <ChevronRight className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>
    </div>
  );
}