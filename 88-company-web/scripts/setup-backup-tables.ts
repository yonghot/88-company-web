#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

console.log('🔧 Supabase 백업 테이블 설정 스크립트');
console.log('=' .repeat(60));
console.log(`URL: ${SUPABASE_URL}`);
console.log('');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkCurrentSchema() {
  console.log('📊 현재 테이블 확인 중...');

  const { data: tables, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public');

  if (error) {
    console.log('⚠️  테이블 조회 실패 (RLS 정책으로 인한 제한일 수 있음)');
  } else if (tables) {
    console.log(`✅ 테이블 목록:`, tables.map(t => t.table_name).join(', '));
  }
}

async function checkLeadsColumns() {
  console.log('\n📋 Leads 테이블 컬럼 확인 중...');

  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Leads 테이블 조회 실패:', error.message);
    return;
  }

  if (data && data.length > 0) {
    const columns = Object.keys(data[0]);
    console.log(`✅ Leads 테이블 컬럼 (${columns.length}개):`);
    console.log(columns.join(', '));
  } else {
    console.log('⚠️  Leads 테이블에 데이터가 없습니다.');
  }
}

async function main() {
  console.log('📌 주의사항:');
  console.log('이 스크립트는 ANON_KEY로 실행되므로 일부 권한이 제한될 수 있습니다.');
  console.log('백업 테이블 생성을 위해서는 Supabase Dashboard의 SQL Editor를 사용하세요.');
  console.log('');
  console.log('👉 다음 파일을 SQL Editor에서 실행하세요:');
  console.log('   supabase/create-backup-tables.sql');
  console.log('');

  await checkCurrentSchema();
  await checkLeadsColumns();

  console.log('\n' + '='.repeat(60));
  console.log('📝 실행 방법:');
  console.log('1. Supabase Dashboard (https://app.supabase.com) 로그인');
  console.log('2. 프로젝트 선택 (tjizerpeyteokqhufqea)');
  console.log('3. SQL Editor 메뉴 선택');
  console.log('4. New Query 클릭');
  console.log('5. supabase/create-backup-tables.sql 내용 붙여넣기');
  console.log('6. Run 버튼 클릭');
  console.log('');
  console.log('✅ 백업 테이블이 생성되면 다음 명령어로 백업 실행:');
  console.log('   npm run backup');
}

main();
