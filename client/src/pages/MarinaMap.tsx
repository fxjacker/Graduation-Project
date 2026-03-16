import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, ZoomControl, useMap, useMapEvents } from 'react-leaflet';
import { X, Wind, Thermometer, Droplets, Anchor, Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// 🏹 조류 화살표 레이어 컴포넌트
function TidalCurrentLayer() {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  const [currents, setCurrents] = useState<any[]>([]);

  useMapEvents({ zoomend: () => setZoom(map.getZoom()) });

  useEffect(() => {
    async function fetchTidalCurrents() {
      const { data } = await supabase.from('tidal_current_observations').select('*');
      if (data) setCurrents(data);
    }
    fetchTidalCurrents();
  }, []);

  // 줌 레벨 8 미만일 때는 숨겨서 시인성 확보
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
      {/* 5개당 1개 샘플링하여 렌더링 최적화 */}
      {currents.filter((_, i) => i % 5 === 0).map((c, i) => (
        <Marker key={i} position={[parseFloat(c.latitude), parseFloat(c.longitude)]} icon={createArrowIcon(c.current_direction, c.current_speed)} />
      ))}
    </>
  );
}

// 지도 시점 이동 컴포넌트
function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => { map.flyTo(center, zoom, { duration: 1.5 }); }, [center, zoom, map]);
  return null;
}

export default function MarinaMap() {
  const { t } = useTranslation('map'); // map.json 사용
  const [selectedMarina, setSelectedMarina] = useState<any>(null);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [oceanData, setOceanData] = useState<any>(null);
  const [marinas, setMarinas] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [mapConfig, setMapConfig] = useState({ center: [36.5, 127.5] as [number, number], zoom: 7 });

  // 마리나 목록 불러오기
  useEffect(() => {
    async function fetchMarinas() {
      const { data } = await supabase.from('marina_list').select('*');
      if (data) {
        setMarinas(data.map((m: any) => ({ ...m, latitude: parseFloat(m.latitude), longitude: parseFloat(m.longitude) })));
      }
    }
    fetchMarinas();
  }, []);

  // 마리나 클릭 핸들러
  const handleMarinaClick = async (marina: any) => {
    setSelectedMarina(marina);
    setIsSidebarOpen(false);
    setWeatherData(null);
    setOceanData(null);
    setMapConfig({ center: [marina.latitude, marina.longitude], zoom: 14 });

    // 실시간 날씨 데이터 호출
    const { data: wData } = await supabase.from('weather_observations').select('*').eq('station_id', marina.id).single();
    if (wData) setWeatherData(wData);

    // 인근 해양 관측소 매칭 알고리즘 (최단거리)
    const { data: oData } = await supabase.from('ocean_observations').select('*');
    if (oData) {
      const closest = oData.reduce((prev, curr) => {
        const prevDist = Math.abs(parseFloat(prev.latitude) - marina.latitude) + Math.abs(parseFloat(prev.longitude) - marina.longitude);
        const currDist = Math.abs(parseFloat(curr.latitude) - marina.latitude) + Math.abs(parseFloat(curr.longitude) - marina.longitude);
        return prevDist < currDist ? prev : curr;
      });
      setOceanData(closest);
    }
  };

  // 조위 변동 더미 데이터 (추후 DB 연동 가능)
  const tideChartData = [
    { time: '00:00', level: 120 }, { time: '04:00', level: 410 }, { time: '08:00', level: 180 },
    { time: '12:00', level: 480 }, { time: '16:00', level: 150 }, { time: '20:00', level: 390 },
  ];

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#f8fafc]">
      {/* 1. 지도 영역 */}
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

      {/* 2. 왼쪽 마리나 리스트 사이드바 */}
      {!isSidebarOpen && (
        <div className="absolute top-[84px] left-[10px] z-[1002]">
          <button onClick={() => setIsSidebarOpen(true)} className="w-[34px] h-[34px] bg-white text-[#003366] rounded-[4px] border-2 border-black/20 shadow-sm flex items-center justify-center"><Menu size={18} /></button>
        </div>
      )}

      <aside className={`absolute top-0 left-0 z-[1005] w-80 h-full bg-white shadow-2xl flex flex-col transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 bg-[#003366] text-white flex justify-between items-center font-bold">
          <span className="flex items-center gap-2"><Anchor size={20} className="text-yellow-400" /> {t('sidebar_title')}</span>
          <button onClick={() => setIsSidebarOpen(false)}><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
          {marinas.map(m => (
            <div key={m.id} onClick={() => handleMarinaClick(m)} className={`p-4 border rounded-2xl cursor-pointer transition-all ${selectedMarina?.id === m.id ? 'border-[#003366] bg-blue-50' : 'border-gray-100 hover:border-gray-200'}`}>
              <h3 className="font-bold text-gray-800">{t(m.id, m.name)}</h3> 
              <p className="text-[10px] text-gray-400 mt-1">{t(`ADDR_${m.id}`, m.address)}</p>
            </div>
          ))}
        </div>
      </aside>

      {/* 3. 오른쪽 상세 정보 패널 */}
      {selectedMarina && (
        <div className="fixed md:absolute inset-y-0 right-0 w-full md:w-[380px] bg-white z-[2000] shadow-2xl flex flex-col animate-in slide-in-from-right">
          <div className="bg-[#003366] text-white p-6">
            <button onClick={() => setSelectedMarina(null)} className="float-right"><X size={24} /></button>
            <h2 className="text-2xl font-bold">{t(selectedMarina.id, selectedMarina.name)}</h2>
          </div>

          <div className="p-6 space-y-8 overflow-y-auto">
            {/* 조위 그래프 */}
            <section>
              <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                <span className="w-1 h-4 bg-yellow-400 rounded-full"></span>{t('tide_chart_title')}
              </h4>
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

            {/* 날씨/해양 요약 카드 */}
            <section className="grid grid-cols-3 gap-2">
              <MiniCard icon={<Wind size={16}/>} label={t('wind_speed')} value={weatherData ? `${weatherData.wind_speed}m/s` : '--'} color="text-blue-500" />
              <MiniCard icon={<Thermometer size={16}/>} label={t('water_temp')} value={oceanData ? `${oceanData.water_temp}°C` : '--'} color="text-cyan-500" />
              <MiniCard icon={<Droplets size={16}/>} label={t('salinity')} value={oceanData ? `${oceanData.salinity}` : '--'} color="text-indigo-500" />
            </section>

            {/* 인근 관측소 상세 정보 */}
            <section className="bg-gray-50 rounded-2xl p-5 space-y-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('infra_title')}</h4>
              <div className="flex justify-between items-center"><span className="text-sm text-gray-600">{t('tide_level')}</span><span className="font-bold">{oceanData?.tide_level ?? '--'} cm</span></div>
              <div className="flex justify-between items-center"><span className="text-sm text-gray-600">{t('air_pres')}</span><span className="font-bold">{oceanData?.air_pres ?? '--'} hPa</span></div>
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