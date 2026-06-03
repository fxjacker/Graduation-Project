// 환경변수를 불러오기 위해 dotenv 모듈을 사용합니다.
require('dotenv').config();
// 파일 시스템을 제어하기 위한 모듈을 불러옵니다.
const fs = require('fs');
// CSV 파일을 자바스크립트가 읽기 편하게 쪼개주는 파서 모듈을 불러옵니다.
const csv = require('csv-parser');
// 공공데이터 특유의 한글 인코딩(EUC-KR) 깨짐 현상을 해결하기 위한 모듈입니다.
const iconv = require('iconv-lite');
// PostgreSQL 데이터베이스와 통신하기 위한 클라이언트 모듈을 불러옵니다.
const { Client } = require('pg');

// Supabase 데이터베이스 연결 정보를 셋팅합니다.
const client = new Client({
    // .env 파일에 작성해둔 Supabase 접속 주소를 그대로 가져옵니다.
    connectionString: process.env.SUPABASE_DB_URL
});

// 1만 개의 데이터를 순차적으로 밀어넣을 비동기 메인 함수를 선언합니다.
async function importTrajectoryData() {
    // CSV에서 읽어온 각 줄의 데이터를 차곡차곡 담아둘 빈 배열입니다.
    const results = [];

    try {
        // 설정해둔 정보로 Supabase 데이터베이스 연결을 시도합니다.
        await client.connect();
        // 무사히 연결되었다면 터미널에 성공 메시지를 띄웁니다.
        console.log('✅ Supabase DB 연결 성공!');

        // 1만 줄이 넘는 파일을 완전히 다 읽을 때까지 기다려주기 위해 Promise로 감쌉니다.
        await new Promise((resolve, reject) => {
            // 새로 다운받은 파일 이름을 정확히 입력하여 읽기 스트림을 엽니다. (파일명이 다르면 꼭 수정해주세요!)
            fs.createReadStream('해양수산부_(융합)어선_항적도_20240221.csv')
                // 파일에 들어있는 EUC-KR 한글 데이터를 UTF-8로 예쁘게 번역합니다.
                .pipe(iconv.decodeStream('euc-kr'))
                // 번역된 텍스트를 csv-parser로 넘겨서 헤더(기둥) 단위로 분리합니다.
                .pipe(csv())
                // 한 줄의 데이터를 읽어들일 때마다 발생하는 이벤트입니다.
                .on('data', (data) => {
                    // 읽어온 한 줄 데이터를 results 배열의 끝에 추가합니다.
                    results.push(data);
                })
                // 파일의 마지막 줄까지 모두 읽었을 때 발생하는 이벤트입니다.
                .on('end', () => {
                    // 대기 상태(Promise)를 성공으로 마무리하고 다음 코드로 넘어갑니다.
                    resolve();
                })
                // 파일을 읽다가 에러가 발생했을 때 처리하는 이벤트입니다.
                .on('error', (err) => {
                    // 대기 상태를 실패로 변경하고 에러 내용을 바깥으로 던집니다.
                    reject(err);
                });
        });

        // 1만 개의 데이터가 메모리에 무사히 올라왔음을 알리는 메시지입니다.
        console.log(`📄 CSV 파일 읽기 완료. 총 ${results.length}개의 어선 데이터를 DB에 삽입합니다...`);

        // 삽입 진행률을 계산하기 위한 카운터 변수를 0으로 셋팅합니다.
        let count = 0;

        // 배열에 담긴 1만 개의 데이터를 처음부터 끝까지 하나씩 반복하며 꺼냅니다.
        for (const row of results) {
            // DB 테이블에 데이터를 넣기 위한 INSERT SQL 쿼리문을 준비합니다.
            const insertQuery = `
                INSERT INTO ship_trajectory (ship_type_code, ship_type_name, length, width, draft, geom)
                -- 16진수 공간 정보를 PostGIS가 이해하는 도로망(Geometry)으로 변환해 넣습니다.
                VALUES ($1, $2, $3, $4, $5, ST_GeomFromWKB(decode($6, 'hex'), 4326))
            `;

            // 쿼리의 물음표($1 ~ $6) 자리에 들어갈 값들을 새 CSV 헤더 이름에 맞춰 배열로 조립합니다.
            const values = [
                // 낚시어선여부 코드를 정수형으로 바꿉니다 (데이터가 없으면 비워둡니다).
                row['낚시어선여부'] ? parseInt(row['낚시어선여부']) : null,
                // 낚시어선여부명(예: 낚시어선, 일반어선) 텍스트를 그대로 넣습니다.
                row['낚시어선여부명'],
                // 어선길이를 실수형(float)으로 변환하여 넣습니다.
                row['어선길이(KM)'] ? parseFloat(row['어선길이(KM)']) : null,
                // 어선너비를 실수형(float)으로 변환하여 넣습니다.
                row['어선너비(KM)'] ? parseFloat(row['어선너비(KM)']) : null,
                // 스키마를 유지하기 위해 어선톤수 데이터를 draft(흘수) 칸에 기록합니다.
                row['어선톤수(톤)'] ? parseFloat(row['어선톤수(톤)']) : null,
                // 지도에 선을 그릴 수 있게 해주는 16진수 공간정보 문자열입니다.
                row['공간정보']
            ];

            // 쿼리문과 조립된 값 배열을 Supabase로 전송하여 실제로 1줄을 저장합니다.
            await client.query(insertQuery, values);

            // 1줄을 무사히 넣었으므로 카운터를 1 증가시킵니다.
            count++;
            
            // 카운터가 1000의 배수가 될 때마다(1000개, 2000개...) 터미널에 진행률을 띄워줍니다.
            if (count % 1000 === 0) {
                // 답답하지 않게 현재 몇 개까지 들어갔는지 터미널에 로깅합니다.
                console.log(`⏳ 열심히 적재 중... ${count} / ${results.length} 개 완료`);
            }
        }

        // 1만 개의 데이터가 하나도 빠짐없이 들어갔을 때 띄우는 축하 메시지입니다.
        console.log('🎉 10,000개 융합 어선 항적 데이터베이스 적재 완벽하게 성공!');

    // try 블록 안에서 쿼리 오류나 통신 에러가 터지면 여기로 떨어집니다.
    } catch (err) {
        // 빨간색 경고 아이콘과 함께 어떤 에러인지 상세 메시지를 출력합니다.
        console.error('❌ 작업 중 에러 발생:', err.message);
    // 성공을 하든 실패를 하든 무조건 마지막에 실행되는 구역입니다.
    } finally {
        // 데이터베이스 서버가 과부하 걸리지 않도록 통신 연결을 예의 바르게 끊어줍니다.
        await client.end();
    }
}

// 위에서 공들여 작성한 메인 함수를 드디어 호출하여 실행시킵니다.
importTrajectoryData();