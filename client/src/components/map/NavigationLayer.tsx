import { useEffect, useState } from 'react';
import { Polyline, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';

export default function NavigationLayer({ startNode, endNode, onAnalysis }: any) {
  const map = useMap();
  const [points, setPoints] = useState<[number, number][]>([]);

  useEffect(() => {
    if (startNode && endNode) {
      // 1. 실제 경로 좌표 계산 (여기서는 시뮬레이션을 위해 20단계 세분화)
      const route: [number, number][] = [];
      const analysis: any[] = [];
      const steps = 30; // 더 정밀하게

      for (let i = 0; i <= steps; i++) {
        const r = i / steps;
        // 위도, 경도 보간
        const lat = startNode.latitude + (endNode.latitude - startNode.latitude) * r;
        const lng = startNode.longitude + (endNode.longitude - startNode.longitude) * r;
        
        route.push([lat, lng]);
        
        // 2. 경로상의 수심 데이터 생성 (기초 수심 사이의 지형 시뮬레이션)
        analysis.push({
          dist: `${Math.round(r * 100)}%`,
          depth: (Number(startNode.depth) + (Number(endNode.depth) - Number(startNode.depth)) * r + (Math.random() * 2)).toFixed(1)
        });
      }
      
      setPoints(route);
      onAnalysis(analysis);

      // 3. 경로가 한눈에 들어오도록 지도 자동 줌 조절
      const bounds = L.latLngBounds([startNode.latitude, startNode.longitude], [endNode.latitude, endNode.longitude]);
      map.fitBounds(bounds, { padding: [100, 100] });
    } else {
      setPoints([]);
    }
  }, [startNode, endNode, map]);

  if (points.length < 2) return null;

  return (
    <>
      <Polyline 
        positions={points} 
        color="#2563eb" 
        weight={6} 
        dashArray="10, 15" 
        opacity={0.8} 
      />
      {/* 출발지와 도착지에 커스텀 핀 표시 */}
      <Marker position={[startNode.latitude, startNode.longitude]} icon={new L.DivIcon({ html: `<div class="w-4 h-4 bg-blue-600 rounded-full border-2 border-white"></div>`, className: 's-marker' })} />
      <Marker position={[endNode.latitude, endNode.longitude]} icon={new L.DivIcon({ html: `<div class="w-4 h-4 bg-red-600 rounded-full border-2 border-white"></div>`, className: 'e-marker' })} />
    </>
  );
}