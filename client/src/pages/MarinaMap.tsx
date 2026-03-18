import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, ZoomControl, useMap, useMapEvents } from 'react-leaflet';
import { X, Wind, Thermometer, Droplets, Anchor, Menu, Search, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function TidalCurrentLayer() {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  const [currents, setCurrents] = useState<any[]>([]);
  useMapEvents({ zoomend: () => setZoom(map.getZoom()) });

  useEffect(() => {
    async function fetchTidalCurrents() {
      const { data } = await supabase.from('tidal_current_observations').select('*').limit(5000);
      if (data) {
        const validData = data.filter(c => !isNaN(parseFloat(c.latitude)) && !isNaN(parseFloat(c.longitude)));
        setCurrents(validData);
      }
    }
    fetchTidalCurrents();
  }, []);

  if (zoom < 8) return null;

  const createArrowIcon = (direction: number, speed: number) => {
    const color = speed > 2.0 ? '#ef4444' : speed > 1.0 ? '#f97316' : '#f59e0b';
    const iconHtml = `<div style="transform: rotate(${direction}deg); opacity: 0.8;"><svg viewBox="0 0 100 100" width="20" height="20"><path d="M50 10 L50 90 M50 10 L30 40 M50 10 L70 40" stroke="${color}" stroke-width="14" fill="none" stroke-linecap="round"/></svg></div>`;
    return new L.DivIcon({ html: iconHtml, className: 'tidal-icon', iconSize: [20, 20], iconAnchor: [10, 10] });
  };

  return <>{currents.map((c, i) => (<Marker key={`current-${c.idx || i}`} position={[parseFloat(c.latitude), parseFloat(c.longitude)]} icon={createArrowIcon(c.current_direction, c.current_speed)} interactive={false} />))}</>;
}

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

  useEffect(() => {
    async function fetchMarinas() {
      const { data } = await supabase.from('marina_list').select('*');
      if (data) {
        setMarinas(data.map((m: any) => ({ 
          ...m, latitude: parseFloat(m.latitude), longitude: parseFloat(m.longitude), depth: parseFloat(m.depth || 0) 
        })));
      }
    }
    fetchMarinas();
  }, []);

  const filteredMarinas = useMemo(() => marinas.filter(m => m.depth >= minDepth), [marinas, minDepth]);

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

  const tideChartData = [{ time: '00:00', level: 120 }, { time: '04:00', level: 410 }, { time: '08:00', level: 180 }, { time: '12:00', level: 480 }, { time: '16:00', level: 150 }, { time: '20:00', level: 390 }, { time: '24:00', level: 130 }];

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#f1f5f9]">
      <div className="absolute inset-0 w-full h-full z-0">
        <MapContainer center={mapConfig.center} zoom={mapConfig.zoom} className="h-full w-full" zoomControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ZoomControl position="topleft" /> 
          <ChangeView center={mapConfig.center} zoom={mapConfig.zoom} />
          <TidalCurrentLayer />
          {filteredMarinas.map(m => (<Marker key={`marina-${m.id}`} position={[m.latitude, m.longitude]} eventHandlers={{ click: () => handleMarinaClick(m) }} />))}
        </MapContainer>
      </div>

      {!isSidebarOpen && (
        <div className="absolute top-[90px] left-[10px] z-[1002]"><button onClick={() => setIsSidebarOpen(true)} className="w-[34px] h-[34px] bg-white text-[#003366] rounded-[4px] border-2 border-black/20 shadow-md flex items-center justify-center hover:bg-gray-100"><Menu size={18} /></button></div>
      )}

      <aside className={`absolute top-0 left-0 z-[1005] w-80 h-full bg-white shadow-2xl flex flex-col transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 bg-[#003366] text-white flex justify-between items-center shadow-md font-bold">
          <span className="flex items-center gap-2"><Anchor className="text-yellow-400" size={22} /> {t('sidebar_title')}</span>
          <button onClick={() => setIsSidebarOpen(false)}><X size={20} /></button>
        </div>
        <div className="p-4 bg-gray-50 border-b space-y-4">
          <div className="relative group"><input type="text" placeholder={t('search_placeholder')} className="w-full p-2.5 pl-10 rounded-xl bg-white border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-[#003366]/20" /><Search className="absolute left-3 top-3 text-gray-400" size={16} /></div>
          <div className="px-1">
            <div className="flex justify-between items-center mb-1"><label className="text-xs font-bold text-gray-500">{t('filter_depth')}</label><span className="text-sm font-bold text-[#003366]">{minDepth.toFixed(1)}m+</span></div>
            <input type="range" min="0" max="15" step="0.5" value={minDepth} onChange={(e) => setMinDepth(parseFloat(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#003366]" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
          {filteredMarinas.map(m => (<div key={m.id} onClick={() => handleMarinaClick(m)} className={`p-4 border rounded-2xl cursor-pointer transition-all hover:bg-blue-50/50 ${selectedMarina?.id === m.id ? 'border-[#003366] bg-blue-50' : 'border-gray-100'}`}><h3 className="font-bold text-gray-700">{t(m.id, m.name)}</h3><p className="text-[11px] text-gray-400 mt-1 line-clamp-1">{t(`ADDR_${m.id}`, m.address)}</p></div>))}
        </div>
      </aside>

      {selectedMarina && (
        <div className="fixed md:absolute inset-y-0 right-0 w-full md:w-[380px] bg-white z-[2000] shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
          <div className="bg-[#003366] text-white p-6 relative"><button onClick={() => setSelectedMarina(null)} className="absolute top-6 right-6 p-2 hover:bg-white/20 rounded-xl transition-colors"><X size={24} /></button><h2 className="text-2xl font-bold tracking-tight">{t(selectedMarina.id, selectedMarina.name)}</h2></div>
          <div className="p-6 space-y-8 overflow-y-auto bg-white">
            <section><h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2"><span className="w-1 h-4 bg-yellow-400 rounded-full"></span>{t('tide_chart_title')}</h4><div className="h-32 w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={tideChartData}><XAxis dataKey="time" fontSize={8} tickLine={false} /><Area type="monotone" dataKey="level" stroke="#003366" fill="#003366" fillOpacity={0.1} /><Tooltip /></AreaChart></ResponsiveContainer></div></section>
            <section className="grid grid-cols-3 gap-2"><MiniCard icon={<Wind size={16}/>} label={t('wind_speed')} value={weatherData ? `${weatherData.wind_speed}m/s` : '--'} color="text-blue-500" /><MiniCard icon={<Thermometer size={16}/>} label={t('water_temp')} value={oceanData ? `${oceanData.water_temp}°C` : '--'} color="text-cyan-500" /><MiniCard icon={<Droplets size={16}/>} label={t('salinity')} value={oceanData ? `${oceanData.salinity}` : '--'} color="text-indigo-500" /></section>

            {/* 🍽️ [신규] 네이버 지도 주변 정보 연동 버튼 (이미지 8번 빈 공간 채우기) */}
            {selectedMarina.recommend_link && (
              <section className="bg-green-50/50 rounded-2xl p-5 border border-green-100">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-bold text-green-800 flex items-center gap-2">
                    <span className="w-1 h-4 bg-green-500 rounded-full"></span>
                    주변 정보 서비스
                  </h4>
                  <span className="text-[10px] text-green-600 font-bold tracking-wider">NAVER MAP</span>
                </div>
                <button 
                  onClick={() => window.open(selectedMarina.recommend_link, '_blank')}
                  className="w-full bg-white p-4 rounded-xl border border-green-200 flex items-center justify-between group hover:border-green-500 transition-all shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600 group-hover:bg-green-500 group-hover:text-white transition-colors">
                      <Search size={20} />
                    </div>
                    <div className="text-left">
                      <h5 className="text-xs font-bold text-gray-800">{selectedMarina.name}</h5>
                      <p className="text-[10px] text-gray-400">주변 맛집·편의시설 검색</p>
                    </div>
                  </div>
                  <ExternalLink size={16} className="text-gray-300 group-hover:text-green-500 transition-colors" />
                </button>
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MiniCard({ icon, label, value, color }: any) {
  return (<div className="bg-white border border-gray-100 p-3 rounded-xl flex flex-col items-center shadow-sm"><div className={`${color} mb-1`}>{icon}</div><span className="text-xs font-bold text-gray-800">{value}</span><span className="text-[8px] text-gray-400 font-bold">{label}</span></div>);
}