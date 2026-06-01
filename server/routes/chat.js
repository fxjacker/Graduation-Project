const express = require('express');
const router = express.Router();
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');
const { OpenAI } = require('openai');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const OPENAI_MAX_TOKENS = Number(process.env.OPENAI_MAX_TOKENS || 500);

router.post('/', async (req, res) => {
    try {
        const { marinaId, message } = req.body;

        if (!marinaId || typeof marinaId !== 'string') {
            return res.status(400).json({ message: '마리나 ID가 올바르지 않습니다.' });
        }

        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return res.status(400).json({ message: '질문 내용이 비어 있습니다.' });
        }

        const { data: marina, error: marinaError } = await supabase
            .from('marina_list')
            .select('*')
            .eq('id', marinaId)
            .single();

        if (marinaError) {
            return res.status(404).json({ message: '해당 마리나 정보를 찾을 수 없습니다.' });
        }

        const { data: weather, error: weatherError } = await supabase
            .from('weather_observations')
            .select('*')
            .eq('station_id', marinaId)
            .single();

        if (weatherError && weatherError.code !== 'PGRST116') {
            throw weatherError;
        }

        let ocean = null;

        if (marina.nearest_station_id) {
            const { data: oceanData, error: oceanError } = await supabase
                .from('ocean_observations')
                .select('*')
                .eq('station_id', marina.nearest_station_id)
                .single();

            if (oceanError && oceanError.code !== 'PGRST116') {
                throw oceanError;
            }

            ocean = oceanData;
        }

        const tideMeter = ocean?.tide_level != null ? ocean.tide_level / 100 : null;

        const realtimeDepth =
            marina?.base_depth != null && tideMeter != null
                ? marina.base_depth + tideMeter
                : null;

        const systemPrompt = `
너는 대한민국 요트 항해사를 돕는 10년 차 전문 해양 네비게이터 AI야.
사용자가 질문하면 아래 제공된 [실시간 해양 데이터]를 분석해서 친절하고 전문적으로 대답해줘.

[실시간 해양 데이터]
- 기준 마리나: ${marina.name}
- 기상 상태: ${weather ? `기온 ${weather.temperature ?? '정보 없음'}℃, 풍속 ${weather.wind_speed ?? '정보 없음'}m/s` : '정보 없음'}
- 해양 상태: ${ocean ? `조위 ${ocean.tide_level ?? '정보 없음'}cm, 수온 ${ocean.water_temp ?? '정보 없음'}℃` : '정보 없음'}
- 기본 수심: ${marina.base_depth ?? '정보 없음'}m
- 실시간 예상 수심: ${realtimeDepth != null ? `${realtimeDepth.toFixed(2)}m` : '정보 없음'}

[분석 가이드라인]
1. 풍속이 10m/s 이상이면 출항 자제 및 위험 경고 메시지를 강하게 줄 것.
2. 실시간 예상 수심이 2m 이하면 얕은 수심을 경고할 것.
3. 데이터가 없는 항목은 언급하지 말 것.
4. 답변은 한국어로 작성하고, 사용자가 이해하기 쉽게 3~6문장 안에서 설명할 것.
        `.trim();

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

        if (!reply) {
            return res.status(502).json({ message: 'AI 답변을 생성하지 못했습니다.' });
        }

        res.status(200).json({ reply });

    } catch (err) {
        console.error('AI 챗봇 통신 에러:', err.message);
        res.status(500).json({ message: 'AI 서버와 통신하는 중 문제가 발생했습니다.' });
    }
});

module.exports = router;