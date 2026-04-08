// 파일 시스템 읽는 기본 모듈
const fs = require('fs');
// CSV 파일 파싱해주는 라이브러리
const csv = require('csv-parser');
// 외계어 좌표(EPSG:5179)를 위경도로 바꿔주는 갓갓 라이브러리
const proj4 = require('proj4');
// Supabase 연결용
const { createClient } = require('@supabase/supabase-js');

// 환경변수 털리면 ㅈ되니까 무조건 dotenv 써야됨ㅋㅋ
require('dotenv').config();

// 디비 연결 세팅
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 공공데이터포털에서 쓰는 EPSG:5179 좌표계 세팅 (이거 구글링해서 복붙함 ㅠ)
proj4.defs("EPSG:5179", "+proj=tmerc +lat_0=38 +lon_0=127.5 +k=0.9996 +x_0=1000000 +y_0=2000000 +ellps=GRS80 +units=m +no_defs");

// ⭐ 위도/경도를 기상청 nx, ny 격자로 변환해주는 흑마법 함수 
function getKmaGrid(lat, lon) {
    // 기상청 공식 문서에 있는 지구 반지름이랑 기준점 상수들임 
    const RE = 6371.00877;
    const GRID = 5.0;
    const SLAT1 = 30.0;
    const SLAT2 = 60.0;
    const OLON = 126.0;
    const OLAT = 38.0;
    const XO = 43;
    const YO = 136;
    
    // 계산식 개복잡함... 걍 갖다 쓰면 됨ㅋㅋ
    const DEGRAD = Math.PI / 180.0;
    const re = RE / GRID;
    const slat1 = SLAT1 * DEGRAD;
    const slat2 = SLAT2 * DEGRAD;
    const olon = OLON * DEGRAD;
    const olat = OLAT * DEGRAD;
    
    let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
    sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
    let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
    sf = Math.pow(sf, sn) * Math.cos(slat1) / sn;
    let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
    ro = re * sf / Math.pow(ro, sn);
    
    let ra = Math.tan(Math.PI * 0.25 + (lat) * DEGRAD * 0.5);
    ra = re * sf / Math.pow(ra, sn);
    let theta = lon * DEGRAD - olon;
    if (theta > Math.PI) theta -= 2.0 * Math.PI;
    if (theta < -Math.PI) theta += 2.0 * Math.PI;
    theta *= sn;
    
    // 최종적으로 계산된 nx, ny 객체를 리턴해줌
    return {
        nx: Math.floor(ra * Math.sin(theta) + XO + 0.5),
        ny: Math.floor(ro - ra * Math.cos(theta) + YO + 0.5)
    };
}

const results = [];
console.log('🚀 마리나 데이터 변환 앤드 DB 적재 스크립트 드가자~');

// 다운받은 CSV 파일 읽기 (경로 본인 피씨에 맞게 수정!)
fs.createReadStream('해양수산부_마리나 정보_20250124.csv')
    .pipe(csv())
    .on('data', (data) => {
        // 정규식 써서 괄호 안에 있는 숫자만 야무지게 빼오기
        const match = data['공간정보']?.match(/MULTIPOINT \(\(([^ ]+) ([^)]+)\)\)/);

        if (match) {
            const x = parseFloat(match[1]);
            const y = parseFloat(match[2]);

            // proj4 써서 외계어 좌표를 위경도로 변환
            const [longitude, latitude] = proj4("EPSG:5179", "WGS84", [x, y]);
            
            // 방금 만든 위경도로 기상청 nx, ny 격자값 뽑아내기!
            const grid = getKmaGrid(latitude, longitude);

            results.push({
                id: `MARINA_${data['공간정보일련번호']}`, 
                name: data['마리나항만명'],
                latitude: latitude,
                longitude: longitude,
                // 기상청 좌표도 같이 디비에 밀어넣을 준비 완
                nx: grid.nx,
                ny: grid.ny,
                address: data['전체주소'] 
            });
        }
    })
    .on('end', async () => {
        // 배열에 담긴 39개 데이터를 Supabase에 한방에 슛
        const { error } = await supabase.from('marina_list').upsert(results, { onConflict: 'id' });

        if (error) {
            console.error('❌ 아 디비 인서트 에러남 ㅠㅠ 다시 확인 ㄱㄱ:', error.message);
        } else {
            console.log(`✅ 성공ㅋㅋ 총 ${results.length}개 마리나 셋팅 완료! 이제 프론트 개발만 남음`);
        }
    });