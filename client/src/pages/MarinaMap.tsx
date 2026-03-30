import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, ZoomControl, useMap, useMapEvents, Popup } from 'react-leaflet';
import { X, Wind, Thermometer, Droplets, Anchor, Menu, Search, ExternalLink, Waves, Navigation, ArrowLeftRight, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';

// 별도로 만든 네비게이션 부품들 호출
import NavigationLayer from '../components/map/NavigationLayer';
import RouteAnalysisChart from '../components/map/RouteAnalysisChart';

/* 기능: 조류 화살표 레이어 (원래 코드 유지) */
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

/* 기능: 지도 시점 이동 컨트롤 (원래 코드 유지) */
function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => { if (center && zoom && !isNaN(center[0])) map.flyTo(center, zoom, { duration: 1.5 }); }, [center, zoom, map]);
  return null;
}

/* 기능: 실시간 선박 위치 레이어 (원래 코드 유지) */
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

  return <>{ships.map((ship) => (<Marker key={ship.mmsi} position={[ship.latitude, ship.longitude]} icon={createShipIcon(ship.true_heading || 0)}><Popup><div className="text-xs"><b>MMSI: {ship.mmsi}</b><br/>속도: {ship.speed_over_ground}kn</div></Popup></Marker>))}</>;
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

  // --- [신규] 네비게이션 상태 관리 ---
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
    // [신규 로직] 네비게이션 모드일 때 클릭 처리
    if (isNavMode) {
      if (activeInput === 'start' || (!navStart && !activeInput)) {
        setNavStart(marina);
        setActiveInput('end');
      } else if (activeInput === 'end') {
        if (navStart?.id === marina.id) return;
        setNavEnd(marina);
        setActiveInput(null);
      }
      return; // 상세 팝업창 뜨지 않게 방지
    }

    // 일반 모드일 때 클릭 처리 (원래 로직)
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

  const tideChartData = [{ time: '00:00', level: 120 }, { time: '04:00', level: 410 }, { time: '08:00', level: 180 }, { time: '12:00', level: 480 }, { time: '16:00', level: 150 }, { time: '20:00', level: 390 }, { time: '24:00', level: 130 }];

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#f1f5f9]">
      <div className="absolute inset-0 w-full h-full z-0">
        <MapContainer center={mapConfig.center} zoom={mapConfig.zoom} className="h-full w-full" zoomControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ZoomControl position="topleft" /> 
          <ChangeView center={mapConfig.center} zoom={mapConfig.zoom} />
          
          <TidalCurrentLayer />
          <RealtimeShipLayer />

          {/* [조립] 네비게이션 레이어 */}
          <NavigationLayer startNode={navStart} endNode={navEnd} onAnalysis={setRouteAnalysisData} />

          {filteredMarinas.map(m => (<Marker key={`marina-${m.id}`} position={[m.latitude, m.longitude]} eventHandlers={{ click: () => handleMarinaClick(m) }} />))}
        </MapContainer>
      </div>

      {/* --- [수정] 네비게이션 트리거 버튼 --- */}
      {!isNavMode && (
        <div className="absolute top-5 right-5 z-[3000]">
          <button 
            onClick={() => { setIsNavMode(true); setIsSidebarOpen(true); setActiveInput('start'); }}
            className="flex items-center gap-3 px-6 py-3 bg-white text-[#003366] rounded-full font-black shadow-2xl border-2 border-gray-100 hover:scale-105 transition-all"
          >
            <Navigation size={20} className="text-blue-500" /> 네비게이션 시작
          </button>
        </div>
      )}

      {/* 왼쪽 마리나 목록 및 검색 사이드바 */}
      <aside className={`absolute top-0 left-0 z-[1005] w-96 h-full bg-white shadow-2xl flex flex-col transition-transform duration-500 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 bg-[#003366] text-white flex justify-between items-center font-bold">
          <span className="flex items-center gap-2 text-lg"><Anchor className="text-yellow-400" size={24} /> GLOBAL MARINA</span>
          <button onClick={() => setIsSidebarOpen(false)}><X size={22} /></button>
        </div>

        {/* --- [신규 UI] 사이드바 내 검색 인터페이스 --- */}
        {isNavMode && (
          <div className="p-6 border-b border-gray-100 bg-blue-50/30">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xs font-black text-blue-600 tracking-widest uppercase">Route Search</h4>
              <button onClick={() => { setIsNavMode(false); setNavStart(null); setNavEnd(null); setIsRouteDone(false); }} className="text-gray-400 hover:text-red-500"><X size={18}/></button>
            </div>
            
            <div className="space-y-2">
              <div className={`border-2 rounded-xl p-3 cursor-pointer transition-all ${activeInput === 'start' ? 'border-blue-500 bg-white' : 'border-gray-100 bg-gray-50'}`} onClick={() => setActiveInput('start')}>
                <p className="text-[9px] font-bold text-blue-500 mb-1 uppercase">Start</p>
                <p className="text-sm font-bold">{navStart ? navStart.name : '출발지 선택'}</p>
              </div>
              <div className={`border-2 rounded-xl p-3 cursor-pointer transition-all ${activeInput === 'end' ? 'border-blue-500 bg-white' : 'border-gray-100 bg-gray-50'}`} onClick={() => setActiveInput('end')}>
                <p className="text-[9px] font-bold text-red-500 mb-1 uppercase">End</p>
                <p className="text-sm font-bold">{navEnd ? navEnd.name : '도착지 선택'}</p>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => { setNavStart(null); setNavEnd(null); setIsRouteDone(false); setActiveInput('start'); }} className="flex-1 py-3 bg-white border border-gray-200 text-gray-400 rounded-xl font-bold text-xs"><RotateCcw size={14} className="inline mr-1"/> 초기화</button>
                <button 
                  disabled={!navStart || !navEnd}
                  onClick={() => setIsRouteDone(true)}
                  className={`flex-[2] py-3 rounded-xl font-black text-xs shadow-lg transition-all ${navStart && navEnd ? 'bg-[#003366] text-white shadow-blue-200' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                >
                  길찾기 실행
                </button>
              </div>
            </div>
          </div>
        )}

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

      {/* [조립] 수심 분석 차트 */}
      {isRouteDone && <RouteAnalysisChart data={routeAnalysisData} onClose={() => { setIsRouteDone(false); setNavEnd(null); }} startName={navStart?.name} endName={navEnd?.name} />}

      {/* 마리나 상세 정보 팝업창 (네비게이션 모드가 아닐 때만 노출) */}
      {!isNavMode && selectedMarina && (
        <div className="fixed md:absolute inset-y-0 right-0 w-full md:w-[380px] bg-white z-[2000] shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
          <div className="bg-[#003366] text-white p-6 relative">
            <button onClick={() => setSelectedMarina(null)} className="absolute top-6 right-6 p-2 hover:bg-white/20 rounded-xl transition-colors"><X size={24} /></button>
            <h2 className="text-2xl font-bold tracking-tight">{selectedMarina.name}</h2>
          </div>
          
          <div className="p-6 space-y-8 overflow-y-auto bg-white">
            <section className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
                <h4 className="text-sm font-bold text-blue-800 flex items-center gap-2 mb-4"><Waves size={16} /> 실시간 안전 수심</h4>
                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-[10px] text-blue-400 font-bold uppercase">Realtime</p>
                        <p className="text-3xl font-black text-blue-600">{realtimeDepth !== null ? `${realtimeDepth}m` : '로딩 중...'}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Base</p>
                        <p className="text-sm font-bold text-gray-600">{selectedMarina.depth}m</p>
                    </div>
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

      {/* 사이드바 토글 버튼 */}
      {!isSidebarOpen && (
        <div className="absolute top-[90px] left-[10px] z-[1002]"><button onClick={() => setIsSidebarOpen(true)} className="w-[34px] h-[34px] bg-white text-[#003366] rounded-[4px] border-2 border-black/20 shadow-md flex items-center justify-center hover:bg-gray-100"><Menu size={18} /></button></div>
      )}
    </div>
  );
}

function MiniCard({ icon, label, value, color }: any) {
  return (<div className="bg-white border border-gray-100 p-3 rounded-xl flex flex-col items-center shadow-sm"><div className={`${color} mb-1`}>{icon}</div><span className="text-xs font-bold text-gray-800">{value}</span><span className="text-[8px] text-gray-400 font-bold">{label}</span></div>);
}