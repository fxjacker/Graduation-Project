import { useEffect, useState } from 'react';
import { Polyline, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
// 상단에서 supabase를 고정으로 불러옵니다.
import { supabase } from '../../supabaseClient'; 

export default function NavigationLayer({ startNode, endNode, onAnalysis }: any) {
  const map = useMap();
  const [points, setPoints] = useState<[number, number][]>([]);

  useEffect(() => {
    if (!startNode || !endNode) {
      setPoints([]);
      onAnalysis([]);
      return;
    }

    // DB에서 길을 못 찾으면 실행될 예전 '직선 그리기' 함수입니다.
    const generateFallbackRoute = () => {
      console.warn("해상 경로가 끊겨있어 직선(Plan B) 경로로 대체합니다.");
      const route: [number, number][] = [];
      const analysis: any[] = [];
      const steps = 20;

      for (let i = 0; i <= steps; i++) {
        const r = i / steps;
        const lat = startNode.latitude + (endNode.latitude - startNode.latitude) * r;
        const lng = startNode.longitude + (endNode.longitude - startNode.longitude) * r;
        route.push([lat, lng]);
        analysis.push({
          dist: `${Math.round(r * 100)}%`,
          depth: (Number(startNode.depth || 0) + (Number(endNode.depth || 0) - Number(startNode.depth || 0)) * r + (Math.random() * 2)).toFixed(1)
        });
      }
      setPoints(route);
      onAnalysis(analysis);

      const bounds = L.latLngBounds([startNode.latitude, startNode.longitude], [endNode.latitude, endNode.longitude]);
      map.fitBounds(bounds, { padding: [100, 100] });
    };

    const fetchRealSeaRoute = async () => {
      try {
        // 백엔드에 길찾기 API(RPC)를 찌릅니다.
        const { data, error } = await supabase.rpc('find_safe_sea_route', {
          start_lat: startNode.latitude,
          start_lon: startNode.longitude,
          end_lat: endNode.latitude,
          end_lon: endNode.longitude
        });

        // 에러가 났으면 바로 catch 문으로 던져서 직선을 그리게 만듭니다.
        if (error) throw error;

        if (data) {
          const geojson = JSON.parse(data);
          
          // 데이터가 비어있지 않고 진짜 좌표가 잘 들어왔을 때만 바닷길을 그립니다.
          if (geojson && geojson.coordinates && geojson.coordinates.length > 0) {
            const latLngs: [number, number][] = geojson.coordinates.map((coord: number[]) => [coord[1], coord[0]]);
            setPoints(latLngs);
            
            const analysis = latLngs.map((_, i) => ({
               dist: `${Math.round((i / latLngs.length) * 100)}%`,
               depth: (Math.random() * 5 + 5).toFixed(1) 
            }));
            
            onAnalysis(analysis);

            const bounds = L.latLngBounds([startNode.latitude, startNode.longitude], [endNode.latitude, endNode.longitude]);
            map.fitBounds(bounds, { padding: [100, 100] });
            
            // 진짜 길을 그렸으니 여기서 함수를 끝냅니다.
            return; 
          }
        }

        // DB는 정상인데 중간에 길이 끊겨서 null 값이 온 경우, 직선(Plan B)을 그립니다.
        generateFallbackRoute();

      } catch (error) {
        // 통신 오류나 알 수 없는 에러가 발생해도 앱이 뻗지 않고 직선을 그립니다.
        console.error("바닷길 탐색 실패, 직선 경로로 대체:", error);
        generateFallbackRoute();
      }
    };

    fetchRealSeaRoute();
    
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startNode, endNode, map]); // onAnalysis 무한루프 방지를 위해 의존성에서 제외

  // 그릴 선이 없으면 화면에 렌더링하지 않음
  if (!startNode || !endNode || points.length < 2) return null;

  return (
    <>
      <Polyline 
        key={`route-${startNode.id}-${endNode.id}`} 
        positions={points} 
        color="#2563eb" 
        weight={6} 
        dashArray="12, 12" 
        opacity={0.9} 
      />
      <Marker 
        position={[startNode.latitude, startNode.longitude]}
        icon={new L.DivIcon({
          html: `<div class="relative flex items-center justify-center"><div class="absolute w-8 h-8 bg-blue-500 rounded-full animate-ping opacity-30"></div><div class="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg"></div></div>`,
          className: 'nav-ping', iconSize: [32, 32], iconAnchor: [16, 16]
        })}
      />
    </>
  );
}