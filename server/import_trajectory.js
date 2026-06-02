// 환경변수를 불러오기 위해 dotenv 모듈을 사용합니다.
require('dotenv').config();
// 파일 시스템과 CSV 파서 모듈을 불러옵니다.
const fs = require('fs');
const csv = require('csv-parser');
// Supabase의 PostgreSQL에 직접 쿼리를 날리기 위해 pg 모듈을 사용합니다.
const { Client } = require('pg');

// Supabase 데이터베이스 연결 정보를 설정합니다.
const client = new Client({
    // .env 파일에 있는 SUPABASE_DB_URL 값을 사용합니다. (예: postgresql://postgres:[비밀번호]@[호스트]:5432/postgres)
    connectionString: process.env.SUPABASE_DB_URL
});

async function importTrajectoryData() {
    const results = [];
    
    try {
        // Supabase DB에 연결합니다.
        await client.connect();
        console.log('✅ Supabase DB 연결 성공!');

        // Promise를 써서 CSV 파일을 다 읽을 때까지 기다립니다.
        await new Promise((resolve, reject) => {
            // 다운받은 CSV 파일 이름을 정확히 입력해 주세요.
            fs.createReadStream('해양수산부_(융합)선박_항적도_샘플.csv')
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', () => resolve())
                .on('error', (err) => reject(err));
        });

        console.log(`📄 CSV 파일 읽기 완료. 총 ${results.length}개의 데이터를 DB에 삽입합니다...`);

        // 데이터를 하나씩 돌면서 DB에 INSERT 합니다.
        for (const row of results) {
            // WKB(16진수) 데이터를 PostGIS 지오메트리로 변환해서 넣는 핵심 쿼리입니다.
            const insertQuery = `
                INSERT INTO ship_trajectory (ship_type_code, ship_type_name, length, width, draft, geom)
                VALUES ($1, $2, $3, $4, $5, ST_GeomFromWKB(decode($6, 'hex'), 4326))
            `;

            const values = [
                row['선종분류'] ? parseInt(row['선종분류']) : null,
                row['선종분류명'],
                row['길이'] ? parseFloat(row['길이']) : null,
                row['너비'] ? parseFloat(row['너비']) : null,
                row['흘수'] ? parseFloat(row['흘수']) : null,
                row['공간정보'] // 16진수 문자열 그대로 전달
            ];

            await client.query(insertQuery, values);
        }

        console.log('🎉 데이터베이스 적재 완벽하게 성공!');

    } catch (err) {
        console.error('❌ 작업 중 에러 발생:', err.message);
    } finally {
        // 작업이 끝나면 DB 연결을 끊어줍니다.
        await client.end();
    }
}

// 스크립트 실행
importTrajectoryData();