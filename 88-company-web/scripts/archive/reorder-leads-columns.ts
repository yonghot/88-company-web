#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function reorderLeadsColumns() {
  console.log('🔄 leads 테이블 컬럼 순서 변경을 시작합니다...');
  console.log('\n📋 새로운 컬럼 순서:');
  console.log('  1. id (기본키)');
  console.log('  2. name (고객 이름)');
  console.log('  3. phone (전화번호)');
  console.log('  4. welcome (질문1: 서비스 선택)');
  console.log('  5. business_status (질문2: 사업자등록 상태)');
  console.log('  6. pre_startup_package (질문3: 예비창업패키지)');
  console.log('  7. gov_support_knowledge (질문4: 정부지원사업 지식)');
  console.log('  8. budget, timeline, details, custom_service');
  console.log('  9. verified, created_at, updated_at\n');

  try {
    // 1. 현재 데이터 백업
    console.log('📦 현재 데이터를 백업합니다...');
    const { data: currentData, error: fetchError } = await supabase
      .from('leads')
      .select('*');

    if (fetchError) {
      console.error('❌ 데이터 조회 실패:', fetchError.message);
      return;
    }

    const backupPath = path.join(
      process.cwd(),
      'data',
      `leads_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    );

    await fs.writeFile(
      backupPath,
      JSON.stringify({
        backup_date: new Date().toISOString(),
        total_records: currentData?.length || 0,
        data: currentData
      }, null, 2)
    );

    console.log(`✅ ${currentData?.length || 0}개의 레코드를 백업했습니다.`);
    console.log(`   백업 파일: ${backupPath}`);

    // 2. 마이그레이션 SQL 읽기
    console.log('\n📝 마이그레이션 스크립트를 실행합니다...');

    // 주의: Supabase 대시보드에서 SQL을 직접 실행하는 것을 권장
    console.log('\n⚠️  주의사항:');
    console.log('이 마이그레이션은 테이블 구조를 변경합니다.');
    console.log('Supabase 대시보드 SQL Editor에서 직접 실행하는 것이 안전합니다.');
    console.log('\n실행 방법:');
    console.log('1. Supabase 대시보드 접속 (https://app.supabase.com)');
    console.log('2. SQL Editor 열기');
    console.log('3. supabase/migration_reorder_leads_columns.sql 파일 내용 붙여넣기');
    console.log('4. 실행 버튼 클릭');

    // 3. 현재 스키마 정보 출력
    console.log('\n📊 현재 테이블 구조:');
    const { data: columns, error: schemaError } = await supabase.rpc(
      'get_table_columns',
      { table_name: 'leads' }
    ).single();

    if (!schemaError && columns) {
      console.log(columns);
    } else {
      console.log('테이블 구조를 조회할 수 없습니다. Supabase 대시보드에서 확인하세요.');
    }

    // 4. 수동 실행 안내
    console.log('\n📌 다음 단계:');
    console.log('1. Supabase 대시보드에서 SQL 마이그레이션 실행');
    console.log('2. 실행 완료 후 애플리케이션 테스트');
    console.log('3. 문제 발생 시 백업 파일로 복원');

  } catch (error) {
    console.error('❌ 예기치 않은 오류 발생:', error);
  }
}

// RPC 함수가 없는 경우를 위한 대체 쿼리
async function checkTableStructure() {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .limit(1);

    if (!error && data) {
      const sampleRecord = data[0];
      if (sampleRecord) {
        console.log('\n📋 현재 컬럼 목록:');
        Object.keys(sampleRecord).forEach((key, index) => {
          console.log(`  ${index + 1}. ${key}`);
        });
      }
    }
  } catch (error) {
    console.log('테이블 구조 확인 실패');
  }
}

reorderLeadsColumns().then(() => {
  checkTableStructure();
});