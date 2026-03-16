import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, ZoomControl, useMap, useMapEvents } from 'react-leaflet';
import { Search, Wind, Waves, Thermometer, Zap, Droplet, X, Droplets, Anchor, Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// 🏹 조류 화살표 레이어 (정리 버전)
function TidalCurrentLayer() {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  const [currents, setCurrents] = useState<any[]>([]);

  // 줌 레벨 감지
  useMapEvents({ zoomend: () => setZoom(map.getZoom()) });

  useEffect(() => {
    async function fetchTidalCurrents() {
      const { data } = await supabase.from('tidal_current_observations').select('*');
      if (data) setCurrents(data);
    }
    fetchTidalCurrents();
  }, []);

  // 줌이 낮을 땐(멀리 있을 땐) 안 보이게 해서 정신없음을 방지
  if (zoom < 8) return null;

  const createArrowIcon = (direction: number, speed: number) => {
    const color = speed > 2.0 ? '#e74c3c' : speed > 1.0 ? '#f1c40f' : '#3498db';
    const iconHtml = `
      <div style="transform: rotate(${direction}deg); opacity: 0.7;">
        <svg viewBox="0 0 100 100" width="16" height="16">
          <path d="M50 10 L50 90 M50 10 L30 40 M50 10 L70 40" stroke="${color}" stroke-width="12" fill="none" stroke-linecap="round"/>
        </svg>
      </div>`;
    return new L.DivIcon({ html: iconHtml, className: 'tidal-icon', iconSize: [16, 16] });
  };

  return (
    <>
      {/* 5개당 1개만 찍어서 깔끔하게 표시 (샘플링) */}
      {currents.filter((_, i) => i % 5 === 0).map((c, i) => (
        <Marker key={i} position={[parseFloat(c.latitude), parseFloat(c.longitude)]} icon={createArrowIcon(c.current_direction, c.current_speed)} />
      ))}
    </>
  );
}

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => { map.flyTo(center, zoom, { duration: 1.5 }); }, [center, zoom, map]);
  return null;
}

export default function MarinaMap() {
  const { t } = useTranslation('map');
  const [selectedMarina, setSelectedMarina] = useState<any>(null);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [oceanData, setOceanData] = useState<any>(null);
  const [marinas, setMarinas] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [mapConfig, setMapConfig] = useState({ center: [36.5, 127.5] as [number, number], zoom: 7 });

  useEffect(() => {
    async function fetchMarinas() {
      const { data } = await supabase.from('marina_list').select('*');
      if (data) {
        setMarinas(data.map((m: any) => ({ ...m, latitude: parseFloat(m.latitude), longitude: parseFloat(m.longitude) })));
      }
    }
    fetchMarinas();
  }, []);

  const handleMarinaClick = async (marina: any) => {
    setSelectedMarina(marina);
    setIsSidebarOpen(false);
    setWeatherData(null);
    setOceanData(null);
    setMapConfig({ center: [marina.latitude, marina.longitude], zoom: 14 });

    // 1번 기능: 날씨 + 가장 가까운 관측소 매칭
    const { data: wData } = await supabase.from('weather_observations').select('*').eq('station_id', marina.id).single();
    if (wData) setWeatherData(wData);

    // 거리순 정렬해서 가장 가까운 해양 데이터 1개 가져오기
    const { data: oData } = await supabase.from('ocean_observations').select('*');
    if (oData) {
      // 위경도 기반 단순 거리 비교로 가장 가까운 놈 찾기
      const closest = oData.reduce((prev, curr) => {
        const prevDist = Math.abs(parseFloat(prev.latitude) - marina.latitude) + Math.abs(parseFloat(prev.longitude) - marina.longitude);
        const currDist = Math.abs(parseFloat(curr.latitude) - marina.latitude) + Math.abs(parseFloat(curr.longitude) - marina.longitude);
        return prevDist < currDist ? prev : curr;
      });
      setOceanData(closest);
    }
  };

  // 3번 기능용 그래프 데이터
  const tideChartData = [
    { time: '00시', level: 120 }, { time: '04시', level: 410 }, { time: '08시', level: 180 },
    { time: '12시', level: 480 }, { time: '16시', level: 150 }, { time: '20시', level: 390 },
  ];

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#f8fafc]">
      <div className="absolute inset-0 w-full h-full z-0">
        <MapContainer center={mapConfig.center} zoom={mapConfig.zoom} className="h-full w-full" zoomControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ZoomControl position="topleft" /> 
          <ChangeView center={mapConfig.center} zoom={mapConfig.zoom} />
          <TidalCurrentLayer />
          {marinas.map(m => (
            <Marker key={m.id} position={[m.latitude, m.longitude]} eventHandlers={{ click: () => handleMarinaClick(m) }} />
          ))}
        </MapContainer>
      </div>

      {/* 사이드바 및 버튼 로직 (기존과 동일) */}
      {!isSidebarOpen && (
        <div className="absolute top-[84px] left-[10px] z-[1002]">
          <button onClick={() => setIsSidebarOpen(true)} className="w-[34px] h-[34px] bg-white text-[#003366] rounded-[4px] border-2 border-black/20 shadow-sm flex items-center justify-center"><Menu size={18} /></button>
        </div>
      )}

      <aside className={`absolute top-0 left-0 z-[1005] w-80 h-full bg-white shadow-2xl flex flex-col transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 bg-[#003366] text-white flex justify-between items-center font-bold">
          <span className="flex items-center gap-2"><Anchor size={20} className="text-yellow-400" /> 전국의 마리나</span>
          <button onClick={() => setIsSidebarOpen(false)}><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {marinas.map(m => (
            <div key={m.id} onClick={() => handleMarinaClick(m)} className={`p-4 border rounded-2xl cursor-pointer transition-all ${selectedMarina?.id === m.id ? 'border-[#003366] bg-blue-50' : 'border-gray-100 hover:border-gray-200'}`}>
              <h3 className="font-bold text-gray-800">{m.name}</h3>
              <p className="text-[10px] text-gray-400 mt-1">{m.address}</p>
            </div>
          ))}
        </div>
      </aside>

      {selectedMarina && (
        <div className="fixed md:absolute inset-y-0 right-0 w-full md:w-[380px] bg-white z-[2000] shadow-2xl flex flex-col animate-in slide-in-from-right">
          <div className="bg-[#003366] text-white p-6">
            <button onClick={() => setSelectedMarina(null)} className="float-right"><X size={24} /></button>
            <h2 className="text-2xl font-bold">{selectedMarina.name}</h2>
          </div>

          <div className="p-6 space-y-8 overflow-y-auto">
            {/* 📈 3번 그래프 영역 */}
            <section>
              <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2"><span className="w-1 h-4 bg-yellow-400 rounded-full"></span>오늘의 조위 변동</h4>
              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={tideChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                    <XAxis dataKey="time" fontSize={8} tickLine={false} />
                    <Area type="monotone" dataKey="level" stroke="#003366" fill="#003366" fillOpacity={0.1} />
                    <Tooltip contentStyle={{ fontSize: '10px' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="grid grid-cols-3 gap-2">
              <MiniCard icon={<Wind size={16}/>} label="풍속" value={weatherData ? `${weatherData.wind_speed}m/s` : '--'} color="text-blue-500" />
              <MiniCard icon={<Thermometer size={16}/>} label="수온" value={oceanData ? `${oceanData.water_temp}°C` : '--'} color="text-cyan-500" />
              <MiniCard icon={<Droplets size={16}/>} label="염분" value={oceanData ? `${oceanData.salinity}` : '--'} color="text-indigo-500" />
            </section>

            <section className="bg-gray-50 rounded-2xl p-5 space-y-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">인근 관측소 실시간 정보</h4>
              <div className="flex justify-between items-center"><span className="text-sm text-gray-600">현재 조위</span><span className="font-bold">{oceanData?.tide_level ?? '--'} cm</span></div>
              <div className="flex justify-between items-center"><span className="text-sm text-gray-600">현재 기압</span><span className="font-bold">{oceanData?.air_pres ?? '--'} hPa</span></div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniCard({ icon, label, value, color }: any) {
  return (
    <div className="bg-white border border-gray-100 p-3 rounded-xl flex flex-col items-center shadow-sm">
      <div className={`${color} mb-1`}>{icon}</div>
      <span className="text-xs font-bold text-gray-800">{value}</span>
      <span className="text-[8px] text-gray-400 font-bold">{label}</span>
    </div>
  );
}