import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { Search, Wind, Waves, Thermometer, Zap, Droplet, X, Droplets, Anchor } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import 'leaflet/dist/leaflet.css';

// 🚩 [데이터 수정] name 대신 nameKey를 사용하도록 변경했습니다.
const MOCK_MARINAS = [
  { id: 1, nameKey: 'marina_yeosu', lat: 34.746, lng: 127.731, depth: 5.2, maxVessel: 45, desc: '전남 여수에 위치한 프리미엄 마리나.' },
  { id: 2, nameKey: 'marina_busan', lat: 35.161, lng: 129.138, depth: 6.5, maxVessel: 60, desc: '국제 마리나.' },
];

export default function MarinaMap() {
  const { t } = useTranslation('map');
  const [selectedMarina, setSelectedMarina] = useState<any>(null);
  const [marinas, setMarinas] = useState(MOCK_MARINAS);

  useEffect(() => {
    // 🚩 [BACKEND] 정윤석님: 서버 API 연동 지점
    // axios.get('/api/marinas').then(res => setMarinas(res.data));
  }, []);

  return (
    <div className="relative flex flex-col md:flex-row h-full w-full overflow-hidden bg-white">
      
      {/* 1. 사이드바 (리스트 및 검색) */}
      <aside className="z-[1001] w-full h-[35%] md:h-full md:w-80 bg-white shadow-2xl flex flex-col border-r border-b md:border-b-0">
        <div className="p-4 md:p-5 border-b bg-[#003366] text-white">
          <h2 className="text-lg md:text-xl font-bold flex items-center gap-2 mb-3 md:mb-4">
            <Anchor className="text-yellow-400" size={20} /> {t('sidebar_title')}
          </h2>
          
          <div className="relative">
            <input 
              type="text" 
              placeholder={t('search_placeholder')} 
              className="w-full p-2 md:p-2.5 pl-9 md:pl-10 rounded-lg text-black text-xs md:text-sm outline-none focus:ring-2 focus:ring-yellow-400" 
            />
            <Search className="absolute left-3 top-2.5 md:top-3 text-gray-400" size={16} />
          </div>
        </div>
        
        <div className="p-3 md:p-4 bg-gray-50 border-b text-[10px] md:text-xs space-y-2 md:space-y-3">
          <label className="block mb-1 text-gray-600 font-bold uppercase tracking-wider">{t('filter_depth')}</label>
          <input type="range" className="w-full accent-[#003366] cursor-pointer" />
        </div>

        <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2 md:space-y-3 bg-gray-50/50">
          {marinas.map(m => (
            <div 
              key={m.id} 
              onClick={() => setSelectedMarina(m)}
              className={`p-3 md:p-4 border-2 rounded-xl cursor-pointer transition-all bg-white shadow-sm hover:border-[#003366] ${selectedMarina?.id === m.id ? 'border-[#003366] ring-2 ring-[#003366]/20' : 'border-transparent'}`}
            >
              {/* 🚩 [수정] m.name 대신 t(m.nameKey)를 사용합니다. */}
              <h3 className="font-bold text-[#003366] text-sm md:text-lg">{t(m.nameKey)}</h3>
              <div className="flex gap-2 mt-1 md:mt-2">
                <span className="bg-blue-50 text-blue-700 text-[9px] md:text-[11px] font-bold px-1.5 md:px-2 py-0.5 md:py-1 rounded-md flex items-center gap-1 border border-blue-100">
                  <Droplets size={10} /> {m.depth}m
                </span>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* 2. 메인 지도 영역 */}
      <div className="flex-1 w-full h-[65%] md:h-full relative">
        <MapContainer center={[36.5, 127.5]} zoom={7} className="h-full w-full">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {marinas.map(m => (
            <Marker 
              key={m.id} 
              position={[m.lat, m.lng]} 
              eventHandlers={{ click: () => setSelectedMarina(m) }}
            />
          ))}
        </MapContainer>
      </div>

      {/* 3. 오른쪽 상세 정보 사이드바 */}
      {selectedMarina && (
        <div className="fixed md:absolute inset-0 md:inset-y-0 md:right-0 w-full md:w-96 bg-white z-[2000] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          <div className="bg-[#003366] text-white p-5 md:p-6 relative">
            <button onClick={() => setSelectedMarina(null)} className="absolute top-5 right-5 p-1.5 hover:bg-white/20 rounded-full transition-colors">
              <X size={24} />
            </button>
            <span className="text-yellow-400 text-[10px] md:text-xs font-bold uppercase tracking-widest block mb-1">{t('detail_label')}</span>
            {/* 🚩 [수정] selectedMarina.name 대신 t(selectedMarina.nameKey)를 사용합니다. */}
            <h2 className="text-xl md:text-2xl font-bold">{t(selectedMarina.nameKey)}</h2>
          </div>

          <div className="p-5 md:p-6 space-y-6 md:space-y-8 overflow-y-auto">
            <section>
              <h4 className="flex items-center gap-2 font-bold mb-3 md:mb-4 text-gray-800 border-l-4 border-blue-500 pl-3">{t('weather_title')}</h4>
              <div className="grid grid-cols-3 gap-2 md:gap-3">
                <WeatherCard icon={<Wind size={18}/>} label={t('wind_speed')} value="8.5m/s" colorClass="bg-blue-50 text-blue-500 border-blue-100" />
                <WeatherCard icon={<Waves size={18}/>} label={t('wave_height')} value="1.2m" colorClass="bg-cyan-50 text-cyan-500 border-cyan-100" />
                <WeatherCard icon={<Thermometer size={18}/>} label={t('tide_state')} value="만조" colorClass="bg-emerald-50 text-emerald-500 border-emerald-100" />
              </div>
            </section>

            <section>
              <h4 className="font-bold mb-3 md:mb-4 text-gray-800 border-l-4 border-green-500 pl-3">{t('infra_title')}</h4>
              <div className="grid grid-cols-2 gap-2 md:gap-3">
                <FacilityButton icon={<Zap size={16}/>} label={t('power_supply')} colorClass="bg-green-50 text-green-700 border-green-200" />
                <FacilityButton icon={<Droplet size={16}/>} label={t('water_supply')} colorClass="bg-blue-50 text-blue-700 border-blue-200" />
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

function WeatherCard({ icon, label, value, colorClass }: any) {
  return (
    <div className={`p-2 md:p-4 rounded-xl md:rounded-2xl border ${colorClass} flex flex-col items-center gap-1 shadow-sm`}>
      <div className="mb-0.5 md:mb-1">{icon}</div>
      <span className="text-sm md:text-lg font-bold text-gray-800">{value}</span>
      <span className="text-[8px] md:text-[10px] text-gray-400 font-bold uppercase">{label}</span>
    </div>
  );
}

function FacilityButton({ icon, label, colorClass }: any) {
  return (
    <button className={`flex items-center justify-center gap-2 p-2.5 md:p-3.5 rounded-lg md:rounded-xl border font-bold text-xs md:text-sm transition-all active:scale-95 ${colorClass}`}>
      {icon} {label}
    </button>
  );
}