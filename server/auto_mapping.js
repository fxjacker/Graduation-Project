// 환경변수를 로드하기 위해 dotenv 모듈을 불러옵니다.
require('dotenv').config();
// Supabase 클라이언트를 생성하기 위한 모듈을 가져옵니다.
const { createClient } = require('@supabase/supabase-js');

// 환경변수에서 Supabase URL과 API Key를 가져와 통신 클라이언트를 생성합니다.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 지구의 둥근 곡률을 반영하여 두 위경도 좌표 간의 실제 거리(km)를 구하는 공식입니다.
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const dLat = deg2rad(lat2 - lat1);  
    const dLon = deg2rad(lon2 - lon1); 
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c; 
}

// 각도를 라디안 단위로 변환해 주는 헬퍼 함수입니다.
function deg2rad(deg) {
    return deg * (Math.PI/180);
}

// 자동 매핑 로직을 실행할 메인 함수입니다.
async function autoMapNearestStations() {
    console.log('🚀 마리나 - 조위관측소 자동 매핑 스크립트 시작...');

    try {
        // 1. Supabase에서 마리나와 관측소 목록을 비동기적으로 가져옵니다.
        const { data: marinas, error: marinaErr } = await supabase.from('marina_list').select('id, name, latitude, longitude');
        if (marinaErr) throw marinaErr;

        const { data: stations, error: stationErr } = await supabase.from('ocean_observations').select('station_id, station_name, latitude, longitude');
        if (stationErr) throw stationErr;

        console.log(`✅ 데이터 로드 완료: 마리나 ${marinas.length}개, 관측소 ${stations.length}개`);

        const updates = [];

        // 2. 마리나를 순회하며 가장 가까운 관측소를 찾습니다.
        for (const marina of marinas) {
            if (!marina.latitude || !marina.longitude) continue;

            let minDistance = Infinity;
            let nearestStationId = null;

            for (const station of stations) {
                if (!station.latitude || !station.longitude) continue;

                const distance = getDistanceFromLatLonInKm(marina.latitude, marina.longitude, station.latitude, station.longitude);

                if (distance < minDistance) {
                    minDistance = distance;
                    nearestStationId = station.station_id;
                }
            }

            if (nearestStationId) {
                updates.push({
                    id: marina.id,
                    nearest_station_id: nearestStationId
                });
                console.log(`📍 [${marina.name}] -> 최인접 관측소 매핑: ${nearestStationId} (약 ${minDistance.toFixed(1)}km)`);
            }
        }

        // 3. (수정된 부분) upsert 대신 하나씩 update 방식으로 안전하게 저장합니다.
        if (updates.length > 0) {
            console.log('\n💾 데이터베이스에 안전하게 개별 업데이트를 진행합니다...');
            
            // 배열을 돌면서 해당 마리나의 nearest_station_id 컬럼만 딱 수정합니다.
            for (const update of updates) {
                const { error: updateErr } = await supabase
                    .from('marina_list')
                    .update({ nearest_station_id: update.nearest_station_id }) // 수정할 데이터
                    .eq('id', update.id); // 업데이트할 마리나 지정 조건
                
                // 에러가 나면 즉시 멈추고 에러를 뱉습니다.
                if (updateErr) throw updateErr;
            }
            
            console.log(`🎉 매핑 완벽하게 성공! 총 ${updates.length}개의 마리나에 인접 관측소 ID가 등록되었습니다.`);
        }

    } catch (err) {
        console.error('❌ 스크립트 실행 중 에러 발생:', err.message);
    }
}

autoMapNearestStations();