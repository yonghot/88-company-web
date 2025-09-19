import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tjizerpeyteokqhufqea.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqaXplcnBleXRlb2txaHVmcWVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2ODkxMTEsImV4cCI6MjA3MzI2NTExMX0.lpw_F9T7tML76NyCm1_6NJ6kyFdXtYsoUehK9ZhZT7s';

async function testConnection() {
  console.log('🔍 Supabase 연결 테스트 시작\n');
  console.log('URL:', SUPABASE_URL);
  console.log('Key:', SUPABASE_ANON_KEY.substring(0, 20) + '...\n');

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase 클라이언트 생성 성공\n');

    // 테이블 존재 여부 확인
    console.log('📊 chat_questions 테이블 조회 중...');
    const { data, error, count } = await supabase
      .from('chat_questions')
      .select('*', { count: 'exact' });

    if (error) {
      console.error('❌ 테이블 조회 실패:', error.message);
      console.error('에러 코드:', error.code);
      console.error('에러 상세:', error.details);

      if (error.code === '42P01') {
        console.log('\n⚠️ chat_questions 테이블이 존재하지 않습니다!');
        console.log('💡 해결 방법:');
        console.log('1. Supabase 대시보드에 로그인하세요: https://app.supabase.com');
        console.log('2. SQL Editor에서 다음 스크립트를 실행하세요:\n');
        console.log(`
CREATE TABLE IF NOT EXISTS chat_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  step TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  question TEXT NOT NULL,
  placeholder TEXT,
  options JSONB,
  next_step TEXT,
  validation JSONB,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_chat_questions_step ON chat_questions(step);
CREATE INDEX idx_chat_questions_order ON chat_questions(order_index);
CREATE INDEX idx_chat_questions_active ON chat_questions(is_active);
        `);
      }
      return;
    }

    console.log('✅ 테이블 조회 성공!');
    console.log(`📊 현재 ${count || 0}개의 질문이 저장되어 있습니다.\n`);

    if (data && data.length > 0) {
      console.log('📝 저장된 질문 목록:');
      data.forEach((q: any, i: number) => {
        console.log(`  ${i + 1}. ${q.step}: ${q.question.substring(0, 50)}...`);
      });
    } else {
      console.log('⚠️ 테이블은 존재하지만 데이터가 없습니다.');
      console.log('💡 관리자 페이지에서 질문을 추가하거나 마이그레이션 스크립트를 실행하세요.');
    }

    // Realtime 구독 테스트
    console.log('\n🔄 Realtime 구독 테스트...');
    const channel = supabase
      .channel('test_channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_questions'
      }, (payload) => {
        console.log('📡 Realtime 이벤트 수신:', payload.eventType);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime 구독 성공!');
          console.log('\n🎉 Supabase가 정상적으로 작동합니다!');
          process.exit(0);
        } else {
          console.log('Realtime 상태:', status);
        }
      });

    // 5초 후 타임아웃
    setTimeout(() => {
      console.log('\n⏱️ 테스트 완료 (Realtime 구독 타임아웃)');
      process.exit(0);
    }, 5000);

  } catch (error) {
    console.error('❌ 연결 실패:', error);
  }
}

testConnection();