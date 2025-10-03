#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  console.error('필요한 환경 변수:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

interface BackupOptions {
  target: 'leads' | 'questions' | 'all';
  reason: string;
  showStats: boolean;
  cleanup: boolean;
  cleanupDays?: number;
}

async function backupLeads(reason: string): Promise<number> {
  console.log('\n📦 Leads 테이블 백업 중...');

  const { data, error } = await supabase.rpc('backup_all_leads', {
    reason
  });

  if (error) {
    console.error('❌ Leads 백업 실패:', error.message);
    throw error;
  }

  const backupCount = data as number;
  console.log(`✅ Leads 백업 완료: ${backupCount}개 레코드`);
  return backupCount;
}

async function backupQuestions(reason: string): Promise<number> {
  console.log('\n📦 Chat Questions 테이블 백업 중...');

  const { data, error } = await supabase.rpc('backup_all_questions', {
    reason
  });

  if (error) {
    console.error('❌ Questions 백업 실패:', error.message);
    throw error;
  }

  const backupCount = data as number;
  console.log(`✅ Questions 백업 완료: ${backupCount}개 레코드`);
  return backupCount;
}

async function showBackupStats() {
  console.log('\n📊 백업 통계');
  console.log('='.repeat(60));

  const { data: leadsStats, error: leadsError } = await supabase
    .from('leads_backup_stats')
    .select('*')
    .single();

  if (!leadsError && leadsStats) {
    console.log('\n📋 Leads 백업:');
    console.log(`  총 백업 수: ${leadsStats.total_backups}`);
    console.log(`  고유 리드 수: ${leadsStats.unique_leads}`);
    console.log(`  최신 백업: ${new Date(leadsStats.latest_backup).toLocaleString('ko-KR')}`);
    console.log(`  24시간 내 백업: ${leadsStats.backups_last_24h}개`);
    console.log(`  7일 내 백업: ${leadsStats.backups_last_week}개`);
  }

  const { data: questionsStats, error: questionsError } = await supabase
    .from('questions_backup_stats')
    .select('*')
    .single();

  if (!questionsError && questionsStats) {
    console.log('\n📝 Questions 백업:');
    console.log(`  총 백업 수: ${questionsStats.total_backups}`);
    console.log(`  고유 질문 수: ${questionsStats.unique_questions}`);
    console.log(`  최신 백업: ${new Date(questionsStats.latest_backup).toLocaleString('ko-KR')}`);
    console.log(`  24시간 내 백업: ${questionsStats.backups_last_24h}개`);
    console.log(`  7일 내 백업: ${questionsStats.backups_last_week}개`);
  }

  console.log('='.repeat(60));
}

async function cleanupOldBackups(days: number = 30) {
  console.log(`\n🧹 ${days}일 이상 오래된 백업 정리 중...`);

  const { data, error } = await supabase.rpc('cleanup_old_backups', {
    days_to_keep: days
  });

  if (error) {
    console.error('❌ 백업 정리 실패:', error.message);
    throw error;
  }

  if (data && data.length > 0) {
    const result = data[0];
    console.log(`✅ Leads 백업 삭제: ${result.leads_deleted}개`);
    console.log(`✅ Questions 백업 삭제: ${result.questions_deleted}개`);
  }
}

async function main() {
  const args = process.argv.slice(2);

  const options: BackupOptions = {
    target: 'all',
    reason: 'manual_backup',
    showStats: false,
    cleanup: false,
    cleanupDays: 30
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--target':
      case '-t':
        options.target = args[++i] as 'leads' | 'questions' | 'all';
        break;
      case '--reason':
      case '-r':
        options.reason = args[++i];
        break;
      case '--stats':
      case '-s':
        options.showStats = true;
        break;
      case '--cleanup':
      case '-c':
        options.cleanup = true;
        break;
      case '--cleanup-days':
        options.cleanupDays = parseInt(args[++i]);
        break;
      case '--help':
      case '-h':
        console.log(`
백업 스크립트 사용법:

  npm run tsx scripts/backup-database.ts [옵션]

옵션:
  -t, --target <type>       백업 대상 (leads|questions|all, 기본값: all)
  -r, --reason <reason>     백업 사유 (기본값: manual_backup)
  -s, --stats               백업 통계 표시
  -c, --cleanup             오래된 백업 정리
  --cleanup-days <days>     정리할 백업 기준 일수 (기본값: 30)
  -h, --help                도움말 표시

예시:
  # 모든 테이블 백업
  npm run tsx scripts/backup-database.ts

  # Leads만 백업
  npm run tsx scripts/backup-database.ts -t leads -r "before_migration"

  # 백업 후 통계 표시
  npm run tsx scripts/backup-database.ts -s

  # 30일 이상 오래된 백업 정리
  npm run tsx scripts/backup-database.ts -c

  # 통계만 표시
  npm run tsx scripts/backup-database.ts -s --target none
        `);
        process.exit(0);
    }
  }

  console.log('🚀 88 Company 데이터베이스 백업 시스템');
  console.log('='.repeat(60));
  console.log(`대상: ${options.target}`);
  console.log(`사유: ${options.reason}`);
  console.log(`시각: ${new Date().toLocaleString('ko-KR')}`);

  try {
    if (options.target === 'leads' || options.target === 'all') {
      await backupLeads(options.reason);
    }

    if (options.target === 'questions' || options.target === 'all') {
      await backupQuestions(options.reason);
    }

    if (options.cleanup) {
      await cleanupOldBackups(options.cleanupDays);
    }

    if (options.showStats) {
      await showBackupStats();
    }

    console.log('\n✅ 백업 작업 완료!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ 백업 작업 실패:', error);
    process.exit(1);
  }
}

main();
