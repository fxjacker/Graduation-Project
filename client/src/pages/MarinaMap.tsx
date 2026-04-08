import { useState, useEffect, useMemo, Fragment } from 'react'; // Fragment 추가
import { MapContainer, TileLayer, Marker, ZoomControl, useMap, useMapEvents, Popup, Circle } from 'react-leaflet'; // Circle 추가
import { X, Wind, Thermometer, Droplets, Anchor, Menu, Search, ExternalLink, Waves, Navigation, ArrowLeftRight, RotateCcw, Clock, MapPin, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';

// 별도로 만든 부품들 호출
import NavigationLayer from '../components/map/NavigationLayer';
import RouteAnalysisChart from '../components/map/RouteAnalysisChart';
import MapChat from '../components/map/MapChat';

/* 1. 조류 화살표 레이어 */
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

/* 2. 지도 시점 이동 컨트롤 */
function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => { if (center && zoom && !isNaN(center[0])) map.flyTo(center, zoom, { duration: 1.5 }); }, [center, zoom, map]);
  return null;
}

/* 3. 실시간 선박 위치 레이어 + [신규] 거리 동심원(Range Rings) */
function RealtimeShipLayer() {
  const [ships, setShips] = useState<any[]>([]);
  useEffect(() => {
    const fetchShips = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/realtime-ships');
        setShips(response.data);
      } catch (err) { console.warn("선박 API 연결 실패"); }
    };
    fetchShips();
    const interval = setInterval(fetchShips, 10000);
    return () => clearInterval(interval);
  }, []);

  const createShipIcon = (course: number) => {
    const iconHtml = `<div style="transform: rotate(${course}deg);"><svg viewBox="0 0 24 24" width="24" height="24" fill="#ef4444" stroke="white"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" /></svg></div>`;
    return new L.DivIcon({ html: iconHtml, className: 'ship-icon', iconSize: [24, 24], iconAnchor: [12, 12] });
  };

  return (
    <>
      {ships.map((ship) => (
        <Fragment key={ship.mmsi}>
          {/* 선박 마커 */}
          <Marker position={[ship.latitude, ship.longitude]} icon={createShipIcon(ship.true_heading || 0)}>
            <Popup><div className="text-xs"><b>MMSI: {ship.mmsi}</b><br/>속도: {ship.speed_over_ground}kn</div></Popup>
          </Marker>
          
          {/* [추가] 선박 주변 거리 동심원 (Range Rings) - 항해 시스템 스타일 */}
          <Circle 
            center={[ship.latitude, ship.longitude]} 
            radius={1000} // 1km 반경
            pathOptions={{ color: '#334155', weight: 1, fillOpacity: 0.05, dashArray: '5, 10' }} 
            interactive={false}
          />
          <Circle 
            center={[ship.latitude, ship.longitude]} 
            radius={2000} // 2km 반경
            pathOptions={{ color: '#94a3b8', weight: 0.5, fillOpacity: 0, dashArray: '2, 5' }} 
            interactive={false}
          />
        </Fragment>
      ))}
    </>
  );
}

export default function MarinaMap() {
  const { t } = useTranslation('map');
  const [selectedMarina, setSelectedMarina] = useState<any>(null);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [oceanData, setOceanData] = useState<any>(null);
  const [realtimeDepth, setRealtimeDepth] = useState<number | null>(null);
  const [marinas, setMarinas] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [mapConfig, setMapConfig] = useState({ center: [36.5, 127.5] as [number, number], zoom: 7 });
  const [minDepth, setMinDepth] = useState(0);

  const [isNavMode, setIsNavMode] = useState(false); 
  const [navStart, setNavStart] = useState<any>(null);
  const [navEnd, setNavEnd] = useState<any>(null);
  const [activeInput, setActiveInput] = useState<'start' | 'end' | null>(null);
  const [routeAnalysisData, setRouteAnalysisData] = useState<any[]>([]);
  const [isRouteDone, setIsRouteDone] = useState(false);

  useEffect(() => {
    async function fetchMarinas() {
      const { data } = await supabase.from('marina_list').select('*');
      if (data) {
        setMarinas(data.map((m: any) => ({ 
          ...m, latitude: parseFloat(m.latitude), longitude: parseFloat(m.longitude), depth: parseFloat(m.depth || m.base_depth || 0) 
        })));
      }
    }
    fetchMarinas();
  }, []);

  const filteredMarinas = useMemo(() => marinas.filter(m => m.depth >= minDepth), [marinas, minDepth]);

  const handleMarinaClick = async (marina: any) => {
    if (isNavMode && !isRouteDone) {
      if (activeInput === 'start' || (!navStart && !activeInput)) {
        setNavStart(marina);
        setActiveInput('end');
      } else if (activeInput === 'end') {
        if (navStart?.id === marina.id) return;
        setNavEnd(marina);
        setActiveInput(null);
      }
      return; 
    }

    setSelectedMarina(marina);
    setIsSidebarOpen(false);
    setMapConfig({ center: [marina.latitude, marina.longitude], zoom: 14 });

    try {
      const res = await axios.get(`http://localhost:3000/api/marinas/${marina.id}/realtime-depth`);
      setRealtimeDepth(res.data.realtime_depth);
    } catch (err) { setRealtimeDepth(null); }

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

  const clearNav = () => {
    setIsRouteDone(false);
    setNavStart(null);
    setNavEnd(null);
    setRouteAnalysisData([]);
    setIsNavMode(false);
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#f1f5f9]">
      <div className="absolute inset-0 w-full h-full z-0">
        <MapContainer center={mapConfig.center} zoom={mapConfig.zoom} className="h-full w-full" zoomControl={false}>
          {/* [수정] 기본 레이어 + 무료 해도 레이어(OpenSeaMap) 중첩 */}
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" zIndex={1} />
          <TileLayer 
            url="https://tiles.openseamap.org/seamap/{z}/{x}/{y}.png" 
            zIndex={10} 
            opacity={0.8}
          />

          <ZoomControl position="topleft" /> 
          <ChangeView center={mapConfig.center} zoom={mapConfig.zoom} />
          <TidalCurrentLayer />
          <RealtimeShipLayer />
          <NavigationLayer startNode={navStart} endNode={navEnd} onAnalysis={setRouteAnalysisData} />
          {filteredMarinas.map(m => (<Marker key={`marina-${m.id}`} position={[m.latitude, m.longitude]} eventHandlers={{ click: () => handleMarinaClick(m) }} />))}
        </MapContainer>
      </div>

      {!selectedMarina && (
        <div className="absolute top-5 right-5 z-[3000]">
          <button 
            onClick={() => isNavMode ? clearNav() : setIsNavMode(true)}
            className={`flex items-center gap-3 px-6 py-3 rounded-full font-black shadow-2xl transition-all border-2 ${isNavMode ? 'bg-red-500 text-white border-red-400' : 'bg-white text-[#003366] border-gray-100'}`}
          >
            {isNavMode ? <X size={20}/> : <Navigation size={20} className="text-blue-500" />}
            {isNavMode ? '네비게이션 종료' : '네비게이션 시작'}
          </button>
        </div>
      )}

      {isNavMode && !isRouteDone && (
        <div className="absolute top-24 right-5 z-[2500] w-80 bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl p-6 border border-white animate-in slide-in-from-right">
          <div className="mb-6"><h4 className="font-black text-[#003366] text-lg uppercase tracking-tighter">Route Planning</h4></div>
          <div className="space-y-3">
            <div onClick={() => setActiveInput('start')} className={`p-4 border-2 rounded-2xl cursor-pointer ${activeInput === 'start' ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-white'}`}>
              <span className="text-[9px] font-black text-blue-500 uppercase">Start</span>
              <p className="font-bold text-sm truncate">{navStart ? navStart.name : '출발지 선택'}</p>
            </div>
            <div onClick={() => setActiveInput('end')} className={`p-4 border-2 rounded-2xl cursor-pointer ${activeInput === 'end' ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-white'}`}>
              <span className="text-[9px] font-black text-red-500 uppercase">Destination</span>
              <p className="font-bold text-sm truncate">{navEnd ? navEnd.name : '도착지 선택'}</p>
            </div>
            <button disabled={!navStart || !navEnd} onClick={() => setIsRouteDone(true)} className={`w-full py-4 mt-4 rounded-xl font-black text-sm shadow-xl transition-all ${navStart && navEnd ? 'bg-[#003366] text-white shadow-blue-200' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>길찾기 실행</button>
          </div>
        </div>
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
          {filteredMarinas.map(m => (<div key={m.id} onClick={() => handleMarinaClick(m)} className={`p-4 border-2 rounded-2xl cursor-pointer transition-all hover:bg-blue-50/50 ${selectedMarina?.id === m.id ? 'border-blue-500 bg-blue-50' : 'border-gray-100'}`}><h3 className="font-bold text-gray-700">{t(m.id, m.name)}</h3><p className="text-[11px] text-gray-400 mt-1 line-clamp-1">{t(`ADDR_${m.id}`, m.address)}</p></div>))}
        </div>
      </aside>

      {isRouteDone && <RouteAnalysisChart data={routeAnalysisData} onClose={clearNav} startNode={navStart} endNode={navEnd} />}

      {!isNavMode && !isRouteDone && selectedMarina && (
        <div className="fixed md:absolute inset-y-0 right-0 w-full md:w-[380px] bg-white z-[2000] shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
          <div className="bg-[#003366] text-white p-6 relative">
            <button onClick={() => setSelectedMarina(null)} className="absolute top-6 right-6 p-2 hover:bg-white/20 rounded-xl transition-colors"><X size={24} /></button>
            <h2 className="text-2xl font-bold tracking-tight">{selectedMarina.name}</h2>
          </div>
          <div className="p-6 space-y-8 overflow-y-auto bg-white flex-1">
            <section className="bg-blue-50 rounded-2xl p-5 border border-blue-100 shadow-inner">
                <h4 className="text-sm font-bold text-blue-800 flex items-center gap-2 mb-4 uppercase tracking-widest"><Waves size={16} /> 실시간 안전 수심</h4>
                <div className="flex justify-between items-end">
                    <div><p className="text-[10px] text-blue-400 font-bold uppercase mb-1">Live</p><p className="text-4xl font-black text-blue-600 tracking-tighter">{realtimeDepth !== null ? `${realtimeDepth}m` : '--'}</p></div>
                    <div className="text-right"><p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Base</p><p className="text-lg font-black text-gray-600">{selectedMarina.depth}m</p></div>
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

      <MapChat />

      {!isSidebarOpen && (
        <div className="absolute top-[90px] left-[10px] z-[1002]"><button onClick={() => setIsSidebarOpen(true)} className="w-[34px] h-[34px] bg-white text-[#003366] rounded-[4px] border-2 border-black/20 shadow-md flex items-center justify-center hover:bg-gray-100"><Menu size={18} /></button></div>
      )}
    </div>
  );
}

function MiniCard({ icon, label, value, color }: any) {
  return (<div className="bg-white border border-gray-100 p-3 rounded-xl flex flex-col items-center shadow-sm"><div className={`${color} mb-1`}>{icon}</div><span className="text-xs font-bold text-gray-800">{value}</span><span className="text-[8px] text-gray-400 font-bold">{label}</span></div>);
}