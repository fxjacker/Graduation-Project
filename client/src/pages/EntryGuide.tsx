import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, ShieldAlert, FileText, Anchor, Activity, Landmark, Ship, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function EntryGuide() {
  const { t } = useTranslation('guide');
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // 🚩 [BACKEND] 정윤석님: 유저 진행도 데이터 로드
  useEffect(() => {
    // axios.get('/api/user/progress').then(res => setCompletedSteps(res.data.steps));
  }, []);

  const toggleStep = (id: number) => {
    const newSteps = completedSteps.includes(id) 
      ? completedSteps.filter(stepId => stepId !== id) 
      : [...completedSteps, id];
    setCompletedSteps(newSteps);
    // 🚩 [BACKEND] 정윤석님: 진행도 실시간 저장
    // axios.patch('/api/user/progress', { steps: newSteps });
  };

  // 아이콘과 ID 정의 (내용은 JSON에서 t()로 불러옴)
  const ENTRY_STEPS = [
    { id: 1, icon: <FileText size={20} /> },
    { id: 2, icon: <Activity size={20} /> },
    { id: 3, icon: <Landmark size={20} /> },
    { id: 4, icon: <ShieldAlert size={20} /> },
    { id: 5, icon: <Anchor size={20} /> },
    { id: 6, icon: <Ship size={20} /> },
    { id: 7, icon: <AlertCircle size={20} /> },
  ];

  const progressPercent = Math.round((completedSteps.length / ENTRY_STEPS.length) * 100);

  return (
    <div className="h-full w-full bg-gray-50 p-4 md:p-8 flex flex-col items-center overflow-y-auto">
      
      {/* 1. 상단 프로그레스 바 영역 */}
      <div className="w-full max-w-3xl bg-white p-5 md:p-8 rounded-[2rem] shadow-sm mb-6 border border-gray-100">
        <div className="flex justify-between items-end mb-4">
          <div>
            <span className="text-blue-500 font-bold text-xs md:text-sm uppercase tracking-widest mb-1 block">Smart Check</span>
            <h2 className="text-xl md:text-2xl font-extrabold text-[#003366]">{t('page_title')}</h2>
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
          {t('page_hint')}
        </p>
      </div>

      {/* 2. 7단계 체크리스트 */}
      <div className="w-full max-w-3xl space-y-3 md:space-y-4">
        {ENTRY_STEPS.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const stepKey = `step${step.id}`; // JSON 키값 생성 (step1, step2...)

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
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{t('step')} {index + 1}</span>
                  {isCompleted && <span className="text-[9px] bg-[#003366] text-white px-2 py-0.5 rounded-full font-bold">{t('status_done')}</span>}
                </div>
                <h3 className={`font-bold text-sm md:text-lg truncate ${isCompleted ? 'text-[#003366]' : 'text-gray-800'}`}>
                  {t(`${stepKey}_title`)}
                </h3>
                <p className="text-xs md:text-sm text-gray-500 mb-2">
                  {t(`${stepKey}_desc`)}
                </p>
                
                <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-red-50 rounded-md">
                  <ShieldAlert size={12} className="text-red-500" />
                  <span className="text-[10px] md:text-[11px] text-red-600 font-medium">
                    {t(`${stepKey}_danger`)}
                  </span>
                </div>
              </div>

              <div className="shrink-0 ml-2">
                {isCompleted ? <CheckCircle2 className="text-[#003366] w-6 h-6 md:w-8 md:h-8" /> : <Circle className="text-gray-200 w-6 h-6 md:w-8 md:h-8" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. 하단 보고서 제출 버튼 */}
      <div className="w-full max-w-3xl mt-8 mb-12">
        <button 
          disabled={completedSteps.length !== ENTRY_STEPS.length}
          onClick={() => alert(t('btn_submit_report') + ' Success!')}
          className="w-full py-4 md:py-5 bg-[#003366] text-white rounded-2xl font-black text-base md:text-lg shadow-xl disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none hover:bg-[#002244] active:scale-[0.98] transition-all"
        >
          {t('btn_submit_report')}
        </button>
      </div>
      
    </div>
  );
}