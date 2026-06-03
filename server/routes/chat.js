// Express 웹 프레임워크 모듈을 불러옵니다.
const express = require('express');
// Express 라우터 객체를 생성하여 라우팅 모듈을 만듭니다.
const router = express.Router();
// .env 파일에 저장된 환경변수들을 프로세스 환경에 로드합니다.
require('dotenv').config();

// Supabase 데이터베이스와 통신하기 위한 클라이언트 생성 함수를 불러옵니다.
const { createClient } = require('@supabase/supabase-js');
// OpenAI API와 통신하기 위한 객체를 불러옵니다.
const { OpenAI } = require('openai');

// 환경변수에서 Supabase 접속 URL을 가져옵니다.
const supabaseUrl = process.env.SUPABASE_URL;
// 환경변수에서 Supabase API 키를 가져옵니다.
const supabaseKey = process.env.SUPABASE_KEY;

// 가져온 URL과 키를 사용하여 Supabase 클라이언트 인스턴스를 생성합니다.
const supabase = createClient(supabaseUrl, supabaseKey);

// 환경변수에서 OpenAI API 키를 가져와 OpenAI 클라이언트 인스턴스를 생성합니다.
const openai = new OpenAI({
    // 발급받은 OpenAI API 키를 세팅합니다.
    apiKey: process.env.OPENAI_API_KEY,
});

// 사용할 AI 모델 이름을 환경변수에서 가져오고, 없으면 'gpt-4o-mini'를 기본값으로 씁니다.
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
// AI가 생성할 최대 토큰(글자 수)을 가져오고, 없으면 500으로 제한합니다.
const OPENAI_MAX_TOKENS = Number(process.env.OPENAI_MAX_TOKENS || 500);

// 두 위경도 좌표 사이의 거리를 km 단위로 계산해 주는 수학(Haversine) 함수를 정의합니다.
function getDistanceInKm(lat1, lon1, lat2, lon2) {
    // 지구의 대략적인 반지름(km)입니다.
    const R = 6371; 
    // 위도 차이를 라디안 값으로 변환합니다.
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    // 경도 차이를 라디안 값으로 변환합니다.
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    // 구면 삼각법을 이용해 두 점 사이의 곡선 거리를 계산하기 위한 공식의 일부입니다.
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    // 계산된 a값을 바탕으로 실제 각도를 구합니다.
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    // 지구 반지름과 각도를 곱해서 최종 거리(km)를 반환합니다.
    return R * c;
}

// 프론트엔드에서 '/api/chat/' 주소로 POST 요청을 보내면 실행되는 라우터입니다.
router.post('/', async (req, res) => {
    try {
        // 프론트엔드가 보낸 JSON 바디에서 출발지 마리나 ID와 사용자의 질문(message)을 꺼냅니다.
        const { marinaId, message } = req.body;

        // 마리나 ID가 없거나 문자열이 아니면 에러로 처리합니다.
        if (!marinaId || typeof marinaId !== 'string') {
            // 400(Bad Request) 상태 코드와 함께 에러 메시지를 보냅니다.
            return res.status(400).json({ message: '마리나 ID가 올바르지 않습니다.' });
        }

        // 사용자의 질문이 비어있거나 올바른 문자가 아니면 입구컷 처리합니다.
        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            // 질문이 없다는 안내 메시지와 함께 400 에러를 반환합니다.
            return res.status(400).json({ message: '질문 내용이 비어 있습니다.' });
        }

        // 1. Supabase 데이터베이스에서 사용자가 클릭한 '출발지 마리나' 정보를 싹 가져옵니다.
        const { data: marina, error: marinaError } = await supabase
            // marina_list 테이블을 지정합니다.
            .from('marina_list')
            // 모든 컬럼을 다 가져오라고 명령합니다.
            .select('*')
            // id가 프론트에서 보낸 marinaId와 똑같은 것만 찾습니다.
            .eq('id', marinaId)
            // 딱 1줄의 데이터만 가져오게 설정합니다.
            .single();

        // 출발지 마리나 정보를 조회하다가 에러가 났다면 실행을 멈춥니다.
        if (marinaError) {
            // 404(Not Found) 에러와 함께 못 찾았다고 알려줍니다.
            return res.status(404).json({ message: '해당 마리나 정보를 찾을 수 없습니다.' });
        }

        // 출발지 마리나의 실시간 기상청 날씨 데이터를 가져옵니다.
        const { data: weather, error: weatherError } = await supabase
            // weather_observations 테이블을 바라봅니다.
            .from('weather_observations')
            // 모든 컬럼 선택
            .select('*')
            // 관측소 ID가 마리나 ID와 동일한 것을 찾습니다.
            .eq('station_id', marinaId)
            // 한 줄만 가져옵니다.
            .single();

        // 데이터가 아직 안 쌓인 에러(PGRST116)가 아닌, 진짜 통신 에러면 에러를 던져버립니다.
        if (weatherError && weatherError.code !== 'PGRST116') {
            // try-catch의 catch 블록으로 에러를 넘깁니다.
            throw weatherError;
        }

        // 해양(수심, 조위 등) 데이터를 담을 빈 변수를 하나 만들어 둡니다.
        let ocean = null;

        // 마리나에 매핑된 해양조사원 관측소 ID가 존재한다면 조회를 시작합니다.
        if (marina.nearest_station_id) {
            // Supabase에서 실시간 해양 관측 데이터를 가져옵니다.
            const { data: oceanData, error: oceanError } = await supabase
                // ocean_observations 테이블을 바라봅니다.
                .from('ocean_observations')
                // 모든 컬럼 선택
                .select('*')
                // 매핑된 관측소 ID로 조회합니다.
                .eq('station_id', marina.nearest_station_id)
                // 한 줄만 가져옵니다.
                .single();

            // 진짜 DB 에러가 났다면 마찬가지로 에러를 던집니다.
            if (oceanError && oceanError.code !== 'PGRST116') {
                // catch 블록으로 던집니다.
                throw oceanError;
            }
            // 에러 없이 잘 가져왔다면 아까 만든 빈 변수에 데이터를 채워 넣습니다.
            ocean = oceanData;
        }

        // 조위 데이터를 cm에서 m로 변환합니다 (데이터가 없으면 null 유지).
        const tideMeter = ocean?.tide_level != null ? ocean.tide_level / 100 : null;

        // 기본 수심에 현재 조위를 더해서 '실시간 예상 수심'을 계산합니다.
        const realtimeDepth =
            // 기본 수심과 조위 데이터가 둘 다 존재할 때만 계산을 수행합니다.
            marina?.base_depth != null && tideMeter != null
                // 두 값을 더해서 실제 얕아지고 깊어진 수심을 구합니다.
                ? marina.base_depth + tideMeter
                // 데이터가 하나라도 없으면 null 처리합니다.
                : null;
        
        // 기상청 풍속을 우선으로 쓰되, 없으면 해양조사원 풍속을 가져다 씁니다.
        const windSpeed =
            // 기상청 풍속 데이터가 존재하는지 확인합니다.
            weather?.wind_speed != null
                // 존재하면 기상청 데이터를 씁니다.
                ? weather.wind_speed
                // 기상청 데이터가 없으면 해양조사원 풍속 데이터가 있는지 확인합니다.
                : ocean?.wind_speed != null
                    // 존재하면 해양조사원 데이터를 씁니다.
                    ? ocean.wind_speed
                    // 둘 다 없으면 null 처리합니다.
                    : null;

        // 기온 역시 기상청 데이터를 우선하고 없으면 해양조사원 데이터를 씁니다.
        const temperature =
            // 기상청 기온 데이터 확인
            weather?.temperature != null
                // 기상청 데이터 사용
                ? weather.temperature
                // 해양조사원 기온 데이터 확인
                : ocean?.air_temp != null
                    // 해양조사원 데이터 사용
                    ? ocean.air_temp
                    // 없으면 null
                    : null;        

        // 💡 2. 사용자의 질문 속에서 다른 '목적지 마리나'를 언급했는지 DB 전체를 뒤져서 찾습니다.
        // 먼저 전국의 모든 마리나 목록(이름, 위경도 등)을 가져옵니다.
        const { data: allMarinas } = await supabase.from('marina_list').select('*');
        
        // 가져온 목록 중 출발지가 아니면서, 이름이 사용자의 질문(message)에 포함된 마리나들만 걸러냅니다.
        // 예: 사용자가 "수영만 마리나로 가고 싶어"라고 치면 수영만 마리나 객체가 배열에 담깁니다.
        const mentionedMarinas = allMarinas.filter(m => m.id !== marinaId && message.includes(m.name));

        // 목적지 마리나들의 날씨와 해양 상태를 담아서 AI에게 줄 텍스트 창고(문자열)를 만듭니다.
        let destinationInfoStr = '';
        
        // 만약 사용자가 목적지 마리나를 하나라도 언급했다면 정보를 수집합니다.
        if (mentionedMarinas.length > 0) {
            // 언급된 마리나 배열을 하나씩 빙글빙글 돌면서(loop) 처리합니다.
            for (const targetMarina of mentionedMarinas) {
                // 해당 목적지 마리나의 날씨 데이터를 DB에서 가져옵니다.
                const { data: tWeather } = await supabase.from('weather_observations').select('wind_speed').eq('station_id', targetMarina.id).single();
                // 해당 목적지 마리나 주변의 해양 데이터를 DB에서 가져옵니다.
                const { data: tOcean } = await supabase.from('ocean_observations').select('tide_level').eq('station_id', targetMarina.nearest_station_id).single();
                
                // 목적지의 조위를 m 단위로 계산합니다.
                const tTideMeter = tOcean?.tide_level != null ? tOcean.tide_level / 100 : 0;
                // 목적지의 실시간 수심을 계산합니다.
                const tRealtimeDepth = targetMarina.base_depth != null ? targetMarina.base_depth + tTideMeter : null;
                // 목적지의 풍속을 가져옵니다.
                const tWindSpeed = tWeather?.wind_speed != null ? tWeather.wind_speed : '정보 없음';

                // AI가 읽을 수 있도록 목적지에 대한 안내 문장을 창고(문자열)에 추가합니다.
                destinationInfoStr += `\n- 목적지 [${targetMarina.name}] 실시간 수심: ${tRealtimeDepth ? tRealtimeDepth.toFixed(2) + 'm' : '정보 없음'}, 풍속: ${tWindSpeed}m/s`;
            }
        }

        // 💡 3. server.js에서 저장해 둔 실시간 선박(AIS) 데이터를 꺼내옵니다.
        const shipCache = req.app.locals.shipCache;
        // 출발지 반경 5km 이내에 있는 배의 숫자를 세기 위한 변수입니다.
        let nearbyShipsCount = 0;

        // 캐시 데이터가 존재한다면 배들의 위치를 하나씩 검사합니다.
        if (shipCache && shipCache.size > 0) {
            // 캐시에 있는 모든 배 데이터를 반복문으로 돕니다.
            for (const [mmsi, shipData] of shipCache.entries()) {
                // 배와 출발지 마리나 사이의 직선거리를 km 단위로 계산합니다.
                const distance = getDistanceInKm(marina.latitude, marina.longitude, shipData.latitude, shipData.longitude);
                // 만약 그 배가 반경 5km 이내에 있다면?
                if (distance <= 5.0) {
                    // 근처 배 숫자를 1 증가시킵니다.
                    nearbyShipsCount++;
                }
            }
        }

        // AI에게 지시할 꼼꼼한 성격의 시스템 프롬프트를 작성합니다.
        const systemPrompt = `
너는 대한민국 요트 항해사를 돕는 10년 차 전문 해양 네비게이터 AI야.
사용자가 질문하면 아래 제공된 [실시간 해양 데이터]를 분석해서 친절하고 전문적으로 대답해줘.

[출발지: ${marina.name} 현황]
- 기온: ${temperature != null ? `${temperature}℃` : '정보 없음'}
- 풍속: ${windSpeed != null ? `${windSpeed}m/s` : '정보 없음'}
- 조위: ${ocean?.tide_level != null ? `${ocean.tide_level}cm` : '정보 없음'}
- 수온: ${ocean?.water_temp != null ? `${ocean.water_temp}℃` : '정보 없음'}
- 염분: ${ocean?.salinity != null ? ocean.salinity : '정보 없음'}
- 실시간 예상 수심: ${realtimeDepth != null ? `${realtimeDepth.toFixed(2)}m` : '정보 없음'}
- 주변 통항 선박 수: 반경 5km 이내에 약 ${nearbyShipsCount}척의 선박이 활동 중 (주의 요망)
${destinationInfoStr}

[분석 가이드라인]
1. 풍속이 10m/s 이상이면 출항 자제 및 위험 경고 메시지를 강하게 줄 것.
2. 실시간 예상 수심이 2m 이하면 얕은 수심을 경고할 것.
3. 데이터가 있는 항목만 근거로 사용하고, 없는 데이터는 모른다고 지어내지 말 것.
4. 주변에 선박이 많을 경우 충돌 주의 메시지를 남길 것.
5. 사용자가 목적지를 언급했다면, 출발지와 목적지의 상황을 종합해서 항해 가능 여부를 판단해 줄 것.
6. 사용자가 질문에 사용한 언어(한국어, 영어 등)를 파악하여 반드시 동일한 언어로 답변할 것. (예: 영어로 질문하면 영어로 답변)
7. 사용자가 모바일로 보기 편하게 핵심만 3~6문장 안에서 설명할 것.
        `.trim();

        // 설정된 프롬프트와 사용자의 질문을 OpenAI API로 전송하여 답변 생성을 요청합니다.
        const response = await openai.chat.completions.create({
            // 사용할 모델을 지정합니다 (gpt-4o-mini).
            model: OPENAI_MODEL,
            // 역할극을 위한 프롬프트 배열을 구성합니다.
            messages: [
                // AI에게 기본 역할과 데이터를 부여하는 시스템 메시지입니다.
                { role: 'system', content: systemPrompt },
                // 사용자가 화면에서 친 진짜 질문 내용입니다.
                { role: 'user', content: message.trim() },
            ],
            // 답변의 창의성(랜덤성)을 0.7 정도로 조절합니다.
            temperature: 0.7,
            // 최대 글자 수를 제한합니다.
            max_tokens: OPENAI_MAX_TOKENS,
        });

        // OpenAI가 응답한 결과물 중에서 텍스트 알맹이만 변수에 빼냅니다.
        const reply = response.choices?.[0]?.message?.content;

        // 만약 AI가 알맹이(답변)를 제대로 못 만들었다면 에러 처리를 합니다.
        if (!reply) {
            // 502 상태 코드와 함께 생성 실패를 알립니다.
            return res.status(502).json({ message: 'AI 답변을 생성하지 못했습니다.' });
        }

        // 성공적으로 답변이 만들어졌다면 프론트엔드로 200(성공) 코드와 함께 결과를 날려줍니다.
        res.status(200).json({ reply });

    // try 블록 안에서 어떤 이유로든 에러가 터졌다면 여기서 안전하게 잡아냅니다.
    } catch (err) {
        // 서버 터미널(로그)에 빨간불로 어떤 에러인지 상세히 기록합니다.
        console.error('AI 챗봇 통신 에러:', err.message);
        // 프론트엔드가 뻗지 않도록 500 에러 메시지를 얌전하게 보내줍니다.
        res.status(500).json({ message: 'AI 서버와 통신하는 중 문제가 발생했습니다.' });
    }
// 챗봇 POST 라우터의 괄호를 닫습니다.
});

// 외부(server.js)에서 이 라우터를 가져다 쓸 수 있도록 모듈로 내보냅니다.
module.exports = router;