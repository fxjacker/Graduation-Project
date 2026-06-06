const express = require('express');
// 라우팅 처리를 위한 Express 라우터 객체를 생성합니다.
const router = express.Router();
// .env 파일에 정의된 환경변수들을 로드합니다.
require('dotenv').config();

// Supabase DB와 통신하기 위한 클라이언트 생성 함수를 가져옵니다.
const { createClient } = require('@supabase/supabase-js');
// OpenAI API와 통신하기 위한 모듈을 가져옵니다.
const { OpenAI } = require('openai');

// 환경변수에서 Supabase 접속 URL을 읽어옵니다.
const supabaseUrl = process.env.SUPABASE_URL;
// 환경변수에서 Supabase 접속 키를 읽어옵니다.
const supabaseKey = process.env.SUPABASE_KEY;
// URL과 키를 조합하여 Supabase 클라이언트 인스턴스를 만듭니다.
const supabase = createClient(supabaseUrl, supabaseKey);

// 환경변수에 저장된 API 키를 사용하여 OpenAI 인스턴스를 생성합니다.
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// 사용할 AI 모델을 환경변수에서 읽어오고 없으면 gpt-4o-mini를 기본으로 사용합니다.
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
// AI가 생성할 답변의 최대 토큰(글자) 수를 500으로 제한합니다.
const OPENAI_MAX_TOKENS = Number(process.env.OPENAI_MAX_TOKENS || 500);

// 두 위경도 좌표(출발지, 도착지) 사이의 직선거리를 계산해 주는 수학 함수입니다.
function getDistanceInKm(lat1, lon1, lat2, lon2) {
    // 지구의 평균 반지름(km)을 상수로 선언합니다.
    const R = 6371; 
    // 위도 차이를 계산하고 라디안 단위로 변환합니다.
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    // 경도 차이를 계산하고 라디안 단위로 변환합니다.
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    // 구면 삼각법(Haversine 공식)을 활용하여 a 값을 도출합니다.
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    // a 값을 아크탄젠트 함수에 넣어 각도(c)를 구합니다.
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    // 지구 반지름과 각도를 곱해 최종 거리(km)를 반환합니다.
    return R * c;
}

// 프론트엔드에서 챗봇 메시지를 POST 방식으로 보낼 때 처리하는 메인 라우터입니다.
router.post('/', async (req, res) => {
    // 예상치 못한 서버 에러를 방지하기 위해 try-catch 블록으로 감쌉니다.
    try {
        // 프론트엔드가 보낸 JSON 데이터 중 'message(사용자 질문)'를 꺼내옵니다.
        const { message } = req.body;

        // 질문이 비어있거나 정상적인 문자열이 아니면 처리를 중단합니다.
        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            // 400 상태 코드와 함께 질문이 비어있다는 에러를 프론트로 돌려보냅니다.
            return res.status(400).json({ message: '질문 내용이 비어 있습니다.' });
        }

        // Supabase DB의 'marina_list' 테이블에서 전국의 모든 마리나 정보를 조회합니다.
        const { data: allMarinas, error: marinaError } = await supabase.from('marina_list').select('*');
        // 마리나 목록 조회 중 DB 에러가 발생했다면 catch 문으로 에러를 던집니다.
        if (marinaError) throw marinaError;

        // 사용자의 질문 텍스트 속에 마리나 이름이 포함되어 있는지 검사하여 일치하는 마리나만 필터링합니다.
        const mentionedMarinas = allMarinas.filter(m => {
            // 1. [한국어 검사] 공백과 '마리나' 글자를 제거해 둡니다. (예: "구산")
            const shortNameKo = m.name.replace(' 마리나', '').trim();
            // 질문에 한국어 원래 이름이나 줄임말이 포함되어 있는지 확인합니다.
            const isMatchKo = message.includes(m.name) || message.includes(shortNameKo);

            // 2. [영어 검사] 대소문자 구분을 없애기 위해 사용자의 질문을 전부 소문자로 바꿉니다.
            const lowerMessage = message.toLowerCase();
            let isMatchEn = false;
            
            // 만약 DB에 영어 이름(english_name)이 입력되어 있다면?
            if (m.english_name) {
                // DB의 영어 이름도 전부 소문자로 바꿉니다. (예: "dodu port marina")
                const nameEn = m.english_name.toLowerCase();
                // 영어 이름에서 ' marina'를 떼어내고 줄임말을 만듭니다. (예: "dodu port")
                const shortNameEn = nameEn.replace(' marina', '').trim();
                // 사용자의 영어 질문 속에 전체 이름이나 줄임말이 포함되어 있는지 확인합니다.
                isMatchEn = lowerMessage.includes(nameEn) || lowerMessage.includes(shortNameEn);
            }

            // 한국어로 부르든 영어로 부르든, 둘 중 하나라도 걸리면(true) 통과시킵니다!
            return isMatchKo || isMatchEn;
        });

        // 💡 [핵심 추가] 사용자가 말한 순서대로 마리나 배열을 정렬합니다. (먼저 말한 게 출발지, 뒤에 말한 게 도착지)
        mentionedMarinas.sort((a, b) => {
            // a 마리나의 이름이 사용자 질문에서 몇 번째 글자(인덱스)에 등장했는지 찾습니다.
            const indexA = message.indexOf(a.name.replace(' 마리나', '').trim());
            // b 마리나의 이름이 사용자 질문에서 몇 번째 글자(인덱스)에 등장했는지 찾습니다.
            const indexB = message.indexOf(b.name.replace(' 마리나', '').trim());
            // 등장 위치 값을 빼서 더 앞쪽에 있는 단어가 배열의 첫 번째로 오게 만듭니다.
            return indexA - indexB;
        });

        // AI에게 지시할 마리나 환경 정보 텍스트를 담을 빈 문자열 변수를 만듭니다.
        let marinaInfoStr = '';
        // 프론트엔드로 몰래 넘겨줄 '네비게이션 제안용 데이터' 변수를 초기화합니다.
        let proposedNav = null;

        // 질문 속에서 하나 이상의 마리나 이름이 발견되었다면 날씨/수심 정보를 수집합니다.
        if (mentionedMarinas.length > 0) {
            // 실시간 선박 데이터를 보관하고 있는 서버의 캐시 메모리에 접근합니다.
            const shipCache = req.app.locals.shipCache;

            // 언급된 마리나 배열을 빙글빙글 돌면서(Loop) 각각의 데이터를 DB에서 긁어옵니다.
            for (const marina of mentionedMarinas) {
                // 해당 마리나의 기상청 날씨 데이터를 단일 행(single)으로 가져옵니다.
                const { data: weather } = await supabase.from('weather_observations').select('*').eq('station_id', marina.id).single();
                
                // 해양조사원 관측소 데이터를 담을 변수를 비워둡니다.
                let ocean = null;
                // 해당 마리나에 매핑된 관측소 ID가 존재한다면 조회를 시작합니다.
                if (marina.nearest_station_id) {
                    // 해양조사원 관측소 데이터를 단일 행으로 가져옵니다.
                    const { data: oceanData } = await supabase.from('ocean_observations').select('*').eq('station_id', marina.nearest_station_id).single();
                    // 성공적으로 가져왔다면 변수에 채워 넣습니다.
                    ocean = oceanData;
                }

                // 조위 데이터를 cm에서 m 단위로 변환합니다. (데이터가 없으면 null)
                const tideMeter = ocean?.tide_level != null ? ocean.tide_level / 100 : null;
                // 마리나 기본 수심에 현재 조위(m)를 더해 실시간 수심을 계산합니다.
                const realtimeDepth = marina.base_depth != null && tideMeter != null ? marina.base_depth + tideMeter : null;
                // 풍속은 기상청 우선, 없으면 해양조사원 데이터를 가져다 씁니다.
                const windSpeed = weather?.wind_speed != null ? weather.wind_speed : (ocean?.wind_speed != null ? ocean.wind_speed : '정보 없음');
                // 기온도 기상청 우선, 없으면 해양조사원 데이터를 가져다 씁니다.
                const temperature = weather?.temperature != null ? weather.temperature : (ocean?.air_temp != null ? ocean.air_temp : '정보 없음');

                // 마리나 반경 5km 이내에 있는 배의 숫자를 세기 위한 카운터 변수입니다.
                let nearbyShipsCount = 0;
                // 선박 캐시가 존재하고 비어있지 않은지 확인합니다.
                if (shipCache && shipCache.size > 0) {
                    // 캐시 안의 모든 배 데이터를 하나씩 꺼내어 검사합니다.
                    for (const [mmsi, shipData] of shipCache.entries()) {
                        // 현재 마리나와 배 사이의 직선 거리를 계산합니다.
                        const distance = getDistanceInKm(marina.latitude, marina.longitude, shipData.latitude, shipData.longitude);
                        // 거리가 5km 이내라면 위험 선박 숫자를 1 증가시킵니다.
                        if (distance <= 5.0) nearbyShipsCount++;
                    }
                }

                // AI가 텍스트로 읽을 수 있도록 각 마리나의 종합 현황판을 문자열로 추가합니다.
                marinaInfoStr += `\n[해역: ${marina.name} 현황]
- 기온: ${temperature !== '정보 없음' ? temperature + '℃' : '정보 없음'}
- 풍속: ${windSpeed !== '정보 없음' ? windSpeed + 'm/s' : '정보 없음'}
- 실시간 예상 수심: ${realtimeDepth != null ? realtimeDepth.toFixed(2) + 'm' : '정보 없음'}
- 주변 선박 경계: 반경 5km 이내 약 ${nearbyShipsCount}척 활동 중\n`;
            }

            // 💡 [핵심 추가] 만약 사용자가 정확히 2개의 마리나를 언급했다면?
            if (mentionedMarinas.length === 2) {
                // 프론트엔드에게 "네비게이션 띄울 준비해라!" 하고 출발/도착지 데이터를 묶어줍니다.
                proposedNav = { start: mentionedMarinas[0], end: mentionedMarinas[1] };
                // AI가 출발지/도착지 문맥을 이해하고, 사용자의 언어로 직접 번역해서 제안하도록 지시합니다.
                marinaInfoStr += `\n[특별 시스템 지시사항] 브리핑 마지막에 반드시 네비게이션 실행 여부를 제안하세요. 단, 제안 문장은 무조건 '사용자가 질문에 사용한 언어'와 동일한 언어로 자연스럽게 번역해야 합니다. (출발지: ${proposedNav.start.name}, 도착지: ${proposedNav.end.name})`;
            }

        // 사용자가 마리나 이름을 단 하나도 말하지 않았을 경우의 예외 처리입니다.
        } else {
            // AI가 일반적인 대화를 이어갈 수 있도록 기본 가이드 문구를 제공합니다.
            marinaInfoStr = "\n[안내] 사용자가 특정 마리나를 지목하지 않았습니다. 해양 지식에 대해 조언을 해주거나 원하시는 마리나 이름을 알려달라고 유도하세요.";
        }

        // AI에게 역할과 성격을 부여하는 꼼꼼한 시스템 프롬프트(명령어)를 작성합니다.
        const systemPrompt = `
너는 대한민국 요트 항해사를 돕는 10년 차 전문 해양 네비게이터 AI야.
사용자의 질문을 분석하고, 아래 제공된 [실시간 해양 데이터]를 참고하여 친절하고 전문적으로 대답해줘.

${marinaInfoStr}

[분석 가이드라인]
1. 수치 데이터가 있으면 해당 데이터를 근거로 객관적으로 설명하고, 모르는 수치는 지어내지 말 것.
2. 풍속 10m/s 이상이거나 수심 2m 이하일 경우 강한 주의 및 경고 메시지를 남길 것.
3. 주변 통항 선박이 있다면 충돌 주의 및 견시를 철저히 하라는 메시지를 남길 것.
4. 모바일 화면에서 읽기 편하도록 핵심 내용만 3~5문장 내외로 간결하게 답변할 것.
5. 사용자가 질문에 사용한 언어(한국어, 영어 등)를 파악하여 반드시 동일한 언어로 답변할 것. (예: 영어로 질문하면 영어로 답변)
        `.trim(); // 텍스트 앞뒤의 불필요한 공백과 줄바꿈을 깔끔하게 잘라냅니다.

        // 세팅된 프롬프트와 사용자 질문을 묶어서 OpenAI API 서버로 답변 생성을 요청합니다.
        const response = await openai.chat.completions.create({
            // 환경변수에 설정된 AI 모델(gpt-4o-mini 등)을 선택합니다.
            model: OPENAI_MODEL,
            // AI에게 시스템 설정값과 사용자의 메시지를 순서대로 전달합니다.
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: message.trim() },
            ],
            // 답변의 창의성 정도를 0.7(약간 유연하게)로 설정합니다.
            temperature: 0.7,
            // 비용 방지를 위해 AI가 내뱉을 수 있는 최대 글자 수를 제한합니다.
            max_tokens: OPENAI_MAX_TOKENS,
        });

        // OpenAI가 응답한 커다란 데이터 덩어리 속에서 텍스트 답변(알맹이)만 쏙 빼냅니다.
        const reply = response.choices?.[0]?.message?.content;
        // 텍스트 답변이 정상적으로 만들어지지 않았다면 502 에러를 반환합니다.
        if (!reply) return res.status(502).json({ message: 'AI 답변을 생성하지 못했습니다.' });

        // 💡 [핵심 추가] 프론트엔드로 텍스트 답변(reply)과 함께, 감지된 네비게이션 제안(proposedNav)을 같이 전송합니다!
        res.status(200).json({ reply, proposedNav });

    // try 블록 내부 어디서든 에러가 터지면 catch 블록이 안전하게 잡아냅니다.
    } catch (err) {
        // 서버 콘솔(터미널) 창에 어떤 통신 에러가 났는지 빨간불로 기록합니다.
        console.error('AI 챗봇 통신 에러:', err.message);
        // 프론트엔드 화면이 하얗게 뻗지 않도록 500 상태 코드와 얌전한 안내 메시지를 보냅니다.
        res.status(500).json({ message: 'AI 서버와 통신하는 중 문제가 발생했습니다.' });
    }
// POST 라우터 블록을 닫아줍니다.
});

// 외부 파일(server.js)에서 이 라우터를 불러와서 사용할 수 있도록 모듈로 내보냅니다.
module.exports = router;