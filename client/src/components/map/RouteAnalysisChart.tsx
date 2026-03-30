import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Waves, X, Navigation, Clock, MapPin, Thermometer, Wind, AlertTriangle } from 'lucide-react';

export default function RouteAnalysisChart({ data, onClose, startNode, endNode }: any) {
  // [안전 장치] 데이터가 없거나 종료 중일 때는 아무것도 렌더링하지 않음
  if (!data || data.length === 0 || !startNode || !endNode) return null;

  // 가상 계산 로직 (데이터가 있을 때만 실행)
  const distance = (Math.random() * (40 - 15) + 15).toFixed(1);
  const travelTime = Math.round(Number(distance) / 18.5 * 60);

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[3000] w-[95%] max-w-6xl bg-white/95 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_30px_70px_-15px_rgba(0,0,0,0.4)] p-8 border border-white animate-in slide-in-from-bottom duration-500">
      
      {/* 상단: 항로 요약 정보 라인 */}
      <div className="flex items-start justify-between mb-8 border-b border-gray-100 pb-6">
        <div className="flex gap-8">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Route info</span>
            <h4 className="font-black text-2xl text-[#003366] flex items-center gap-2">
              {startNode.name} <Navigation size={18} className="text-gray-300 rotate-90" /> {endNode.name}
            </h4>
          </div>
          
          {/* 주요 수치 정보 카드들 */}
          <div className="flex gap-4">
            <InfoBadge icon={<MapPin size={14}/>} label="총 거리" value={`${distance} km`} color="bg-blue-50 text-blue-600" />
            <InfoBadge icon={<Clock size={14}/>} label="예상 소요" value={`${travelTime} 분`} color="bg-indigo-50 text-indigo-600" />
            <InfoBadge icon={<Wind size={14}/>} label="평균 풍속" value="5.4 m/s" color="bg-cyan-50 text-cyan-600" />
            <InfoBadge icon={<Thermometer size={14}/>} label="수온/기온" value="14.2 / 18.5 °C" color="text-rose-600 bg-rose-50" />
          </div>
        </div>

        {/* 닫기 버튼: e.stopPropagation() 추가로 지도 이벤트 간섭 방지 */}
        <button 
          onClick={(e) => { e.stopPropagation(); onClose(); }} 
          className="p-3 bg-gray-50 text-gray-400 hover:text-red-500 rounded-2xl transition-all"
        >
          <X size={24} />
        </button>
      </div>

      {/* 중앙: 수심 분석 차트 및 브리핑 */}
      <div className="grid grid-cols-4 gap-8">
        <div className="col-span-3 h-48 w-full bg-gray-50/50 rounded-3xl p-4 min-h-[192px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="navDepthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="dist" fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 700}} />
              <YAxis reversed domain={[0, 'auto']} fontSize={10} axisLine={false} tickLine={false} unit="m" tick={{fill: '#94a3b8', fontWeight: 700}} />
              <Tooltip 
                contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '15px' }}
                itemStyle={{ fontSize: '14px', fontWeight: 900, color: '#2563eb' }}
              />
              <Area type="monotone" dataKey="depth" stroke="#2563eb" strokeWidth={4} fill="url(#navDepthGrad)" animationDuration={1500} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 우측: AI 안전 브리핑 창 */}
        <div className="col-span-1 bg-[#003366] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <h5 className="flex items-center gap-2 text-xs font-black text-blue-300 mb-3 uppercase tracking-widest">
              <AlertTriangle size={14} /> Safety Briefing
            </h5>
            <p className="text-sm font-bold leading-relaxed mb-4">
              현재 항로의 최저 수심은 2.8m로 확인됩니다. 흘수가 깊은 선박은 65% 지점 통과 시 주의가 필요합니다.
            </p>
            <div className="text-[11px] text-blue-200 opacity-70 font-medium">기상 조건: 양호 (시정 10km 이상)</div>
          </div>
          <Waves className="absolute -bottom-4 -right-4 text-white/5 w-32 h-32" />
        </div>
      </div>
    </div>
  );
}

function InfoBadge({ icon, label, value, color }: any) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl ${color} transition-all border border-white/20 shadow-sm`}>
      <div className="opacity-80">{icon}</div>
      <div className="flex flex-col">
        <span className="text-[9px] font-black opacity-60 uppercase leading-none mb-1 tracking-tighter">{label}</span>
        <span className="text-sm font-black leading-none">{value}</span>
      </div>
    </div>
  );
}