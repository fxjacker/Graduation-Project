import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, ZoomControl, useMap, useMapEvents } from 'react-leaflet';
import { X, Wind, Thermometer, Droplets, Anchor, Menu, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// 조류 화살표 레이어 기능
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

  if (zoom < 7) return null;

  const createArrowIcon = (direction: number, speed: number) => {
    const color = speed > 2.0 ? '#ef4444' : speed > 1.0 ? '#f97316' : '#f59e0b';
    const iconHtml = `
      <div style="transform: rotate(${direction}deg); opacity: 0.8;">
        <svg viewBox="0 0 100 100" width="20" height="20">
          <path d="M50 10 L50 90 M50 10 L30 40 M50 10 L70 40" stroke="${color}" stroke-width="14" fill="none" stroke-linecap="round"/>
        </svg>
      </div>`;
    return new L.DivIcon({ html: iconHtml, className: 'tidal-icon', iconSize: [20, 20] });
  };

  return (
    <>
      {currents.map((c, i) => (
        <Marker key={`current-${i}`} position={[parseFloat(c.latitude), parseFloat(c.longitude)]} icon={createArrowIcon(c.current_direction, c.current_speed)} interactive={false} />
      ))}
    </>
  );
}

// 지도 시점 이동 기능
function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => { if (center && zoom) map.flyTo(center, zoom, { duration: 1.5 }); }, [center, zoom, map]);
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
  const [minDepth, setMinDepth] = useState(0);

  // 마리나 목록 데이터 호출 기능
  useEffect(() => {
    async function fetchMarinas() {
      const { data } = await supabase.from('marina_list').select('*');
      if (data) {
        setMarinas(data.map((m: any) => ({ 
          ...m, 
          latitude: parseFloat(m.latitude), 
          longitude: parseFloat(m.longitude),
          depth: parseFloat(m.depth || 0) 
        })));
      }
    }
    fetchMarinas();
  }, []);

  // 수심 기반 마리나 필터링 기능
  const filteredMarinas = useMemo(() => marinas.filter(m => m.depth >= minDepth), [marinas, minDepth]);

  // 마리나 선택 및 상세 데이터 호출 기능
  const handleMarinaClick = async (marina: any) => {
    setSelectedMarina(marina);
    setIsSidebarOpen(false);
    setMapConfig({ center: [marina.latitude, marina.longitude], zoom: 14 });

    const { data: wData } = await supabase.from('weather_observations').select('*').eq('station_id', marina.id).single();
    if (wData) setWeatherData(wData);

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

  const tideChartData = [
    { time: '00:00', level: 120 }, { time: '04:00', level: 410 }, { time: '08:00', level: 180 },
    { time: '12:00', level: 480 }, { time: '16:00', level: 150 }, { time: '20:00', level: 390 }, { time: '24:00', level: 130 }
  ];

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#f1f5f9]">
      {/* 메인 지도 표시 영역 */}
      <div className="absolute inset-0 w-full h-full z-0">
        <MapContainer center={mapConfig.center} zoom={mapConfig.zoom} className="h-full w-full" zoomControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ZoomControl position="topleft" /> 
          <ChangeView center={mapConfig.center} zoom={mapConfig.zoom} />
          <TidalCurrentLayer />
          {filteredMarinas.map(m => (
            <Marker key={`marina-${m.id}`} position={[m.latitude, m.longitude]} eventHandlers={{ click: () => handleMarinaClick(m) }} />
          ))}
        </MapContainer>
      </div>

      {/* 사이드바 열기 버튼 */}
      {!isSidebarOpen && (
        <div className="absolute top-[90px] left-[10px] z-[1002]">
          <button onClick={() => setIsSidebarOpen(true)} className="w-[34px] h-[34px] bg-white text-[#003366] rounded-[4px] border-2 border-black/20 shadow-md flex items-center justify-center"><Menu size={18} /></button>
        </div>
      )}

      {/* 왼쪽 목록 및 필터 사이드바 영역 */}
      <aside className={`absolute top-0 left-0 z-[1005] w-80 h-full bg-white shadow-2xl flex flex-col transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 bg-[#003366] text-white flex justify-between items-center shadow-md">
          <h2 className="text-xl font-bold flex items-center gap-2"><Anchor className="text-yellow-400" size={22} /> {t('sidebar_title')}</h2>
          <button onClick={() => setIsSidebarOpen(false)}><X size={20} /></button>
        </div>
        
        <div className="p-4 bg-gray-50 border-b space-y-4">
          <div className="relative group">
            <input type="text" placeholder={t('search_placeholder')} className="w-full p-2.5 pl-10 rounded-xl bg-white border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-[#003366]/20" />
            <Search className="absolute left-3 top-3 text-gray-400" size={16} />
          </div>
          <div className="px-1">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-gray-500">{t('filter_depth')}</label>
              <span className="text-sm font-bold text-[#003366]">{minDepth.toFixed(1)}m+</span>
            </div>
            <input type="range" min="0" max="15" step="0.5" value={minDepth} onChange={(e) => setMinDepth(parseFloat(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#003366]" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredMarinas.map(m => (
            <div key={m.id} onClick={() => handleMarinaClick(m)} className={`p-4 border rounded-2xl cursor-pointer ${selectedMarina?.id === m.id ? 'border-[#003366] bg-blue-50' : 'border-gray-100'}`}>
              <h3 className="font-bold text-gray-700">{t(m.id, m.name)}</h3>
              <p className="text-[11px] text-gray-400 mt-1">{t(`ADDR_${m.id}`, m.address)}</p>
            </div>
          ))}
        </div>
      </aside>

      {/* 오른쪽 상세 정보 패널 영역 */}
      {selectedMarina && (
        <div className="fixed md:absolute inset-y-0 right-0 w-full md:w-[380px] bg-white z-[2000] shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
          <div className="bg-[#003366] text-white p-6 relative">
            <button onClick={() => setSelectedMarina(null)} className="absolute top-6 right-6 p-2 hover:bg-white/20 rounded-xl"><X size={24} /></button>
            <h2 className="text-2xl font-bold">{t(selectedMarina.id, selectedMarina.name)}</h2>
          </div>

          <div className="p-6 space-y-8 overflow-y-auto">
            <section>
              <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2"><span className="w-1 h-4 bg-yellow-400 rounded-full"></span>{t('tide_chart_title')}</h4>
              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={tideChartData}>
                    <XAxis dataKey="time" fontSize={8} tickLine={false} />
                    <Area type="monotone" dataKey="level" stroke="#003366" fill="#003366" fillOpacity={0.1} />
                    <Tooltip />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="grid grid-cols-3 gap-2">
              <MiniCard icon={<Wind size={16}/>} label={t('wind_speed')} value={weatherData ? `${weatherData.wind_speed}m/s` : '--'} color="text-blue-500" />
              <MiniCard icon={<Thermometer size={16}/>} label={t('water_temp')} value={oceanData ? `${oceanData.water_temp}°C` : '--'} color="text-cyan-500" />
              <MiniCard icon={<Droplets size={16}/>} label={t('salinity')} value={oceanData ? `${oceanData.salinity}` : '--'} color="text-indigo-500" />
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