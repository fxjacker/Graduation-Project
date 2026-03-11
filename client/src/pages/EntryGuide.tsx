import { useState } from 'react';
import { CheckCircle2, Circle, ChevronRight, ShieldAlert, FileText, Anchor, Activity, Landmark, Ship, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// 입항 가이드 7단계 데이터 (글로벌 표준 CIQ 절차 반영)
const ENTRY_STEPS = [
  { id: 1, title: '영해 진입 전 사전 보고', desc: '24시간 전 입항 예정 보고서 제출 여부', icon: <FileText size={20} />, danger: '미보고 시 영해 침범 간주' },
  { id: 2, title: '검역 신고 (Quarantine)', desc: '노란색 기(Q-flag) 게양 및 검역 승인 대기', icon: <Activity size={20} />, danger: '질병 관리법 위반 주의' },
  { id: 3, title: '출입국 심사 (Immigration)', desc: '선원 여권 및 비자 심사 진행', icon: <Landmark size={20} />, danger: '밀입국 방지 및 신원 확인' },
  { id: 4, title: '세관 신고 (Customs)', desc: '선박 적재 물품 및 개인 소지품 신고', icon: <ShieldAlert size={20} />, danger: '관세법 위반 사법 리스크 방지' },
  { id: 5, title: '마리나 선석 예약 및 진입', desc: '관제 센터 교신 및 지정 선석 이동', icon: <Anchor size={20} />, danger: '충돌 및 안전 사고 주의' },
  { id: 6, title: '시설 이용 행정 등록', desc: '마리나 사무소 방문 및 서류 제출', icon: <Ship size={20} />, danger: '항만 시설 이용 규칙 준수' },
  { id: 7, title: '국내 법규 최종 숙지', desc: '속도 제한 및 낚시 금지 구역 확인', icon: <AlertCircle size={20} />, danger: '의도치 않은 불법 행위 차단' },
];

export default function EntryGuide() {
  const { t } = useTranslation();
  // 사용자가 완료한 단계의 ID를 저장하는 배열 (백엔드 DB 연동 대상)
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // 특정 단계 완료 처리 (정윤석님이 만들 유저별 진행률 API와 연동될 부분)
  const toggleStep = (id: number) => {
    setCompletedSteps(prev => 
      prev.includes(id) ? prev.filter(stepId => stepId !== id) : [...prev, id]
    );
  };

  // 현재 진행률 계산 (% 단위)
  const progressPercent = Math.round((completedSteps.length / ENTRY_STEPS.length) * 100);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 p-6 flex flex-col items-center">
      {/* 상단 프로그레스 바: 전체 진행 상황 시각화 */}
      <div className="w-full max-w-3xl bg-white p-6 rounded-2xl shadow-sm mb-6">
        <div className="flex justify-between items-end mb-2">
          <h2 className="text-xl font-bold text-[#003366]">{t('entry_guide_title', '7단계 스마트 입항 가이드')}</h2>
          <span className="text-[#003366] font-bold text-2xl">{progressPercent}%</span>
        </div>
        <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
          <div 
            className="bg-[#003366] h-full transition-all duration-500" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-3 flex items-center gap-1">
          <AlertCircle size={14} /> {t('guide_hint', '모든 단계를 완료하여 사법 리스크를 방지하세요.')}
        </p>
      </div>

      {/* 단계별 체크리스트 카드 섹션 */}
      <div className="w-full max-w-3xl space-y-4">
        {ENTRY_STEPS.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          return (
            <div 
              key={step.id}
              onClick={() => toggleStep(step.id)}
              className={`flex items-center gap-4 p-5 bg-white rounded-xl border-2 transition-all cursor-pointer hover:shadow-md ${isCompleted ? 'border-green-500 bg-green-50' : 'border-transparent'}`}
            >
              <div className={`p-3 rounded-full ${isCompleted ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                {step.icon}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 uppercase">Step {index + 1}</span>
                  {isCompleted && <span className="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded-full">Completed</span>}
                </div>
                <h3 className={`font-bold ${isCompleted ? 'text-green-700' : 'text-[#003366]'}`}>{step.title}</h3>
                <p className="text-sm text-gray-500">{step.desc}</p>
                {/* 법적 위험 안내 (대통령 민생토론회 강조 사항) */}
                <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                  <ShieldAlert size={12} /> {step.danger}
                </p>
              </div>

              <div>
                {isCompleted ? <CheckCircle2 className="text-green-500" /> : <Circle className="text-gray-300" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* 하단 완료 보고 버튼: 백엔드에 최종 상태를 전송할 지점 */}
      <button 
        disabled={completedSteps.length !== ENTRY_STEPS.length}
        className="mt-10 px-10 py-4 bg-[#003366] text-white rounded-full font-bold shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-[#002244] transition-all"
      >
        최종 입항 보고서 제출 (Submit Report)
      </button>
    </div>
  );
}