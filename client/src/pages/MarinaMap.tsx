import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, ZoomControl } from 'react-leaflet';
import { Search, Wind, Waves, Thermometer, Zap, Droplet, X, Droplets, Anchor, Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import 'leaflet/dist/leaflet.css';

const MOCK_MARINAS = [
  { id: 1, nameKey: 'marina_yeosu', lat: 34.746, lng: 127.731, depth: 5.2, maxVessel: 45, desc: '전남 여수에 위치한 프리미엄 마리나.' },
  { id: 2, nameKey: 'marina_busan', lat: 35.161, lng: 129.138, depth: 6.5, maxVessel: 60, desc: '국제 마리나.' },
];

export default function MarinaMap() {
  const { t } = useTranslation('map');
  const [selectedMarina, setSelectedMarina] = useState<any>(null);
  const [marinas, setMarinas] = useState(MOCK_MARINAS);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#f8fafc]">
      
      {/* 1. 메인 지도 영역 */}
      <div className="absolute inset-0 w-full h-full z-0">
        <MapContainer 
          center={[36.5, 127.5]} 
          zoom={7} 
          className="h-full w-full"
          zoomControl={false} // 기본 컨트롤을 끄고 커스텀 위치에 배치합니다.
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          {/* 🚩 확대/축소 버튼 위치를 햄버거 버튼과 맞추기 위해 커스텀 배치 */}
          <ZoomControl position="topleft" /> 

          {marinas.map(m => (
            <Marker 
              key={m.id} 
              position={[m.lat, m.lng]} 
              eventHandlers={{ click: () => {
                setSelectedMarina(m);
                setIsSidebarOpen(false); 
              }}}
            />
          ))}
        </MapContainer>
      </div>

      {/* 🍔 [디자인 개선] 메뉴 버튼 - 지도 컨트롤 바로 아래에 일체감 있게 배치 */}
      {!isSidebarOpen && (
        <div className="absolute top-[84px] left-[10px] z-[1002]">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="w-[34px] h-[34px] bg-white text-[#003366] rounded-[4px] border-2 border-black/20 shadow-sm hover:bg-gray-100 flex items-center justify-center transition-colors"
            title="메뉴 열기"
          >
            <Menu size={18} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* 2. 왼쪽 사이드바 (Overlay 방식) */}
      <aside 
        className={`
          absolute top-0 left-0 z-[1005] w-80 h-full bg-white shadow-2xl flex flex-col border-r border-gray-200 transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="p-5 bg-[#003366] text-white flex justify-between items-center shadow-md">
          <h2 className="text-xl font-bold flex items-center gap-2 tracking-tight">
            <Anchor className="text-yellow-400" size={22} /> {t('sidebar_title')}
          </h2>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 bg-gray-50/50 border-b border-gray-100">
          <div className="relative group">
            <input 
              type="text" 
              placeholder={t('search_placeholder')} 
              className="w-full p-2.5 pl-10 rounded-xl bg-white border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition-all" 
            />
            <Search className="absolute left-3 top-3 text-gray-400 group-focus-within:text-[#003366] transition-colors" size={16} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">마리나 목록</p>
          {marinas.map(m => (
            <div 
              key={m.id} 
              onClick={() => setSelectedMarina(m)}
              className={`group p-4 border rounded-2xl cursor-pointer transition-all duration-200 hover:shadow-md ${
                selectedMarina?.id === m.id 
                ? 'border-[#003366] bg-blue-50/30 ring-1 ring-[#003366]' 
                : 'border-gray-100 bg-white hover:border-gray-300'
              }`}
            >
              <h3 className={`font-bold transition-colors ${selectedMarina?.id === m.id ? 'text-[#003366]' : 'text-gray-700 group-hover:text-[#003366]'}`}>
                {t(m.nameKey)}
              </h3>
              <div className="flex gap-2 mt-2">
                <span className="bg-white text-[#003366] text-[11px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 border border-gray-100 shadow-sm">
                  <Droplets size={12} className="text-blue-500" /> {m.depth}m
                </span>
                <span className="bg-white text-gray-500 text-[11px] font-bold px-2 py-1 rounded-lg border border-gray-100 shadow-sm">
                  {m.maxVessel} Vessels
                </span>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* 3. 오른쪽 상세 정보 사이드바 */}
      {selectedMarina && (
        <div className="fixed md:absolute inset-y-0 right-0 w-full md:w-[400px] bg-white z-[2000] shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.1)] flex flex-col animate-in slide-in-from-right duration-500">
          <div className="bg-[#003366] text-white p-6 relative overflow-hidden">
            {/* 배경 장식 아이콘 */}
            <Anchor className="absolute -right-4 -bottom-4 text-white/5 w-32 h-32 rotate-12" />
            
            <button onClick={() => setSelectedMarina(null)} className="absolute top-6 right-6 p-2 hover:bg-white/20 rounded-xl transition-colors z-10">
              <X size={24} />
            </button>
            <span className="text-yellow-400 text-xs font-bold uppercase tracking-[0.2em] block mb-2">{t('detail_label')}</span>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{t(selectedMarina.nameKey)}</h2>
          </div>

          <div className="p-6 md:p-8 space-y-8 overflow-y-auto">
            <section>
              <div className="flex justify-between items-end mb-4">
                <h4 className="font-bold text-gray-800 flex items-center gap-2">
                  <span className="w-1 h-5 bg-blue-500 rounded-full"></span>
                  {t('weather_title')}
                </h4>
                <span className="text-[10px] text-gray-400 font-medium">Updated just now</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <WeatherCard icon={<Wind size={20}/>} label={t('wind_speed')} value="8.5m/s" colorClass="bg-blue-50 text-blue-600 border-blue-100" />
                <WeatherCard icon={<Waves size={20}/>} label={t('wave_height')} value="1.2m" colorClass="bg-cyan-50 text-cyan-600 border-cyan-100" />
                <WeatherCard icon={<Thermometer size={20}/>} label={t('tide_state')} value="만조" colorClass="bg-emerald-50 text-emerald-600 border-emerald-100" />
              </div>
            </section>

            <section>
              <h4 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
                <span className="w-1 h-5 bg-green-500 rounded-full"></span>
                {t('infra_title')}
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <FacilityButton icon={<Zap size={18}/>} label={t('power_supply')} colorClass="bg-white text-gray-700 border-gray-200 hover:border-green-500 hover:text-green-600" />
                <FacilityButton icon={<Droplet size={18}/>} label={t('water_supply')} colorClass="bg-white text-gray-700 border-gray-200 hover:border-blue-500 hover:text-blue-600" />
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

// 디자인 최적화된 하단 컴포넌트들
function WeatherCard({ icon, label, value, colorClass }: any) {
  return (
    <div className={`p-4 rounded-2xl border ${colorClass} flex flex-col items-center gap-2 shadow-sm transition-transform hover:scale-105`}>
      <div className="p-2 bg-white rounded-xl shadow-sm">{icon}</div>
      <span className="text-lg font-extrabold tracking-tight">{value}</span>
      <span className="text-[9px] opacity-70 font-bold uppercase tracking-wider text-center">{label}</span>
    </div>
  );
}

function FacilityButton({ icon, label, colorClass }: any) {
  return (
    <button className={`flex items-center justify-center gap-3 p-4 rounded-2xl border font-bold text-sm transition-all active:scale-95 shadow-sm ${colorClass}`}>
      {icon} {label}
    </button>
  );
}