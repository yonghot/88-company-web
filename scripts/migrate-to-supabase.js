#!/usr/bin/env node

/**
 * 88 Company - Supabase 마이그레이션 스크립트
 *
 * 이 스크립트는 기존 파일 시스템(data/leads.json)의 데이터를
 * Supabase 데이터베이스로 마이그레이션합니다.
 */

const fs = require('fs').promises;
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Supabase 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 색상 코드 (터미널 출력용)
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// 로그 함수
const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.magenta}${msg}${colors.reset}\n${'='.repeat(50)}`),
};

// 메인 마이그레이션 함수
async function migrate() {
  log.header('🚀 88 Company 데이터 마이그레이션 시작');

  // 1. Supabase 연결 확인
  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your_supabase')) {
    log.error('Supabase 환경 변수가 설정되지 않았습니다.');
    log.info('다음 환경 변수를 .env.local 파일에 설정해주세요:');
    log.info('  NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>');
    log.info('  NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  log.success('Supabase 클라이언트 초기화 완료');

  // 2. 기존 데이터 파일 읽기
  const dataFile = path.join(process.cwd(), 'data', 'leads.json');
  let existingData = [];

  try {
    const fileContent = await fs.readFile(dataFile, 'utf-8');
    existingData = JSON.parse(fileContent);
    log.success(`파일에서 ${existingData.length}개의 리드를 찾았습니다.`);
  } catch (error) {
    if (error.code === 'ENOENT') {
      log.warning('data/leads.json 파일이 없습니다. 마이그레이션할 데이터가 없습니다.');
      return;
    }
    log.error(`파일 읽기 오류: ${error.message}`);
    process.exit(1);
  }

  if (existingData.length === 0) {
    log.info('마이그레이션할 데이터가 없습니다.');
    return;
  }

  // 3. Supabase에 현재 데이터 확인
  log.info('Supabase의 기존 데이터를 확인하는 중...');
  const { data: existingSupabaseData, error: selectError } = await supabase
    .from('leads')
    .select('id');

  if (selectError) {
    log.error(`Supabase 조회 오류: ${selectError.message}`);
    log.info('테이블이 없다면 먼저 supabase/schema.sql을 실행해주세요.');
    process.exit(1);
  }

  const existingIds = new Set(existingSupabaseData?.map(lead => lead.id) || []);
  log.info(`Supabase에 ${existingIds.size}개의 기존 리드가 있습니다.`);

  // 4. 데이터 마이그레이션
  log.header('📤 데이터 마이그레이션 시작');

  let successCount = 0;
  let updateCount = 0;
  let errorCount = 0;
  const errors = [];

  for (const lead of existingData) {
    // ID가 없으면 전화번호로 생성
    if (!lead.id && lead.phone) {
      lead.id = lead.phone.replace(/-/g, '');
    }

    if (!lead.id) {
      log.warning(`ID가 없는 리드 건너뜀: ${JSON.stringify(lead)}`);
      errorCount++;
      continue;
    }

    // 데이터 정규화
    const normalizedLead = {
      id: lead.id,
      service: lead.service || null,
      budget: lead.budget || null,
      timeline: lead.timeline || null,
      message: lead.message || null,
      name: lead.name || null,
      phone: lead.phone || null,
      verified: lead.verified || false,
      details: lead.details || null,
      created_at: lead.createdAt || lead.created_at || new Date().toISOString(),
      updated_at: lead.updatedAt || lead.updated_at || new Date().toISOString(),
    };

    try {
      if (existingIds.has(lead.id)) {
        // 기존 데이터 업데이트
        const { error } = await supabase
          .from('leads')
          .update(normalizedLead)
          .eq('id', lead.id);

        if (error) throw error;
        updateCount++;
        log.info(`업데이트: ${lead.name || 'Unknown'} (${lead.phone})`);
      } else {
        // 새 데이터 삽입
        const { error } = await supabase
          .from('leads')
          .insert([normalizedLead]);

        if (error) throw error;
        successCount++;
        log.success(`추가: ${lead.name || 'Unknown'} (${lead.phone})`);
      }
    } catch (error) {
      errorCount++;
      errors.push({ lead: lead.id, error: error.message });
      log.error(`오류 - ${lead.name || lead.id}: ${error.message}`);
    }
  }

  // 5. 결과 요약
  log.header('📊 마이그레이션 완료');
  log.info(`총 ${existingData.length}개 중:`);
  log.success(`  ✓ ${successCount}개 새로 추가됨`);
  log.info(`  ↻ ${updateCount}개 업데이트됨`);
  if (errorCount > 0) {
    log.error(`  ✗ ${errorCount}개 실패`);
    if (errors.length > 0) {
      log.error('실패한 항목:');
      errors.forEach(e => log.error(`  - ${e.lead}: ${e.error}`));
    }
  }

  // 6. 백업 생성
  const backupFile = path.join(process.cwd(), 'data', `leads.backup.${Date.now()}.json`);
  try {
    await fs.writeFile(backupFile, JSON.stringify(existingData, null, 2));
    log.success(`백업 파일 생성: ${backupFile}`);
  } catch (error) {
    log.warning(`백업 파일 생성 실패: ${error.message}`);
  }

  log.header('✨ 마이그레이션 프로세스 완료!');
  log.info('이제 환경 변수가 설정되어 있으면 시스템이 자동으로 Supabase를 사용합니다.');
  log.info('관리자 페이지: http://localhost:3000/admin');
}

// 스크립트 실행
migrate().catch(error => {
  log.error(`치명적 오류: ${error.message}`);
  process.exit(1);
});