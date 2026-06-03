require('dotenv').config({ override: true });
const fs = require('fs');
const csv = require('csv-parser');
const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL
});

async function importTrajectoryData() {
    const results = [];

    try {
        await client.connect();
        console.log('✅ Supabase DB 연결 성공!');

        // 💡 1. [자동 청소] 잘못 들어간 NULL 데이터 1만 개를 싹 비워줍니다.
        await client.query('TRUNCATE TABLE ship_trajectory;');
        console.log('🧹 기존 NULL 데이터 초기화 완료!');

        await new Promise((resolve, reject) => {
            // 💡 2. iconv를 빼고 최신 공공데이터 표준인 utf8로 읽습니다.
            fs.createReadStream('해양수산부_(융합)어선_항적도_20240221.csv', { encoding: 'utf8' })
                .pipe(csv({
                    // 💡 3. 눈에 보이지 않는 공백이나 쓰레기 문자(BOM)를 잘라내서 기둥 이름을 깔끔하게 만듭니다.
                    mapHeaders: ({ header }) => header.trim().replace(/^\uFEFF/, '')
                }))
                .on('data', (data) => results.push(data))
                .on('end', () => resolve())
                .on('error', (err) => reject(err));
        });

        console.log(`📄 CSV 파일 읽기 완료. 총 ${results.length}개의 어선 데이터를 DB에 삽입합니다...`);

        // 💡 4. [안전 장치] 만약 또 한글이 깨져서 '공간정보' 칸을 못 찾으면 멈추도록 방어합니다.
        if (!results[0]['공간정보']) {
            console.error('\n🚨 [에러] CSV 컬럼을 찾을 수 없습니다! 파일이 EUC-KR 인코딩일 확률이 높습니다.');
            console.log('👉 현재 인식된 컬럼명들:', Object.keys(results[0]));
            console.log('👉 해결법: VS Code에서 CSV 파일을 열고 우측 하단의 인코딩을 UTF-8로 다시 저장해주세요!\n');
            process.exit(1); // 스크립트 강제 종료
        }

        let count = 0;

        for (const row of results) {
            const insertQuery = `
                INSERT INTO ship_trajectory (ship_type_code, ship_type_name, length, width, draft, geom)
                VALUES ($1, $2, $3, $4, $5, ST_GeomFromWKB(decode($6, 'hex'), 4326))
            `;

            const values = [
                row['낚시어선여부'] ? parseInt(row['낚시어선여부']) : null,
                row['낚시어선여부명'],
                row['어선길이(KM)'] ? parseFloat(row['어선길이(KM)']) : null,
                row['어선너비(KM)'] ? parseFloat(row['어선너비(KM)']) : null,
                row['어선톤수(톤)'] ? parseFloat(row['어선톤수(톤)']) : null,
                row['공간정보']
            ];

            await client.query(insertQuery, values);
            count++;
            
            if (count % 1000 === 0) {
                console.log(`⏳ 정상 적재 중... ${count} / ${results.length} 개 완료`);
            }
        }

        console.log('🎉 10,000개 융합 어선 항적 데이터베이스 완벽 적재 성공!');

    } catch (err) {
        console.error('❌ 작업 중 에러 발생:', err.message);
    } finally {
        await client.end();
    }
}

importTrajectoryData();