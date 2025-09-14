#!/usr/bin/env node

/**
 * Supabase 연결 테스트 스크립트
 * 환경 변수가 올바르게 설정되었는지 확인합니다.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${msg}${colors.reset}\n${'='.repeat(50)}`),
};

async function testSupabase() {
  log.header('🔍 Supabase 연결 테스트');

  // 1. 환경 변수 확인
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  log.info('환경 변수 확인 중...');

  if (!supabaseUrl || !supabaseKey) {
    log.error('환경 변수가 설정되지 않았습니다!');
    log.info('다음 파일을 확인하세요: .env.local');
    log.info('필요한 변수:');
    log.info('  - NEXT_PUBLIC_SUPABASE_URL');
    log.info('  - NEXT_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(1);
  }

  if (supabaseUrl.includes('your_supabase') || supabaseUrl.includes('your-project-id')) {
    log.warning('환경 변수가 예제 값으로 설정되어 있습니다.');
    log.info('실제 Supabase 프로젝트 값으로 변경해주세요.');
    process.exit(1);
  }

  log.success('환경 변수 설정 확인');
  log.info(`  URL: ${supabaseUrl}`);
  log.info(`  Key: ${supabaseKey.substring(0, 20)}...`);

  // 2. Supabase 클라이언트 생성
  log.info('\nSupabase 클라이언트 생성 중...');
  const supabase = createClient(supabaseUrl, supabaseKey);
  log.success('클라이언트 생성 완료');

  // 3. 테이블 연결 테스트
  log.info('\n데이터베이스 연결 테스트 중...');

  try {
    const { data, error, count } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true });

    if (error) {
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        log.error('leads 테이블이 존재하지 않습니다!');
        log.info('다음 단계를 따라주세요:');
        log.info('1. Supabase 대시보드 > SQL Editor 접속');
        log.info('2. supabase/schema.sql 파일 내용 실행');
        log.info('3. 이 테스트를 다시 실행');
      } else {
        log.error(`데이터베이스 오류: ${error.message}`);
      }
      process.exit(1);
    }

    log.success('데이터베이스 연결 성공!');

    // 4. 데이터 수 확인
    const { data: leads, error: countError } = await supabase
      .from('leads')
      .select('*');

    if (!countError) {
      log.info(`\n현재 저장된 리드 수: ${leads?.length || 0}개`);
    }

    // 5. 테스트 데이터 삽입/삭제 (선택적)
    log.info('\n쓰기 권한 테스트 중...');

    const testLead = {
      id: 'test_' + Date.now(),
      name: '테스트 사용자',
      phone: '010-TEST-TEST',
      service: '테스트 서비스',
      budget: '테스트 예산',
      timeline: '테스트 일정',
      verified: true,
    };

    // 삽입 테스트
    const { error: insertError } = await supabase
      .from('leads')
      .insert([testLead]);

    if (insertError) {
      log.error(`삽입 실패: ${insertError.message}`);
    } else {
      log.success('데이터 삽입 성공');

      // 삭제 테스트
      const { error: deleteError } = await supabase
        .from('leads')
        .delete()
        .eq('id', testLead.id);

      if (deleteError) {
        log.error(`삭제 실패: ${deleteError.message}`);
      } else {
        log.success('데이터 삭제 성공');
      }
    }

    // 6. 최종 결과
    log.header('✨ 테스트 완료!');
    log.success('Supabase가 정상적으로 설정되었습니다.');
    log.info('\n다음 명령어로 개발 서버를 시작하세요:');
    log.info('  npm run dev');
    log.info('\n관리자 페이지:');
    log.info('  http://localhost:3000/admin');

  } catch (error) {
    log.error(`예기치 않은 오류: ${error.message}`);
    process.exit(1);
  }
}

// 스크립트 실행
testSupabase().catch(error => {
  log.error(`치명적 오류: ${error.message}`);
  process.exit(1);
});