import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, ShieldAlert, FileText, Anchor, Activity, Landmark, Ship, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// 입항 가이드 7단계 데이터
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
  
  // 사용자가 완료한 단계의 ID를 저장하는 배열
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // 🚩 [BACKEND] 정윤석님: 로그인한 유저가 이전에 어디까지 완료했는지 DB에서 불러오는 로직이 필요합니다.
  useEffect(() => {
    // axios.get('/api/user/progress').then(res => setCompletedSteps(res.data.steps));
  }, []);

  // 특정 단계 완료 처리
  const toggleStep = (id: number) => {
    const newSteps = completedSteps.includes(id) 
      ? completedSteps.filter(stepId => stepId !== id) 
      : [...completedSteps, id];
    
    setCompletedSteps(newSteps);
    
    // 🚩 [BACKEND] 정윤석님: 사용자가 체크를 할 때마다 실시간으로 DB에 저장하거나, 로컬스토리지에 저장하는 로직
    // axios.patch('/api/user/progress', { steps: newSteps });
  };

  const progressPercent = Math.round((completedSteps.length / ENTRY_STEPS.length) * 100);

  return (
    // h-full과 overflow-y-auto로 휴대폰에서도 부드럽게 스크롤 되도록 설정
    <div className="h-full w-full bg-gray-50 p-4 md:p-8 flex flex-col items-center overflow-y-auto">
      
      {/* 1. 상단 프로그레스 바 영역: max-w-3xl로 PC에서 너무 퍼지지 않게 조절 */}
      <div className="w-full max-w-3xl bg-white p-5 md:p-8 rounded-[2rem] shadow-sm mb-6 border border-gray-100">
        <div className="flex justify-between items-end mb-4">
          <div>
            <span className="text-blue-500 font-bold text-xs md:text-sm uppercase tracking-widest mb-1 block">Smart Check</span>
            <h2 className="text-xl md:text-2xl font-extrabold text-[#003366]">{t('entry_guide_title', '7단계 스마트 입항 가이드')}</h2>
          </div>
          <div className="text-right">
            <span className="text-[#003366] font-black text-3xl md:text-4xl">{progressPercent}%</span>
          </div>
        </div>
        
        <div className="w-full bg-gray-100 h-3 md:h-4 rounded-full overflow-hidden">
          <div 
            className="bg-[#003366] h-full transition-all duration-700 ease-out" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        
        <p className="text-[11px] md:text-sm text-gray-400 mt-4 flex items-center gap-2">
          <AlertCircle size={16} className="text-yellow-500" /> 
          {t('guide_hint', '모든 단계를 완료하여 예기치 못한 사법 리스크를 방지하세요.')}
        </p>
      </div>

      {/* 2. 단계별 체크리스트: 모바일 가독성을 위해 간격 조절 */}
      <div className="w-full max-w-3xl space-y-3 md:space-y-4">
        {ENTRY_STEPS.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          return (
            <div 
              key={step.id}
              onClick={() => toggleStep(step.id)}
              className={`flex items-start md:items-center gap-4 p-4 md:p-6 bg-white rounded-2xl border-2 transition-all cursor-pointer group ${isCompleted ? 'border-[#003366] bg-blue-50/30' : 'border-transparent hover:border-gray-200 hover:shadow-md'}`}
            >
              <div className={`shrink-0 p-3 rounded-2xl transition-colors ${isCompleted ? 'bg-[#003366] text-white' : 'bg-gray-50 text-gray-400 group-hover:bg-gray-100'}`}>
                {step.icon}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Step {index + 1}</span>
                  {isCompleted && <span className="text-[9px] bg-[#003366] text-white px-2 py-0.5 rounded-full font-bold">Done</span>}
                </div>
                <h3 className={`font-bold text-sm md:text-lg truncate ${isCompleted ? 'text-[#003366]' : 'text-gray-800'}`}>{step.title}</h3>
                <p className="text-xs md:text-sm text-gray-500 mb-2">{step.desc}</p>
                
                {/* 법적 위험 안내 */}
                <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-red-50 rounded-md">
                  <ShieldAlert size={12} className="text-red-500" />
                  <span className="text-[10px] md:text-[11px] text-red-600 font-medium">{step.danger}</span>
                </div>
              </div>

              <div className="shrink-0 ml-2">
                {isCompleted ? <CheckCircle2 className="text-[#003366] w-6 h-6 md:w-8 md:h-8" /> : <Circle className="text-gray-200 w-6 h-6 md:w-8 md:h-8" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. 하단 완료 보고 버튼 */}
      <div className="w-full max-w-3xl mt-8 mb-12">
        <button 
          disabled={completedSteps.length !== ENTRY_STEPS.length}
          onClick={() => {
            // 🚩 [BACKEND] 정윤석님: 최종 완료 시 서버에 리포트를 생성하거나 알림을 보내는 API 연동
            alert('입항 보고서가 성공적으로 제출되었습니다!');
          }}
          className="w-full py-4 md:py-5 bg-[#003366] text-white rounded-2xl font-black text-base md:text-lg shadow-xl disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none hover:bg-[#002244] active:scale-[0.98] transition-all"
        >
          최종 입항 보고서 제출 (Submit Final Report)
        </button>
      </div>
      
    </div>
  );
}