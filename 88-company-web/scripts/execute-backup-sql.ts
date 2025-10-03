#!/usr/bin/env tsx

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!SUPABASE_URL || !SUPABASE_ACCESS_TOKEN) {
  console.error('❌ 필요한 환경 변수:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_ACCESS_TOKEN');
  process.exit(1);
}

const projectRef = SUPABASE_URL.split('//')[1].split('.')[0];

async function executeSql(sql: string): Promise<any> {
  const url = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN!}`,
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ACCESS_TOKEN!
    },
    body: JSON.stringify({ query: sql })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SQL 실행 실패: ${response.status} ${error}`);
  }

  return await response.json();
}

async function main() {
  console.log('🚀 Supabase 백업 테이블 생성');
  console.log('='.repeat(60));
  console.log(`프로젝트: ${projectRef}`);
  console.log('');

  try {
    // 1. 기존 백업 테이블 삭제
    console.log('🗑️  기존 백업 테이블 삭제 중...');
    await executeSql('DROP TABLE IF EXISTS leads_backup CASCADE;');
    await executeSql('DROP TABLE IF EXISTS chat_questions_backup CASCADE;');
    console.log('✅ 기존 테이블 삭제 완료');

    // 2. leads_backup 테이블 생성
    console.log('\n📦 leads_backup 테이블 생성 중...');
    const createLeadsBackupSql = `
      CREATE TABLE leads_backup (
        id TEXT,
        welcome TEXT,
        experience TEXT,
        business_idea TEXT,
        education TEXT,
        occupation TEXT,
        region TEXT,
        gender TEXT,
        age TEXT,
        name TEXT,
        phone TEXT,
        verified BOOLEAN,
        original_created_at TIMESTAMP WITH TIME ZONE,
        original_updated_at TIMESTAMP WITH TIME ZONE,
        backup_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        backup_created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
        backup_reason TEXT DEFAULT 'manual_backup',
        backup_created_by TEXT DEFAULT 'system'
      );
    `;
    await executeSql(createLeadsBackupSql);
    console.log('✅ leads_backup 테이블 생성 완료');

    // 3. leads_backup 인덱스 생성
    console.log('🔍 leads_backup 인덱스 생성 중...');
    await executeSql('CREATE INDEX idx_leads_backup_id ON leads_backup(id);');
    await executeSql('CREATE INDEX idx_leads_backup_phone ON leads_backup(phone);');
    await executeSql('CREATE INDEX idx_leads_backup_created_at ON leads_backup(backup_created_at DESC);');
    console.log('✅ leads_backup 인덱스 생성 완료');

    // 4. chat_questions_backup 테이블 생성
    console.log('\n📦 chat_questions_backup 테이블 생성 중...');
    const createQuestionsBackupSql = `
      CREATE TABLE chat_questions_backup (
        original_id UUID,
        type VARCHAR(20),
        question TEXT,
        placeholder TEXT,
        options JSONB,
        validation JSONB,
        order_index INTEGER,
        original_created_at TIMESTAMP WITH TIME ZONE,
        original_updated_at TIMESTAMP WITH TIME ZONE,
        backup_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        backup_created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
        backup_reason TEXT DEFAULT 'manual_backup',
        backup_created_by TEXT DEFAULT 'system'
      );
    `;
    await executeSql(createQuestionsBackupSql);
    console.log('✅ chat_questions_backup 테이블 생성 완료');

    // 5. chat_questions_backup 인덱스 생성
    console.log('🔍 chat_questions_backup 인덱스 생성 중...');
    await executeSql('CREATE INDEX idx_questions_backup_original_id ON chat_questions_backup(original_id);');
    await executeSql('CREATE INDEX idx_questions_backup_order ON chat_questions_backup(order_index);');
    await executeSql('CREATE INDEX idx_questions_backup_created_at ON chat_questions_backup(backup_created_at DESC);');
    console.log('✅ chat_questions_backup 인덱스 생성 완료');

    // 6. RLS 설정
    console.log('\n🔒 RLS 정책 설정 중...');
    await executeSql('ALTER TABLE leads_backup ENABLE ROW LEVEL SECURITY;');
    await executeSql('ALTER TABLE chat_questions_backup ENABLE ROW LEVEL SECURITY;');

    await executeSql(`CREATE POLICY "Allow public read leads backup" ON leads_backup FOR SELECT USING (true);`);
    await executeSql(`CREATE POLICY "Allow anonymous insert leads backup" ON leads_backup FOR INSERT WITH CHECK (true);`);

    await executeSql(`CREATE POLICY "Allow public read questions backup" ON chat_questions_backup FOR SELECT USING (true);`);
    await executeSql(`CREATE POLICY "Allow anonymous insert questions backup" ON chat_questions_backup FOR INSERT WITH CHECK (true);`);
    console.log('✅ RLS 정책 설정 완료');

    // 7. 백업 함수 생성
    console.log('\n⚙️  백업 함수 생성 중...');
    const backupLeadsFunctionSql = `
      CREATE OR REPLACE FUNCTION backup_all_leads(reason TEXT DEFAULT 'manual_backup')
      RETURNS INTEGER AS $$
      DECLARE
        backup_count INTEGER;
      BEGIN
        INSERT INTO leads_backup (
          id, welcome, experience, business_idea, education, occupation,
          region, gender, age, name, phone, verified,
          original_created_at, original_updated_at,
          backup_reason, backup_created_by
        )
        SELECT
          id, welcome, experience, business_idea, education, occupation,
          region, gender, age, name, phone, verified,
          created_at, updated_at,
          reason, 'auto_backup_function'
        FROM leads;
        GET DIAGNOSTICS backup_count = ROW_COUNT;
        RETURN backup_count;
      END;
      $$ LANGUAGE plpgsql;
    `;
    await executeSql(backupLeadsFunctionSql);

    const backupQuestionsFunctionSql = `
      CREATE OR REPLACE FUNCTION backup_all_questions(reason TEXT DEFAULT 'manual_backup')
      RETURNS INTEGER AS $$
      DECLARE
        backup_count INTEGER;
      BEGIN
        INSERT INTO chat_questions_backup (
          original_id, type, question, placeholder, options, validation, order_index,
          original_created_at, original_updated_at,
          backup_reason, backup_created_by
        )
        SELECT
          id, type, question, placeholder, options, validation, order_index,
          created_at, updated_at,
          reason, 'auto_backup_function'
        FROM chat_questions;
        GET DIAGNOSTICS backup_count = ROW_COUNT;
        RETURN backup_count;
      END;
      $$ LANGUAGE plpgsql;
    `;
    await executeSql(backupQuestionsFunctionSql);

    const cleanupFunctionSql = `
      CREATE OR REPLACE FUNCTION cleanup_old_backups(days_to_keep INTEGER DEFAULT 30)
      RETURNS TABLE(leads_deleted INTEGER, questions_deleted INTEGER) AS $$
      DECLARE
        leads_count INTEGER;
        questions_count INTEGER;
      BEGIN
        DELETE FROM leads_backup
        WHERE backup_created_at < NOW() - (days_to_keep || ' days')::INTERVAL;
        GET DIAGNOSTICS leads_count = ROW_COUNT;

        DELETE FROM chat_questions_backup
        WHERE backup_created_at < NOW() - (days_to_keep || ' days')::INTERVAL;
        GET DIAGNOSTICS questions_count = ROW_COUNT;

        RETURN QUERY SELECT leads_count, questions_count;
      END;
      $$ LANGUAGE plpgsql;
    `;
    await executeSql(cleanupFunctionSql);
    console.log('✅ 백업 함수 생성 완료');

    // 8. 통계 뷰 생성
    console.log('\n📊 통계 뷰 생성 중...');
    const leadsStatsViewSql = `
      CREATE OR REPLACE VIEW leads_backup_stats AS
      SELECT
        COUNT(*) as total_backups,
        COUNT(DISTINCT id) as unique_leads,
        MIN(backup_created_at) as oldest_backup,
        MAX(backup_created_at) as latest_backup,
        COUNT(CASE WHEN backup_created_at > NOW() - INTERVAL '1 day' THEN 1 END) as backups_last_24h,
        COUNT(CASE WHEN backup_created_at > NOW() - INTERVAL '7 days' THEN 1 END) as backups_last_week
      FROM leads_backup;
    `;
    await executeSql(leadsStatsViewSql);

    const questionsStatsViewSql = `
      CREATE OR REPLACE VIEW questions_backup_stats AS
      SELECT
        COUNT(*) as total_backups,
        COUNT(DISTINCT original_id) as unique_questions,
        MIN(backup_created_at) as oldest_backup,
        MAX(backup_created_at) as latest_backup,
        COUNT(CASE WHEN backup_created_at > NOW() - INTERVAL '1 day' THEN 1 END) as backups_last_24h,
        COUNT(CASE WHEN backup_created_at > NOW() - INTERVAL '7 days' THEN 1 END) as backups_last_week
      FROM chat_questions_backup;
    `;
    await executeSql(questionsStatsViewSql);
    console.log('✅ 통계 뷰 생성 완료');

    console.log('\n' + '='.repeat(60));
    console.log('🎉 백업 시스템 설정 완료!');
    console.log('');
    console.log('✅ 생성된 항목:');
    console.log('  - leads_backup 테이블 (인덱스 3개)');
    console.log('  - chat_questions_backup 테이블 (인덱스 3개)');
    console.log('  - RLS 정책 (4개)');
    console.log('  - 백업 함수 (3개)');
    console.log('  - 통계 뷰 (2개)');
    console.log('');
    console.log('📝 다음 단계:');
    console.log('  npm run backup        # 전체 백업');
    console.log('  npm run backup:stats  # 통계 확인');

  } catch (error) {
    console.error('\n❌ 오류 발생:', error);
    process.exit(1);
  }
}

main();
