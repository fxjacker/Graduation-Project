// express 프레임워크 모듈을 가져옵니다.
const express = require('express');
// 라우터(경로 지정) 객체를 독립적으로 생성합니다.
const router = express.Router();
// 환경변수(.env)를 읽어오기 위해 dotenv 모듈을 설정합니다.
require('dotenv').config();
// 데이터베이스 통신을 위해 Supabase 클라이언트 생성 함수를 가져옵니다.
const { createClient } = require('@supabase/supabase-js');
// AI 통신을 위해 OpenAI 공식 모듈을 가져옵니다.
const { OpenAI } = require('openai');

// 환경변수에서 Supabase 접속 주소를 가져옵니다.
const supabaseUrl = process.env.SUPABASE_URL;
// 환경변수에서 Supabase API 키를 가져옵니다.
const supabaseKey = process.env.SUPABASE_KEY;
// 주소와 키를 이용해 이 파일 전용 Supabase 클라이언트 객체를 완성합니다.
const supabase = createClient(supabaseUrl, supabaseKey);

// 환경변수에서 OpenAI API 키를 넣어 OpenAI 통신 객체를 완성합니다.
const openai = new OpenAI({
// apiKey 속성에 환경변수 값을 매핑합니다.
    apiKey: process.env.OPENAI_API_KEY,
// OpenAI 객체 설정 닫기
});

// POST 방식의 HTTP 요청을 처리하는 라우터를 정의합니다. 기본 경로는 '/' 입니다.
router.post('/', async (req, res) => {
// 서버가 죽지 않도록 에러를 잡아내는 try문을 시작합니다.
    try {
// 프론트엔드가 보낸 데이터(body)에서 마리나 아이디와 메시지를 추출합니다.
        const { marinaId, message } = req.body;

// Supabase의 마리나 목록 테이블에서 데이터를 조회합니다.
        const { data: marina } = await supabase
// 'marina_list' 테이블을 선택합니다.
            .from('marina_list')
// 모든 컬럼을 가져오도록 설정합니다.
            .select('*')
// 테이블의 id와 클라이언트가 보낸 marinaId가 일치하는 것을 찾습니다.
            .eq('id', marinaId)
// 조건에 맞는 데이터 딱 한 줄만 반환받습니다.
            .single();

// Supabase의 기상 관측 테이블에서 날씨 데이터를 조회합니다.
        const { data: weather } = await supabase
// 'weather_observations' 테이블을 선택합니다.
            .from('weather_observations')
// 모든 컬럼을 가져오도록 설정합니다.
            .select('*')
// 관측소 id가 방금 찾은 마리나 id와 일치하는 것을 찾습니다.
            .eq('station_id', marinaId)
// 조건에 맞는 최신 데이터 한 줄만 반환받습니다.
            .single();

// Supabase의 해양 관측 테이블에서 수위와 수온 데이터를 조회합니다.
        const { data: ocean } = await supabase
// 'ocean_observations' 테이블을 선택합니다.
            .from('ocean_observations')
// 모든 컬럼을 가져오도록 설정합니다.
            .select('*')
// 마리나에 매핑되어 있는 가장 가까운 해양 관측소 id를 기준으로 찾습니다.
            .eq('station_id', marina?.nearest_station_id)
// 조건에 맞는 데이터 한 줄만 반환받습니다.
            .single();

// AI에게 부여할 역할과 실시간 DB 데이터를 텍스트로 묶어 프롬프트를 만듭니다.
        const systemPrompt = `
            너는 대한민국 요트 항해사를 돕는 10년 차 전문 해양 네비게이터 AI야.
            사용자가 질문하면 아래 제공된 [실시간 해양 데이터]를 분석해서 친절하고 전문적으로 대답해줘.

            [실시간 해양 데이터]
            - 기준 마리나: ${marina?.name || '알 수 없음'}
            - 기상 상태: 기온 ${weather?.temperature || '정보 없음'}℃, 풍속 ${weather?.wind_speed || '정보 없음'}m/s
            - 해양 상태: 조위(수위 변동) ${ocean?.tide_level || '정보 없음'}cm, 수온 ${ocean?.water_temp || '정보 없음'}℃
            - 기본 수심: ${marina?.base_depth || '정보 없음'}m

            [분석 가이드라인]
            1. 풍속이 10m/s 이상이면 출항 자제 및 위험 경고 메시지를 강하게 줄 것.
            2. 기본 수심과 조위를 더한 실제 수심이 2m 이하면 얕은 수심을 경고할 것.
            3. 데이터가 없는 항목은 언급하지 말 것.
// 템플릿 리터럴 백틱을 닫아 프롬프트 문자열 생성을 마칩니다.
        `;

// OpenAI API를 호출하여 AI의 답변을 생성합니다.
        const response = await openai.chat.completions.create({
// 가성비가 가장 좋고 빠른 최신 모델인 gpt-4o-mini를 지정합니다.
            model: "gpt-4o-mini",
// AI에게 전달할 메시지 배열을 구성합니다.
            messages: [
// 첫 번째로 시스템 프롬프트를 넣어 AI의 역할과 데이터를 주입합니다.
                { role: "system", content: systemPrompt },
// 두 번째로 사용자가 채팅창에 실제로 입력한 질문을 넣습니다.
                { role: "user", content: message }
// 메시지 배열을 닫습니다.
            ],
// AI 답변의 창의성 정도를 0.7로 설정하여 적당히 자연스럽게 만듭니다.
            temperature: 0.7,
// 요금 폭탄 방지를 위해 답변의 최대 길이를 500 토큰으로 제한합니다.
            max_tokens: 500,
// OpenAI 호출 설정 객체를 닫습니다.
        });

// 성공적으로 답변을 받으면 프론트엔드에 200 상태 코드와 함께 JSON 형태로 보냅니다.
        res.status(200).json({ reply: response.choices[0].message.content });

// try 블록에서 에러가 났을 때 실행될 catch 블록입니다.
    } catch (err) {
// 백엔드 터미널 콘솔창에 어떤 에러인지 텍스트로 출력합니다.
        console.error('AI 챗봇 통신 에러:', err.message);
// 프론트엔드에게는 500 에러 코드와 안내 메시지를 전달합니다.
        res.status(500).json({ message: 'AI 서버와 통신하는 중 문제가 발생했습니다.' });
// catch 블록을 닫습니다.
    }
// 라우터 설정 함수를 닫습니다.
});

// 이 파일에서 만든 router 객체를 외부(server.js)에서 쓸 수 있도록 내보냅니다.
module.exports = router;