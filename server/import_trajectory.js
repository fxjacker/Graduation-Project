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

        await client.query('TRUNCATE TABLE ship_trajectory;');
        console.log('🧹 기존 데이터 초기화 완료!');

        await new Promise((resolve, reject) => {
            fs.createReadStream('해양수산부_(융합)어선 항적도_20240221.csv', { encoding: 'utf8' })
                .pipe(csv({
                    mapHeaders: ({ header }) => header.trim().replace(/^\uFEFF/, '')
                }))
                .on('data', (data) => results.push(data))
                .on('end', () => resolve())
                .on('error', (err) => reject(err));
        });

        console.log(`📄 CSV 파일 읽기 완료. 총 ${results.length}개의 어선 데이터를 DB에 삽입합니다...`);

        if (!results[0]['공간정보']) {
            console.error('\n🚨 [에러] CSV 컬럼을 찾을 수 없습니다! 파일을 UTF-8로 저장해주세요.\n');
            process.exit(1);
        }

        // 성공과 실패 개수를 세기 위한 카운터
        let successCount = 0;
        let skipCount = 0;

        // results 배열을 돌면서 인덱스(i)도 같이 확인합니다.
        for (let i = 0; i < results.length; i++) {
            const row = results[i];
            const hexData = row['공간정보'];

            // 💡 [핵심 방어 로직 1] 공간정보가 아예 없거나, 글자 수가 홀수면(짤린 데이터면) 건너뜁니다
            if (!hexData || hexData.trim().length % 2 !== 0) {
                // console.log(`⚠️ ${i + 1}번째 줄 불량 데이터 건너뜀 (홀수 길거나 없음)`);
                skipCount++;
                continue; // 아래 코드를 실행하지 않고 바로 다음 데이터로 넘어감
            }

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
                hexData.trim()
            ];

            // 💡 [핵심 방어 로직 2] 혹시라도 DB에서 다른 이유로 에러가 나더라도 스크립트가 안 뻗게 막아줍니다.
            try {
                await client.query(insertQuery, values);
                successCount++;
            } catch (dbErr) {
                // console.log(`⚠️ ${i + 1}번째 줄 DB 에러 건너뜀: ${dbErr.message}`);
                skipCount++;
            }
            
            // 1000번째 처리마다 상황을 터미널에 보고합니다.
            if ((i + 1) % 1000 === 0) {
                console.log(`⏳ 적재 중... ${i + 1} / ${results.length} 개 검사 완료 (성공: ${successCount}, 불량스킵: ${skipCount})`);
            }
        }

        console.log(`\n🎉 최종 완료! 정상 데이터 ${successCount}개 적재 성공 (불량 데이터 ${skipCount}개 제외됨)`);

    } catch (err) {
        console.error('❌ 작업 중 치명적 에러 발생:', err.message);
    } finally {
        await client.end();
    }
}

importTrajectoryData();