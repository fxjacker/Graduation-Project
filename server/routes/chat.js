const express = require('express');
const router = express.Router();
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');
const { OpenAI } = require('openai');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const OPENAI_MAX_TOKENS = Number(process.env.OPENAI_MAX_TOKENS || 500);

// 두 위경도 사이의 거리를 계산하는 수학 함수 (그대로 유지)
function getDistanceInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// 💡 챗봇 API 요청을 처리하는 메인 라우터입니다.
router.post('/', async (req, res) => {
    try {
        // 프론트엔드에서 보낸 건 오직 'message(사용자 질문)' 하나뿐입니다! marinaId는 이제 안 받습니다.
        const { message } = req.body;

        // 질문이 비어있으면 에러 처리
        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return res.status(400).json({ message: '질문 내용이 비어 있습니다.' });
        }

        // 1. Supabase에서 '전국 마리나 리스트'를 싹 다 가져옵니다.
        const { data: allMarinas, error: marinaError } = await supabase.from('marina_list').select('*');
        if (marinaError) throw marinaError;

        // 2. 💡 [핵심 로직] 사용자의 질문 속에 마리나 이름이 숨어있는지 검사합니다.
        // "구산 마리나"를 "구산"으로 줄여 부를 수도 있으니, ' 마리나' 글자를 뗀 짧은 이름도 같이 검사합니다.
        const mentionedMarinas = allMarinas.filter(m => {
            const shortName = m.name.replace(' 마리나', '').trim(); // 예: '구산'
            return message.includes(m.name) || message.includes(shortName);
        });

        let marinaInfoStr = ''; // AI에게 던져줄 정보 창고

        // 3. 만약 사용자가 마리나를 하나라도 언급했다면? 데이터를 수집하기 시작합니다.
        if (mentionedMarinas.length > 0) {
            const shipCache = req.app.locals.shipCache; // server.js에서 관리하는 실시간 선박 캐시

            for (const marina of mentionedMarinas) {
                // 해당 마리나의 기상청 날씨 가져오기
                const { data: weather } = await supabase.from('weather_observations').select('*').eq('station_id', marina.id).single();
                
                // 해당 마리나의 해양조사원 데이터 가져오기
                let ocean = null;
                if (marina.nearest_station_id) {
                    const { data: oceanData } = await supabase.from('ocean_observations').select('*').eq('station_id', marina.nearest_station_id).single();
                    ocean = oceanData;
                }

                // 수심 및 날씨 계산 (기존과 동일한 로직)
                const tideMeter = ocean?.tide_level != null ? ocean.tide_level / 100 : null;
                const realtimeDepth = marina.base_depth != null && tideMeter != null ? marina.base_depth + tideMeter : null;
                const windSpeed = weather?.wind_speed != null ? weather.wind_speed : (ocean?.wind_speed != null ? ocean.wind_speed : '정보 없음');
                const temperature = weather?.temperature != null ? weather.temperature : (ocean?.air_temp != null ? ocean.air_temp : '정보 없음');

                // 반경 5km 이내 선박 수 계산
                let nearbyShipsCount = 0;
                if (shipCache && shipCache.size > 0) {
                    for (const [mmsi, shipData] of shipCache.entries()) {
                        const distance = getDistanceInKm(marina.latitude, marina.longitude, shipData.latitude, shipData.longitude);
                        if (distance <= 5.0) nearbyShipsCount++;
                    }
                }

                // AI가 볼 수 있도록 마리나별로 현황판을 텍스트로 찍어냅니다.
                marinaInfoStr += `\n[해역: ${marina.name} 현황]
- 기온: ${temperature !== '정보 없음' ? temperature + '℃' : '정보 없음'}
- 풍속: ${windSpeed !== '정보 없음' ? windSpeed + 'm/s' : '정보 없음'}
- 실시간 예상 수심: ${realtimeDepth != null ? realtimeDepth.toFixed(2) + 'm' : '정보 없음'}
- 주변 선박 경계: 반경 5km 이내 약 ${nearbyShipsCount}척 활동 중
`;
            }
        } else {
            // 만약 질문에 마리나 이름이 하나도 없다면 안내 멘트를 남깁니다.
            marinaInfoStr = "\n[안내] 사용자가 특정 마리나를 지목하지 않았습니다. 해양 지식에 대해 일반적인 조언을 해주거나, 특정 마리나 이름을 알려달라고 유도하세요.";
        }

        // 4. AI에게 지시할 시스템 프롬프트 작성
        const systemPrompt = `
너는 대한민국 요트 항해사를 돕는 10년 차 전문 해양 네비게이터 AI야.
사용자의 질문을 분석하고, 아래 제공된 [실시간 해양 데이터]를 참고하여 친절하고 전문적으로 대답해줘.

${marinaInfoStr}

[분석 가이드라인]
1. 데이터가 있으면 해당 데이터를 근거로 설명하고, 모르는 수치는 절대 지어내지 말 것.
2. 풍속 10m/s 이상이거나 수심 2m 이하일 경우 주의 경고를 강하게 할 것.
3. 주변 통항 선박이 있다면 충돌 주의 메시지를 남길 것.
4. 마리나가 2개 이상 언급되었다면, 두 곳의 상황을 비교해주거나 출발/도착지로 간주하여 항해 조언을 해줄 것.
5. 모바일 화면에서 읽기 편하게 핵심만 3~5문장 내외로 간결하게 답변할 것.
6. 사용자가 질문에 사용한 언어(한국어, 영어 등)를 파악하여 반드시 동일한 언어로 답변할 것. (예: 영어로 질문하면 영어로 답변)
        `.trim();

        // 5. OpenAI에 요청 보내기
        const response = await openai.chat.completions.create({
            model: OPENAI_MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: message.trim() },
            ],
            temperature: 0.7,
            max_tokens: OPENAI_MAX_TOKENS,
        });

        const reply = response.choices?.[0]?.message?.content;
        if (!reply) return res.status(502).json({ message: 'AI 답변을 생성하지 못했습니다.' });

        // 성공 응답 전송!
        res.status(200).json({ reply });

    } catch (err) {
        console.error('AI 챗봇 통신 에러:', err.message);
        res.status(500).json({ message: 'AI 서버와 통신하는 중 문제가 발생했습니다.' });
    }
});

module.exports = router;