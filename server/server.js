// 환경변수 로드 및 초기화
require('dotenv').config();

// routes 폴더에 분리해둔 AI 챗봇 라우터 파일을 불러옵니다.
const chatRouter = require('./routes/chat');
// Express 프레임워크 및 미들웨어 모듈 로드
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// 외부 API 통신 및 데이터베이스 연결 모듈 로드
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const cron = require('node-cron');
const WebSocket = require('ws');

// 새로 분리한 auth 라우터 모듈 불러오기
const authRoutes = require('./routes/auth');
// 애플리케이션 인스턴스 생성 및 포트 설정 (환경변수 우선 적용)
const app = express();
// 프론트엔드에서 '/api/chat' 경로로 들어오는 모든 요청을 chatRouter로 보냅니다.
app.use(express.json());
app.use('/api/chat', chatRouter);
// 클라우드 호스팅 환경의 동적 포트 할당을 지원하기 위한 조건부 포트 바인딩
const PORT = process.env.PORT || 3000;

// Supabase 클라이언트 환경 변수 로드
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
// 인증 정보를 기반으로 Supabase 클라이언트 인스턴스 초기화
const supabase = createClient(supabaseUrl, supabaseKey);

// CORS(교차 출처 리소스 공유) 정책 설정 객체 생성
const corsOptions = {
    // 프론트엔드 호스트 도메인(Vite 로컬 서버)에 대한 리소스 접근 허용
    origin: ['http://localhost:5173'], 
    // Legacy 브라우저 호환성을 위한 200 상태 코드 명시적 반환
    optionsSuccessStatus: 200
};
// 애플리케이션 전역 미들웨어로 CORS 정책 적용
app.use(cors(corsOptions));

// API 요청 제한(Rate Limiting) 설정 (DDoS 및 과도한 트래픽 인입 방지)
const apiLimiter = rateLimit({
    // 제한 윈도우 크기를 1분(60,000 밀리초)으로 설정
    windowMs: 1 * 60 * 1000, 
    // 지정된 윈도우 내 단일 IP당 최대 허용 요청 수를 50회로 제한
    max: 50, 
    // 임계치 초과 시 클라이언트에게 반환될 HTTP 429 오류 메시지
    message: '요청 횟수를 초과하였습니다. 잠시 후 다시 시도해 주십시오.',
    // RateLimit-* 표준 HTTP 헤더를 응답에 포함하도록 설정
    standardHeaders: true,
    // 구형 X-RateLimit-* 헤더 전송 비활성화
    legacyHeaders: false,
});
// /api/ 하위의 모든 라우팅 경로에 Rate Limiting 미들웨어 적용
app.use('/api/', apiLimiter);
app.use('/api/auth', authRoutes);

// 인메모리(In-memory) 데이터 캐싱을 위한 Map 객체 초기화 (선박 위치 정보 임시 저장소)
const shipCache = new Map();
// AIS 실시간 데이터 스트리밍 서비스의 WebSocket 엔드포인트 URL 상수 정의
const AIS_STREAM_URL = 'wss://stream.aisstream.io/v0/stream';
// 환경변수로부터 AIS API Key 안전하게 로드
const aisApiKey = process.env.AISSTREAM_API_KEY;

// WebSocket 클라이언트 인스턴스 참조 변수
let aisSocket;

// WebSocket 연결 및 자동 재연결(Auto-Reconnect) 로직을 캡슐화한 함수
function connectAIS() {
    // 외부 스트리밍 서버와의 실시간 소켓 연결 수립
    aisSocket = new WebSocket(AIS_STREAM_URL);

    // 소켓 통신 채널이 개방되었을 때 실행되는 이벤트 리스너
    aisSocket.on('open', () => {
        // 대한민국 영해를 포괄하는 2차원 공간 경계 상자(Bounding Box) 정의
        //const boundingBoxes = [[[32.0, 124.0], [39.0, 132.0]]];
        //const boundingBoxes = [[[-90, -180], [90, 180]]];
        //const boundingBoxes = [[[30.0, 120.0], [43.0, 135.0]]];
        const boundingBoxes = [[[20.0, 115.0], [45.0, 145.0]]];
        //const boundingBoxes = [[[32.0, 124.0], [39.0, 132.0]]];
        //const boundingBoxes = [[[30.0, 120.0], [43.0, 135.0]]];
        // 불필요한 패킷을 필터링하고 위치 보고(PositionReport) 데이터만 수신하도록 설정
        const filterMessageTypes = ["PositionReport"];

        // 스트리밍 구독 권한 인증 및 파라미터 설정을 위한 페이로드 구성
        const subscriptionMessage = {
            Apikey: aisApiKey,
            BoundingBoxes: boundingBoxes,
            FilterMessageTypes: filterMessageTypes
        };

        // 구성된 JSON 페이로드를 직렬화하여 서버로 전송 (구독 활성화)
        aisSocket.send(JSON.stringify(subscriptionMessage));
        console.log('✅ [AIS WebSocket] 대한민국 해역 실시간 선박 데이터 스트리밍 연결 완료');
    });

    // 스트리밍 서버로부터 메시지를 수신할 때 트리거되는 이벤트 리스너
    aisSocket.on('message', (data) => {
        // 수신된 Buffer 데이터를 JSON 객체로 파싱
        const parsedMessage = JSON.parse(data.toString());

        // 메시지 타입이 선박의 위치 데이터(PositionReport)인 경우에만 처리 로직 수행
        if (parsedMessage.MessageType === "PositionReport") {
            const positionReport = parsedMessage.Message.PositionReport;
            // 선박의 고유 해상 식별 번호(MMSI) 추출
            const mmsi = positionReport.UserID;


            // 프론트엔드 공간 데이터 시각화 요구사항에 맞춘 데이터 모델 정제
            const shipData = {
                mmsi: mmsi,
                latitude: positionReport.Latitude,
                longitude: positionReport.Longitude,
                speed_over_ground: positionReport.Sog, // 대지 속력 (노트 단위)
                course_over_ground: positionReport.Cog, // 이동 방향 (각도)
                true_heading: positionReport.TrueHeading, // 실제 선수 방향
                updated_at: new Date().toISOString() // 데이터 최신화 타임스탬프
            };

            // Map 자료구조를 활용하여 기존 위치 데이터를 최신화 (시간 복잡도 O(1))
            shipCache.set(mmsi, shipData);

        }
    });

    // 소켓 통신 중 오류 발생 시 실행되는 예외 처리 리스너
    aisSocket.on('error', (error) => {
        console.error('❌ [AIS WebSocket Error] 스트리밍 서버 통신 오류 발생:', error.message);
    });

    // 원격 서버 또는 네트워크 이슈로 인해 소켓 연결이 종료되었을 때 실행되는 리스너
    aisSocket.on('close', () => {
        console.log('⚠️ [AIS WebSocket] 통신 채널이 예기치 않게 종료되었습니다. 5초 후 재연결 시퀀스를 시작합니다.');
        // 무중단 관제 서비스를 보장하기 위한 5초 지연 후 자동 재연결(Fallback) 수행
        setTimeout(connectAIS, 5000);
    });
}

// 서버 구동 시 초기 WebSocket 연결 프로세스 실행
connectAIS();

// 클라이언트가 실시간 선박 위치 데이터를 요청할 때 응답을 처리하는 RESTful 엔드포인트
app.get('/api/realtime-ships', (req, res) => {
    // Map 객체 내부에 캐싱된 모든 선박의 상태 객체를 클라이언트 전송용 배열로 형변환
    const currentShips = Array.from(shipCache.values());
    // 성공 상태 코드 200과 함께 직렬화된 선박 배열 반환
    res.status(200).json(currentShips);
});

// 기상청 초단기실황 날씨 데이터 수집 및 DB 동기화 API 엔드포인트
app.get('/api/weather-data', async (req, res) => {
    try {
        let now = new Date();
        // 기상청 API 데이터 갱신 주기(매시간 40분)를 고려한 요청 기준 시간(Base Time) 보정
        if (now.getMinutes() < 40) {
            now.setHours(now.getHours() - 1);
        }
        // 기준 일자 및 시간을 공공데이터포털 규격(YYYYMMDD, HH00)에 맞게 포맷팅
        const baseDate = now.getFullYear().toString() + (now.getMonth() + 1).toString().padStart(2, '0') + now.getDate().toString().padStart(2, '0');
        const baseTime = now.getHours().toString().padStart(2, '0') + '00';

        // 데이터베이스에서 전국 마리나 메타데이터 목록 비동기 조회
        const { data: marinaList, error: fetchError } = await supabase.from('marina_list').select('*');
        if (fetchError) throw fetchError;

        const allWeatherData = [];
        // 외부 API 트래픽 과부하 방지를 위한 동기적 지연(Delay) 헬퍼 함수 선언
        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        // 각 마리나 지점별 기상 데이터 순차적 요청 로직 처리
        for (const marina of marinaList) {
            // 위경도 좌표계(nx, ny) 기반 초단기실황 API 쿼리 스트링 조합
            const weatherApiUrl = `http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst?ServiceKey=15226c3443a2e750bda85a59a0c57a20c72ebc24ce84595c8130963d91127c6c&pageNo=1&numOfRows=10&dataType=JSON&base_date=${baseDate}&base_time=${baseTime}&nx=${marina.nx}&ny=${marina.ny}`;
            let success = false;
            let retryCount = 3;

            // HTTP 429(Too Many Requests) 예외 상황 대응을 위한 지수 백오프 기반 재시도(Retry) 패턴
            while (retryCount > 0 && !success) {
                try {
                    // API 호출 및 JSON 응답 데이터 맵핑
                    const response = await axios.get(weatherApiUrl);
                    const weatherItems = response.data.response?.body?.items?.item;

                    // 유효하지 않은 응답 데이터 수신 시 루프 탈출
                    if (!weatherItems) {
                        console.error(`[${marina.name}] 기상청 데이터 응답 페이로드 누락.`);
                        break;
                    }

                    // DB 스키마 설계에 맞춘 기상 관측 데이터 객체 초기화
                    const currentWeatherData = {
                        station_id: marina.id,
                        station_name: marina.name,
                        latitude: marina.latitude,
                        longitude: marina.longitude,
                        temperature: null,
                        wind_speed: null,
                        updated_at: new Date().toISOString()
                    };

                    // 응답 데이터 배열 순회 및 주요 기상 지표(기온, 풍속) 변수 바인딩
                    weatherItems.forEach(item => {
                        if (item.category === 'T1H') currentWeatherData.temperature = parseFloat(item.obsrValue);
                        if (item.category === 'WSD') currentWeatherData.wind_speed = parseFloat(item.obsrValue);
                    });

                    // 유효성 검증을 통과한 기상 데이터를 누적 배열에 삽입
                    allWeatherData.push(currentWeatherData);
                    success = true;
                    // 공공데이터포털 서버 안정성을 고려하여 1.5초(1500ms) 대기
                    await sleep(1500); 

                } catch (err) {
                    // 429 에러 코드 반환 시 재시도 로직 트리거
                    if (err.response && err.response.status === 429) {
                        console.log(`[${marina.name}] HTTP 429 발생. 5초 대기 후 재시도 수행 (잔여 횟수: ${retryCount - 1})`);
                        await sleep(5000);
                        retryCount--;
                    } else {
                        // 기타 네트워크 통신 장애 시 해당 지점 데이터 수집 중단
                        console.error(`[${marina.name}] 기타 네트워크 통신 장애 발생:`, err.message);
                        break;
                    }
                }
            }
        }

        // 수집 완료된 기상 데이터 배열을 Supabase 관측 테이블에 일괄 Upsert 처리 (Bulk Operation)
        const { error } = await supabase.from('weather_observations').upsert(
            allWeatherData,
            { onConflict: 'station_id' } // 식별자 중복 시 최신 데이터로 Update 
        );

        // 데이터 트랜잭션 실패 시 예외 투척
        if (error) throw error;

        console.log(`✅ 데이터베이스 동기화 완료: 총 ${allWeatherData.length}개 지점 기상 현황 갱신`);
        res.status(200).json(allWeatherData);

    } catch (err) {
        console.error('기상 데이터 파이프라인 내부 오류:', err.message);
        res.status(500).json({ message: '기상 데이터 처리 중 서버 내부 오류가 발생하였습니다.' });
    }
});

// 해양조사원 조위관측소 해양 관측 데이터(수심, 수온, 염분 등) 수집 API
app.get('/api/ocean-data', async (req, res) => {
    try {
        const portalKey = '15226c3443a2e750bda85a59a0c57a20c72ebc24ce84595c8130963d91127c6c';
        
        // 전역 해양 관측을 위한 조위관측소 메타데이터 식별자(ID) 배열
        const oceanStationIds = [
            'DT_0001', 'DT_0002', 'DT_0003', 'DT_0004', 'DT_0005', 'DT_0006', 'DT_0007', 'DT_0008',
            'DT_0010', 'DT_0011', 'DT_0012', 'DT_0013', 'DT_0014', 'DT_0016', 'DT_0017', 'DT_0018',
            'DT_0020', 'DT_0021', 'DT_0022', 'DT_0023', 'DT_0024', 'DT_0025', 'DT_0026', 'DT_0027',
            'DT_0028', 'DT_0029', 'DT_0031', 'DT_0032', 'DT_0035', 'DT_0037', 'DT_0039', 'DT_0042',
            'DT_0043', 'DT_0044', 'DT_0049', 'DT_0050', 'DT_0051', 'DT_0052', 'DT_0056', 'DT_0057',
            'DT_0061', 'DT_0062', 'DT_0063', 'DT_0065', 'DT_0066', 'DT_0067', 'DT_0068', 'DT_0091',
            'DT_0092', 'DT_0093', 'DT_0094', 'DT_0902', 'IE_0060', 'IE_0061', 'IE_0062'
        ];

        const allOceanData = [];
        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        // 각 조위관측소 지점별 비동기 데이터 펫칭 작업 수행
        for (const stationId of oceanStationIds) {
            const apiUrl = 'https://apis.data.go.kr/1192136/dtRecent/GetDTRecentApiService';
            let success = false;
            let retryCount = 3;

            while (retryCount > 0 && !success) {
                try {
                    // Query 파라미터 기반 REST API 요청 호출
                    const response = await axios.get(apiUrl, {
                        params: {
                            serviceKey: portalKey,
                            obsCode: stationId,
                            type: 'json'
                        }
                    });

                    // 응답 페이로드 내림차순 검증 및 데이터 노드 추출
                    let items = response.data?.body?.items?.item;
                    let item = Array.isArray(items) ? items[0] : items;

                    if (!item) {
                        console.error(`[${stationId}] 관측소 데이터 응답 누락.`);
                        break;
                    }

                    // 수치형 데이터(Float) 안전 변환을 통한 데이터 모델 구성
                    const currentData = {
                        station_id: stationId,
                        station_name: item.obsvtrNm || stationId,
                        latitude: item.lat ? parseFloat(item.lat) : null,
                        longitude: item.lot ? parseFloat(item.lot) : null,
                        tide_level: item.bscTdlvHgt ? parseFloat(item.bscTdlvHgt) : null, // 기본 수준면 기반 조위
                        water_temp: item.wtem ? parseFloat(item.wtem) : null, // 실시간 수온
                        salinity: item.slntQty ? parseFloat(item.slntQty) : null, // 염분 농도
                        air_temp: item.artmp ? parseFloat(item.artmp) : null,
                        air_pres: item.atmpr ? parseFloat(item.atmpr) : null,
                        wind_dir: item.wndrct ? parseFloat(item.wndrct) : null,
                        wind_speed: item.wspd ? parseFloat(item.wspd) : null,
                        current_dir: item.crdir ? parseFloat(item.crdir) : null,
                        current_speed: item.crsp ? parseFloat(item.crsp) : null,
                        updated_at: new Date().toISOString()
                    };

                    allOceanData.push(currentData);
                    success = true;
                    // 안정적인 호출을 위한 1.5초 딜레이 주입
                    await sleep(1500);

                } catch (err) {
                    if (err.response && err.response.status === 429) {
                        console.log(`[${stationId}] HTTP 429 발생. 5초 후 백오프 재시도 (잔여: ${retryCount - 1})`);
                        await sleep(5000);
                        retryCount--;
                    } else {
                        console.error(`[${stationId}] 해양 API 통신 중 예외 발생:`, err.message);
                        break;
                    }
                }
            }
        }

        // 수집 데이터 존재 시 일괄 갱신 트랜잭션 수행
        if (allOceanData.length > 0) {
            const { error } = await supabase.from('ocean_observations').upsert(
                allOceanData,
                { onConflict: 'station_id' }
            );
            if (error) throw error;
        }

        res.status(200).json(allOceanData);

    } catch (err) {
        console.error('해양 데이터 파이프라인 내부 오류:', err.message);
        res.status(500).json({ message: '해양 데이터 처리 중 서버 내부 오류가 발생하였습니다.' });
    }
});

// 해양조사원 HF-RADAR 실측 해수유동 데이터 수집 API
app.get('/api/tidal-current', async (req, res) => {
    try {
        const serviceKey = '15226c3443a2e750bda85a59a0c57a20c72ebc24ce84595c8130963d91127c6c';
        
        // 가이드 p.3 관측소 목록 반영 (동해 포함) [cite: 12]
        const seaFlowStations = [
            'HF_0071', 'HF_0073', 'HF_0063', 'HF_0041', 'HF_0039', 
            'HF_0064', 'HF_0065', 'HF_0040', 'HF_0074', 'HF_0075', 
            'HF_0069', 'HF_0070', 'HF_0076'
        ];

        let allSeaFlowData = [];
        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        for (const stationId of seaFlowStations) {
            // 운영환경 URL: hfCurrent 엔드포인트 사용 [cite: 8]
            const apiUrl = `https://apis.data.go.kr/1192136/hfCurrent/GetHFCurrentApiService`;
            
            try {
                const response = await axios.get(apiUrl, {
                    params: {
                        serviceKey: serviceKey,
                        obsCode: stationId,
                        type: 'json'
                    }
                });

                // 응답 데이터 목록 추출 
                const items = response.data?.body?.items?.item;

                if (items && Array.isArray(items)) {
                    items.forEach(item => {
                        allSeaFlowData.push({
                            // 위경도를 조합하여 Supabase의 Primary Key(station_id) 생성
                            station_id: `${stationId}_${item.lat}_${item.lot}`,
                            latitude: parseFloat(item.lat),
                            longitude: parseFloat(item.lot),
                            current_direction: parseFloat(item.crdir), // 유향(deg) 
                            current_speed: parseFloat(item.crsp),       // 유속(cm/s) 
                            updated_at: new Date().toISOString()
                        });
                    });
                }
                await sleep(500); // 서버 부하 방지용 딜레이

            } catch (err) {
                console.error(`[${stationId}] API 호출 중 오류:`, err.message);
            }
        }

        // Supabase에 대량 Upsert 실행 (고유 ID 기준 중복 시 갱신)
        if (allSeaFlowData.length > 0) {
            const { error } = await supabase
                .from('tidal_current_observations')
                .upsert(allSeaFlowData, { onConflict: 'station_id' });

            if (error) throw error;
        }

        console.log(`✅ DB 동기화 완료: 총 ${allSeaFlowData.length}개 격자 데이터 갱신`);
        res.status(200).json(allSeaFlowData);

    } catch (err) {
        console.error('해수유동 파이프라인 오류:', err.message);
        res.status(500).json({ message: '데이터 처리 중 서버 오류 발생' });
    }
});

// ==================================================================
// 백그라운드 스케줄러(Cron Jobs) 구성 (동시 다발적 API 요청으로 인한 병목 회피 구조)
// ==================================================================

// 1. 기상 데이터 스케줄러: 매 시 정각 기준 10분 주기 구동 (0, 10, 20 ...)
cron.schedule('*/10 * * * *', async () => {
    console.log('\n⏰ [Scheduler] 기상 데이터 수집 배치 프로세스 실행');
    try {
        await axios.get(`http://localhost:${PORT}/api/weather-data`);
        console.log('✅ [Scheduler] 기상 데이터 파이프라인 갱신 완료\n');
    } catch (err) {
        console.error('❌ [Scheduler Error] 기상 수집 프로세스 오류:', err.message);
    }
});

// 2. 해양 데이터 스케줄러: 기상 데이터와 충돌을 막기 위해 2분 오프셋 지연 구동 (2, 12, 22 ...)
cron.schedule('2-59/10 * * * *', async () => {
    console.log('\n🌊 [Scheduler] 해양 관측 데이터 수집 배치 프로세스 실행');
    try {
        await axios.get(`http://localhost:${PORT}/api/ocean-data`);
        console.log('✅ [Scheduler] 해양 관측 데이터 파이프라인 갱신 완료\n');
    } catch (err) {
        console.error('❌ [Scheduler Error] 해양 수집 프로세스 오류:', err.message);
    }
});

// 3. 조류 데이터 스케줄러: 트래픽 분산을 위해 4분 오프셋 지연 구동 (4, 14, 24 ...)
cron.schedule('4-59/10 * * * *', async () => {
    console.log('\n➡️ [Scheduler] 조류(Tidal) 공간 데이터 수집 배치 프로세스 실행');
    try {
        await axios.get(`http://localhost:${PORT}/api/tidal-current`);
        console.log('✅ [Scheduler] 조류 공간 데이터 파이프라인 갱신 완료\n');
    } catch (err) {
        console.error('❌ [Scheduler Error] 조류 수집 프로세스 오류:', err.message);
    }
});

// ==================================================================
// 📡 프론트엔드(광현님) 통신용 RESTful API 라우터 구간
// ==================================================================

// 프론트엔드에서 전국 마리나 위치 마커를 찍기 위해 목록을 요청하는 GET 라우터야
app.get('/api/marinas', async (req, res) => {
    try {
        // Supabase의 marina_list 테이블에서 모든(*) 데이터를 싹 다 조회해와
        const { data: marinas, error } = await supabase.from('marina_list').select('*');
        
        // 디비 조회 중 에러가 났으면 바로 catch문으로 에러를 던져버려
        if (error) throw error;
        
        // 성공했으면 프론트엔드한테 200(성공) 코드랑 마리나 배열(JSON)을 예쁘게 포장해서 보내줘
        res.status(200).json(marinas);
        
    // try문 안에서 에러가 터지면 여기서 잡아채서 처리해
    } catch (err) {
        // 서버 콘솔창에 어떤 에러인지 빨간불로 띄워주고
        console.error('마리나 목록 조회 에러:', err.message);
        // 프론트엔드한테는 500(서버 터짐) 상태 코드랑 친절한 한국어 에러 메시지를 보내줘
        res.status(500).json({ message: '서버에서 마리나 데이터를 불러오는데 실패했습니다.' });
    // try-catch문 닫기
    }
// 마리나 목록 API 라우터 닫기
});

// 프론트엔드에서 특정 마리나를 클릭했을 때, 그 마리나의 '현재 날씨'만 물어보는 GET 라우터야
app.get('/api/marinas/:id/weather', async (req, res) => {
    try {
        // 클라이언트가 요청한 URL 주소에서 마리나 ID(예: MARINA_1)만 변수에 쏙 빼와
        const marinaId = req.params.id;
        
        // Supabase 날씨 테이블에서 station_id 컬럼이 방금 빼온 ID랑 똑같은 딱 한 줄(.single())만 찾아와
        const { data: weather, error } = await supabase
            .from('weather_observations')
            .select('*')
            .eq('station_id', marinaId)
            .single();
            
        // 에러가 났는데, 그게 '데이터가 아직 안 쌓여서 없는 에러(PGRST116)'가 아닌 진짜 서버 에러면 던져버려
        if (error && error.code !== 'PGRST116') throw error;
        
        // 찾아온 날씨 데이터가 있으면 그거 보내주고, 아직 없으면 빈 객체({})를 보내줘서 프론트 뻗는거 막아
        res.status(200).json(weather || {});
        
    // 에러 잡는 구간이야
    } catch (err) {
        // 백엔드 터미널에 어떤 마리나에서 날씨 에러 났는지 로그 남겨줘
        console.error(`[${req.params.id}] 날씨 조회 에러:`, err.message);
        // 프론트엔드한테는 500 에러 코드 던져서 안내해줘
        res.status(500).json({ message: '해당 마리나의 실시간 날씨 정보를 불러올 수 없습니다.' });
    // try-catch문 닫기
    }
// 특정 마리나 날씨 조회 API 라우터 닫기
});

// 프론트엔드에서 특정 관측소의 '실시간 수심/해양 데이터'를 물어보는 GET 라우터야
app.get('/api/ocean-stations/:id', async (req, res) => {
    try {
        // 클라이언트가 요청한 URL 파라미터에서 관측소 ID(예: DT_0001) 빼오기
        const stationId = req.params.id;
        
        // Supabase 수심 테이블에서 관측소 ID가 일치하는 최신 데이터 한 줄 가져오기
        const { data: oceanData, error } = await supabase
            .from('ocean_observations')
            .select('*')
            .eq('station_id', stationId)
            .single();
            
        // 진짜 서버 통신 에러면 catch로 던지기
        if (error && error.code !== 'PGRST116') throw error;
        
        // 데이터 성공적으로 프론트에 쏴주기
        res.status(200).json(oceanData || {});
        
    // 에러 처리 구간
    } catch (err) {
        // 에러 로그 찍기
        console.error(`[${req.params.id}] 수심 데이터 조회 에러:`, err.message);
        // 프론트에 500 에러 응답하기
        res.status(500).json({ message: '해양 관측소 데이터를 불러올 수 없습니다.' });
    // try-catch 닫기
    }
// 특정 관측소 수심 조회 API 라우터 닫기
});

app.get('/api/marinas/:id/realtime-depth', async (req, res) => {
    try {
        const marinaId = req.params.id;

        const { data: marina, error: marinaError } = await supabase
            .from('marina_list')
            .select('base_depth, nearest_station_id')
            .eq('id', marinaId)
            .single();

        if (marinaError) throw marinaError;

        if (!marina.nearest_station_id || marina.base_depth == null) {
            return res.status(404).json({ message: '해당 마리나의 수심 데이터나 관측소 매핑 정보가 없습니다.' });
        }

        const { data: oceanData, error: oceanError } = await supabase
            .from('ocean_observations')
            .select('tide_level')
            .eq('station_id', marina.nearest_station_id)
            .single();

        if (oceanError && oceanError.code !== 'PGRST116') throw oceanError;

        const currentTide = oceanData && oceanData.tide_level != null ? oceanData.tide_level : 0;
        const realtimeDepth = marina.base_depth + (currentTide / 100);

        res.status(200).json({ 
            marina_id: marinaId, 
            base_depth: marina.base_depth, 
            current_tide_m: currentTide / 100,
            realtime_depth: parseFloat(realtimeDepth.toFixed(2)) 
        });

    } catch (err) {
        console.error(`[${req.params.id}] 실시간 수심 계산 에러:`, err.message);
        res.status(500).json({ message: '실시간 수심을 계산하는 중 서버 오류가 발생했습니다.' });
    }
});

// 정의된 환경변수 포트를 통해 HTTP 서버 소켓 바인딩 및 구동
app.listen(PORT, () => {
    console.log(`🚀 [Server] Node.js 백엔드 서버가 포트 ${PORT}에서 성공적으로 구동되었습니다.`);
});