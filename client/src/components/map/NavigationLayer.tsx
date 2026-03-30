import { useEffect, useState } from 'react';
import { Polyline, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';

export default function NavigationLayer({ startNode, endNode, onAnalysis }: any) {
  const map = useMap();
  const [points, setPoints] = useState<[number, number][]>([]);

  useEffect(() => {
    // [핵심 수정] 하나라도 없으면 계산을 중단하고 상태를 비움
    if (!startNode || !endNode) {
      setPoints([]);
      onAnalysis([]);
      return;
    }

    try {
      const route: [number, number][] = [];
      const analysis: any[] = [];
      const steps = 20;

      for (let i = 0; i <= steps; i++) {
        const r = i / steps;
        // Optional Chaining(?.)을 써서 한 번 더 보호
        const lat = startNode?.latitude + (endNode?.latitude - startNode?.latitude) * r;
        const lng = startNode?.longitude + (endNode?.longitude - startNode?.longitude) * r;
        
        if (!isNaN(lat) && !isNaN(lng)) {
          route.push([lat, lng]);
        }

        analysis.push({
          dist: `${Math.round(r * 100)}%`,
          depth: (Number(startNode?.depth || 0) + (Number(endNode?.depth || 0) - Number(startNode?.depth || 0)) * r + (Math.random() * 2)).toFixed(1)
        });
      }
      
      setPoints(route);
      onAnalysis(analysis);

      // 지도 시점 맞추기 (데이터가 유효할 때만)
      if (route.length > 0) {
        const bounds = L.latLngBounds([startNode.latitude, startNode.longitude], [endNode.latitude, endNode.longitude]);
        map.fitBounds(bounds, { padding: [100, 100] });
      }
    } catch (error) {
      console.error("Navigation calculation error:", error);
    }
  }, [startNode, endNode, map]); // onAnalysis는 의존성에서 제외 (무한루프 방지)

  // 데이터가 없으면 아예 아무것도 렌더링하지 않음 (null 반환)
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