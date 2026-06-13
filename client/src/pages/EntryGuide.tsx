import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink, CheckCircle, AlertTriangle } from 'lucide-react'; // 아이콘 라이브러리 (필요시 사용)

export default function MapChat() {
  // 'guide' 네임스페이스를 사용하여 guide.json 데이터를 로드합니다.
  const { t } = useTranslation('guide');
  
  // 체크박스 선택 상태를 관리하는 배열 (1단계~7단계)
  const [checkedSteps, setCheckedSteps] = useState<number[]>([]);

  // 체크박스 토글 함수
  const handleToggleStep = (stepNumber: number) => {
    setCheckedSteps((prev) =>
      prev.includes(stepNumber)
        ? prev.filter((id) => id !== stepNumber)
        : [...prev, stepNumber]
    );
  };

  // 1부터 7까지의 단계를 나타내는 배열
  const stepsArray = [1, 2, 3, 4, 5, 6, 7];

  return (
    <div className="flex flex-col w-full h-full bg-slate-900 text-slate-100 p-4 border-l border-slate-800 overflow-y-auto">
      {/* 가이드 헤더 영역 */}
      <div className="mb-6 border-b border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-cyan-400 flex items-center gap-2">
          ⚓ {t('page_title')}
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {t('page_hint')}
        </p>
      </div>

      {/* 7단계 체크리스트 루프 영역 */}
      <div className="space-y-3 flex-1">
        {stepsArray.map((num) => {
          const isChecked = checkedSteps.includes(num);
          
          // guide.json의 동적 키 매핑 처리
          const title = t(`step${num}_title`);
          const desc = t(`step${num}_desc`);
          const danger = t(`step${num}_danger`);
          const siteName = t(`step${num}_site_name`);
          const url = t(`step${num}_url`);

          return (
            <div
              key={num}
              className={`p-3.5 rounded-xl border transition-all duration-200 ${
                isChecked
                  ? 'bg-slate-800/30 border-cyan-500/40 opacity-75'
                  : 'bg-slate-800/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* 1. 체크박스 */}
                <input
                  type="checkbox"
                  id={`step-${num}`}
                  checked={isChecked}
                  onChange={() => handleToggleStep(num)}
                  className="mt-1 w-4.5 h-4.5 rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 bg-slate-950 cursor-pointer"
                />

                {/* 2. 콘텐츠 본문 */}
                <div className="flex-1 min-w-0">
                  <label
                    htmlFor={`step-${num}`}
                    className={`block text-sm font-bold cursor-pointer select-none ${
                      isChecked ? 'text-slate-500 line-through' : 'text-slate-200'
                    }`}
                  >
                    {t('step')} {num}: {title}
                  </label>
                  
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    {desc}
                  </p>

                  {/* 패널티/위험 경고 문구 (존재할 경우에만 표시) */}
                  {danger && (
                    <p className="text-[11px] text-amber-400/90 flex items-center gap-1 mt-1 font-medium">
                      <span className="text-amber-500">⚠️</span> {danger}
                    </p>
                  )}

                  {/* ✨ 국가 행정 기관 공식 사이트 연동 링크 (하이퍼링크 칩) */}
                  {url && siteName && (
                    <div className="mt-2.5">
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-cyan-400 bg-cyan-950/40 border border-cyan-800/50 rounded-md hover:bg-cyan-950/80 hover:border-cyan-400 hover:text-cyan-300 transition-all shadow-sm"
                      >
                        <span>{siteName}</span>
                        <span className="text-[10px] opacity-80">↗</span>
                      </a>
                    </div>
                  )}
                </div>

                {/* 완료 시 체크 마크 표시 */}
                {isChecked && (
                  <span className="text-cyan-500 text-xs font-bold self-center bg-cyan-950/50 px-2 py-0.5 rounded-md border border-cyan-500/30">
                    {t('status_done')}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 최종 보고서 제출 버튼 영역 */}
      <div className="mt-5 pt-4 border-t border-slate-800">
        <button
          disabled={checkedSteps.length !== 7}
          className={`w-full py-3 rounded-xl font-bold text-sm transition-all shadow-md ${
            checkedSteps.length === 7
              ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 active:scale-[0.99]'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          {t('btn_submit_report')} ({checkedSteps.length}/7)
        </button>
      </div>
    </div>
  );
}