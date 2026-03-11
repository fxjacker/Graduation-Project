import { useState } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { Search, Ship, Wind, Waves, Thermometer, Zap, Droplet, Fuel, Wifi, X, Droplets } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import 'leaflet/dist/leaflet.css';

// 중요: 백엔드 API 연동 시 정윤석님과 이 데이터 구조(Schema)를 맞춰야 함
const MOCK_MARINAS = [
  { id: 1, name: '여수 마리나', lat: 34.746, lng: 127.731, depth: 5.2, maxVessel: 45, desc: '전남 여수에 위치한 프리미엄 마리나.' },
  { id: 2, name: '부산 수영만 요트경기장', lat: 35.161, lng: 129.138, depth: 6.5, maxVessel: 60, desc: '2002 아시안게임을 위해 건설된 국제 마리나.' },
];

export default function MarinaMap() {
  const { t } = useTranslation();
  
  // 선택된 마리나의 상세 데이터를 담는 상태 (API 통신 결과값 저장 위치)
  const [selectedMarina, setSelectedMarina] = useState<any>(null);

  return (
    // 전체 화면 높이 계산: 헤더 제외 나머지 영역 꽉 채움
    <div className="relative flex h-[calc(100vh-64px)] w-full overflow-hidden">
      
      {/* 왼쪽 사이드바: 검색 및 리스트 제공 */}
      <aside className="z-[1001] w-80 bg-white shadow-xl flex flex-col border-r">
        <div className="p-4 border-b bg-[#003366] text-white">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Ship size={20} /> {t('marina_list', '마리나 목록')}
          </h2>
          {/* 검색 기능: 입력값에 따라 MOCK_MARINAS 필터링 로직 추가 지점 */}
          <div className="mt-3 relative">
            <input type="text" placeholder={t('search_placeholder')} className="w-full p-2 pl-9 rounded text-black text-sm outline-none" />
            <Search className="absolute left-2.5 top-2.5 text-gray-400" size={16} />
          </div>
        </div>
        
        {/* 필터링 기능: 수심 및 선박 크기 조건 필터 */}
        <div className="p-4 bg-gray-50 border-b text-xs space-y-3">
          <div>
            <label className="block mb-1 text-gray-600 font-medium">최소 수심 설정</label>
            <input type="range" className="w-full accent-[#003366]" />
          </div>
        </div>

        {/* 리스트 렌더링: 클릭 시 해당 마리나 데이터 상태 업데이트 */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {MOCK_MARINAS.map(m => (
            <div 
              key={m.id} 
              onClick={() => setSelectedMarina(m)}
              className={`p-3 border rounded-lg cursor-pointer transition-all bg-white shadow-sm hover:border-[#003366] ${selectedMarina?.id === m.id ? 'border-[#003366] ring-1 ring-[#003366]' : ''}`}
            >
              <h3 className="font-bold text-[#003366]">{m.name}</h3>
              <div className="flex gap-2 mt-1">
                <span className="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
                  <Droplets size={10} /> {m.depth}m
                </span>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* 메인 지도: Leaflet 엔진 활용 실시간 위치 시각화 */}
      <div className="flex-1 relative">
        <MapContainer center={[36.5, 127.5]} zoom={7} className="h-full w-full">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          {/* 마커 렌더링: 데이터의 위경도 좌표를 지도에 표시 */}
          {MOCK_MARINAS.map(m => (
            <Marker 
              key={m.id} 
              position={[m.lat, m.lng]} 
              eventHandlers={{ click: () => setSelectedMarina(m) }}
            />
          ))}
        </MapContainer>
      </div>

      {/* 상세 정보창: 클릭된 마리나의 실시간 API 데이터 시각화 오버레이 */}
      {selectedMarina && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white z-[2000] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          <div className="bg-[#003366] text-white p-5 relative">
            <button onClick={() => setSelectedMarina(null)} className="absolute top-4 right-4 p-1 hover:bg-white/10 rounded-full transition-colors">
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold">{selectedMarina.name}</h2>
          </div>

          <div className="p-6 space-y-8 overflow-y-auto">
            {/* 실시간 기상 데이터: 기상청 API 연동 지점 */}
            <section>
              <h4 className="flex items-center gap-2 font-bold mb-4 text-gray-800 border-l-4 border-blue-500 pl-2">실시간 기상 및 해상 정보</h4>
              <div className="grid grid-cols-3 gap-3">
                <WeatherCard icon={<Wind size={18}/>} label="풍속" value="8.5m/s" color="blue" />
                <WeatherCard icon={<Waves size={18}/>} label="파고" value="1.2m" color="cyan" />
                <WeatherCard icon={<Thermometer size={18}/>} label="물때" value="만조" color="emerald" />
              </div>
            </section>

            {/* 인프라 현황: 마리나 내부 시설 DB 연동 지점 */}
            <section>
              <h4 className="font-bold mb-4 text-gray-800 border-l-4 border-green-500 pl-2">정박 인프라 현황</h4>
              <div className="grid grid-cols-2 gap-3">
                <FacilityButton icon={<Zap size={16}/>} label="전력 공급" color="green" />
                <FacilityButton icon={<Droplet size={16}/>} label="상수도" color="blue" />
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

// 재사용 UI: 기상 정보 카드 컴포넌트
function WeatherCard({ icon, label, value, color }: any) {
  return (
    <div className={`p-3 rounded-xl bg-${color}-50 border border-${color}-100 flex flex-col items-center gap-1 shadow-sm`}>
      <div className={`text-${color}-500`}>{icon}</div>
      <span className="text-lg font-bold text-gray-800">{value}</span>
      <span className="text-[10px] text-gray-400 font-medium">{label}</span>
    </div>
  );
}

// 재사용 UI: 시설 안내 버튼 컴포넌트
function FacilityButton({ icon, label, color }: any) {
  return (
    <button className={`flex items-center justify-center gap-2 p-3 rounded-lg border border-${color}-200 bg-${color}-50 text-${color}-700 font-semibold text-sm hover:brightness-95 transition-all active:scale-95`}>
      {icon} {label}
    </button>
  );
}