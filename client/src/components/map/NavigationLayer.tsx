import { useEffect, useState } from 'react';
// 지도에 여러 좌표를 이어 선을 그리기 위한 Polyline, 마커, 맵 훅을 불러옵니다.
import { Polyline, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';

export default function NavigationLayer({ startNode, endNode, onAnalysis }: any) {
  // 지도 시점(줌, 센터)을 강제로 조작하기 위해 useMap 훅을 가져옵니다.
  const map = useMap();
  
  // 백엔드에서 받아온 진짜 바닷길 좌표들(GeoJSON의 coordinates)을 저장할 상태 변수입니다.
  const [points, setPoints] = useState<[number, number][]>([]);
  // 길찾기 로딩 상태를 보여주기 위한 상태 변수입니다.
  const [isLoading, setIsLoading] = useState(false);

  // 출발지(startNode)나 도착지(endNode)가 바뀔 때마다 이 useEffect가 실행됩니다.
  useEffect(() => {
    // 1. 출발지나 도착지가 하나라도 없으면 선을 그리지 않고 초기화합니다.
    if (!startNode || !endNode) {
      setPoints([]);
      onAnalysis([]);
      return;
    }

    // 2. 백엔드에 길찾기를 요청하는 비동기 함수를 선언합니다.
    const fetchRealSeaRoute = async () => {
      setIsLoading(true); // 로딩 시작
      
      try {
        // [핵심] 우리가 아까 만든 백엔드의 '원격 호출 함수(RPC)'인 find_safe_sea_route를 찌릅니다.
        // 프론트엔드에서는 DB에 직접 접근하기 어려우니, 중간에 있는 API 서버(Node.js 등)를 통해 
        // 쿼리를 날리는 것이 정석입니다. (여기서는 예시로 Supabase Client의 rpc를 직접 사용합니다)
        // 주의: SupabaseClient(supabase)가 이 파일 상단에 import 되어 있어야 합니다!
        // 만약 Node.js API로 만들었다면 axios.post('http://.../api/route', { start, end })를 씁니다.
        
        // Supabase RPC(Remote Procedure Call)를 사용해 PostgreSQL 함수를 직접 실행합니다.
        const { supabase } = await import('../../supabaseClient'); // 동적 임포트로 불러옴
        
        const { data, error } = await supabase.rpc('find_safe_sea_route', {
          start_lat: startNode.latitude,
          start_lon: startNode.longitude,
          end_lat: endNode.latitude,
          end_lon: endNode.longitude
        });

        if (error) throw error;
        
        if (data) {
          // 백엔드에서 반환된 GeoJSON 텍스트(선 데이터)를 JSON 객체로 파싱합니다.
          const geojson = JSON.parse(data);
          
          // GeoJSON의 좌표는 [경도(lon), 위도(lat)] 순서로 되어 있습니다.
          // Leaflet 지도는 [위도(lat), 경도(lon)] 순서를 요구하므로, 배열을 뒤집어 줍니다.
          const latLngs: [number, number][] = geojson.coordinates.map((coord: number[]) => [coord[1], coord[0]]);
          
          // 변환된 진짜 바닷길 좌표를 상태에 저장하여 화면에 그리도록 유도합니다.
          setPoints(latLngs);
          
          // (선택) 경로의 중간 수심 등을 시뮬레이션해서 차트에 뿌려주는 분석 데이터 생성 (기존 로직 유지)
          const analysis = latLngs.map((_, i) => ({
             dist: `${Math.round((i / latLngs.length) * 100)}%`,
             depth: (Math.random() * 5 + 5).toFixed(1) // 임시 랜덤 수심
          }));
          onAnalysis(analysis);

          // 3. 길이 성공적으로 찾아지면, 출발지와 도착지가 한 화면에 다 들어오도록 지도 시점을 줌 아웃 합니다.
          const bounds = L.latLngBounds([startNode.latitude, startNode.longitude], [endNode.latitude, endNode.longitude]);
          map.fitBounds(bounds, { padding: [100, 100] });
        }
      } catch (error) {
        console.error("바닷길 길찾기 실패:", error);
        alert("해당 구간의 바닷길 데이터를 찾을 수 없습니다.");
      } finally {
        setIsLoading(false); // 로딩 종료
      }
    };

    // 선언한 길찾기 함수를 실행합니다.
    fetchRealSeaRoute();
    
  }, [startNode, endNode, map]); 

  // 출발지/도착지가 없거나, 아직 길을 못 찾아서 점이 2개 미만이면 화면에 그릴 게 없으니 null 반환
  if (!startNode || !endNode || points.length < 2) return null;

  return (
    <>
      {/* 백엔드에서 가져온 진짜 바닷길(points)을 파란색 실선으로 예쁘게 그려줍니다. */}
      <Polyline 
        key={`route-${startNode.id}-${endNode.id}`} 
        positions={points} 
        color="#2563eb" // 짙은 파란색
        weight={5}     // 선 두께
        opacity={0.8}  // 살짝 투명하게
      />
      
      {/* 출발지 마커: 파란색 원이 핑(Ping) 하고 퍼지는 애니메이션 효과를 줍니다. */}
      <Marker 
        position={[startNode.latitude, startNode.longitude]}
        icon={new L.DivIcon({
          html: `<div class="relative flex items-center justify-center"><div class="absolute w-8 h-8 bg-blue-500 rounded-full animate-ping opacity-30"></div><div class="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg"></div></div>`,
          className: 'nav-ping', 
          iconSize: [32, 32], 
          iconAnchor: [16, 16]
        })}
      />
    </>
  );
}