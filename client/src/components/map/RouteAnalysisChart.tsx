import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Waves, X, Navigation, Clock, MapPin, Thermometer, Wind, AlertTriangle } from 'lucide-react';

// [핵심 추가] 하버사인 공식: 두 좌표(위도, 경도) 사이의 실제 거리(km) 계산
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // 지구 반지름 (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
};

export default function RouteAnalysisChart({ data, onClose, startNode, endNode }: any) {
  if (!data || data.length === 0 || !startNode || !endNode) return null;

  // 1. 실제 직선 거리 계산 (km)
  const directDistance = calculateDistance(
    startNode.latitude, startNode.longitude, 
    endNode.latitude, endNode.longitude
  );

  // 2. 바닷길 보정 (직선으로 못 가고 우회하므로 보통 1.4배 정도 길어짐)
  const seaDistance = (directDistance * 1.4).toFixed(1);

  // 3. 예상 시간 계산 (평균 선박 속도 12노트 = 약 22km/h 기준)
  const avgSpeed = 22; 
  const travelTimeMinutes = Math.round((Number(seaDistance) / avgSpeed) * 60);
  const hours = Math.floor(travelTimeMinutes / 60);
  const minutes = travelTimeMinutes % 60;

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[3000] w-[95%] max-w-6xl bg-white/95 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl p-8 border border-white animate-in slide-in-from-bottom duration-500">
      
      {/* 상단: 항로 요약 정보 */}
      <div className="flex items-start justify-between mb-8 border-b border-gray-100 pb-6">
        <div className="flex gap-8">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Route info</span>
            <h4 className="font-black text-2xl text-[#003366] flex items-center gap-2">
              {startNode.name} <Navigation size={18} className="text-gray-300 rotate-90" /> {endNode.name}
            </h4>
          </div>
          
          <div className="flex gap-4">
            <InfoBadge icon={<MapPin size={14}/>} label="실제 항로 거리" value={`${seaDistance} km`} color="bg-blue-50 text-blue-600" />
            <InfoBadge icon={<Clock size={14}/>} label="예상 소요 시간" value={hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`} color="bg-indigo-50 text-indigo-600" />
            <InfoBadge icon={<Wind size={14}/>} label="현재 풍속" value="5.4 m/s" color="bg-cyan-50 text-cyan-600" />
            <InfoBadge icon={<Thermometer size={14}/>} label="수온/기온" value="14.2 / 18.5 °C" color="text-rose-600 bg-rose-50" />
          </div>
        </div>

        <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="p-3 bg-gray-50 text-gray-400 hover:text-red-500 rounded-2xl transition-all">
          <X size={24} />
        </button>
      </div>

      {/* 중앙: 차트 및 안전 브리핑 */}
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
              <Tooltip />
              <Area type="monotone" dataKey="depth" stroke="#2563eb" strokeWidth={4} fill="url(#navDepthGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="col-span-1 bg-[#003366] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <h5 className="flex items-center gap-2 text-xs font-black text-blue-300 mb-3 uppercase tracking-widest"><AlertTriangle size={14} /> Safety Briefing</h5>
            <p className="text-sm font-bold leading-relaxed mb-4">
              항로 거리 {seaDistance}km 기준, 안전 속도 유지를 권고합니다. {hours > 0 ? `${hours}시간` : ''} 내 목적지 도착 예정입니다.
            </p>
          </div>
          <Waves className="absolute -bottom-4 -right-4 text-white/5 w-32 h-32" />
        </div>
      </div>
    </div>
  );
}

function InfoBadge({ icon, label, value, color }: any) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl ${color} border border-white/20 shadow-sm`}>
      <div className="opacity-80">{icon}</div>
      <div className="flex flex-col">
        <span className="text-[9px] font-black opacity-60 uppercase mb-1">{label}</span>
        <span className="text-sm font-black leading-none">{value}</span>
      </div>
    </div>
  );
}