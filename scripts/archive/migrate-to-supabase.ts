#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { ChatQuestion } from '../lib/chat/dynamic-types';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

interface Lead {
  id: string;
  service: string;
  budget: string;
  timeline: string;
  message?: string;
  name?: string;
  phone?: string;
  verified?: boolean;
  details?: string;
  created_at?: string;
  updated_at?: string;
}

interface MigrationStats {
  questions: {
    total: number;
    migrated: number;
    failed: number;
  };
  leads: {
    total: number;
    migrated: number;
    failed: number;
  };
}

async function checkSupabaseConnection(): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
    console.log('\n📝 .env.local 파일에 다음 환경 변수를 설정하세요:\n');
    console.log('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key\n');
    console.log('자세한 설정 방법은 docs/SUPABASE_SETUP.md를 참고하세요.');
    return false;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    const { error } = await supabase.from('chat_questions').select('count').limit(1);
    if (error) {
      console.error('❌ Supabase 연결 실패:', error.message);
      console.log('\n다음 사항을 확인하세요:');
      console.log('1. Supabase 프로젝트가 활성화되어 있는지');
      console.log('2. 테이블 스키마가 생성되었는지 (supabase/schema.sql 실행)');
      console.log('3. 환경 변수가 올바른지');
      return false;
    }
    console.log('✅ Supabase 연결 성공\n');
    return true;
  } catch (error) {
    console.error('❌ Supabase 연결 중 오류:', error);
    return false;
  }
}

async function loadLocalQuestions(): Promise<ChatQuestion[]> {
  const questionsPath = path.join(process.cwd(), 'data', 'questions.json');

  try {
    const data = await fs.readFile(questionsPath, 'utf-8');
    const parsed = JSON.parse(data);
    return parsed.questions || [];
  } catch (error) {
    return [];
  }
}

async function loadLocalLeads(): Promise<Lead[]> {
  const leadsPath = path.join(process.cwd(), 'data', 'leads.json');

  try {
    const data = await fs.readFile(leadsPath, 'utf-8');
    const parsed = JSON.parse(data);
    return parsed.leads || [];
  } catch (error) {
    return [];
  }
}

async function createBackup(): Promise<string> {
  const backupDir = path.join(process.cwd(), 'data', 'backups');
  await fs.mkdir(backupDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `migration_backup_${timestamp}.json`);

  const questions = await loadLocalQuestions();
  const leads = await loadLocalLeads();

  await fs.writeFile(
    backupPath,
    JSON.stringify({
      backupDate: new Date().toISOString(),
      questions,
      leads
    }, null, 2)
  );

  return backupPath;
}

async function migrateQuestions(supabase: any): Promise<MigrationStats['questions']> {
  const stats = { total: 0, migrated: 0, failed: 0 };
  const questions = await loadLocalQuestions();

  stats.total = questions.length;

  if (questions.length === 0) {
    return stats;
  }

  console.log(`📋 ${questions.length}개의 질문 마이그레이션 시작...`);

  const { data: existingQuestions } = await supabase
    .from('chat_questions')
    .select('step');

  const existingSteps = new Set(existingQuestions?.map((q: any) => q.step) || []);

  for (const question of questions) {
    try {
      if (existingSteps.has(question.step)) {
        const { error } = await supabase
          .from('chat_questions')
          .update({
            type: question.type,
            question: question.question,
            placeholder: question.placeholder || null,
            options: question.options || null,
            validation: question.validation || null,
            next_step: question.next_step || null,
            is_active: question.is_active !== undefined ? question.is_active : true,
            order_index: question.order_index
          })
          .eq('step', question.step);

        if (error) {
          stats.failed++;
          console.error(`  ❌ 업데이트 실패 (${question.step}):`, error.message);
        } else {
          stats.migrated++;
          console.log(`  ✅ 업데이트: ${question.step}`);
        }
      } else {
        const { error } = await supabase
          .from('chat_questions')
          .insert([{
            step: question.step,
            type: question.type,
            question: question.question,
            placeholder: question.placeholder || null,
            options: question.options || null,
            validation: question.validation || null,
            next_step: question.next_step || null,
            is_active: question.is_active !== undefined ? question.is_active : true,
            order_index: question.order_index
          }]);

        if (error) {
          stats.failed++;
          console.error(`  ❌ 생성 실패 (${question.step}):`, error.message);
        } else {
          stats.migrated++;
          console.log(`  ✅ 생성: ${question.step}`);
        }
      }
    } catch (error) {
      stats.failed++;
      console.error(`  ❌ 오류 (${question.step}):`, error);
    }
  }

  return stats;
}

async function migrateLeads(supabase: any): Promise<MigrationStats['leads']> {
  const stats = { total: 0, migrated: 0, failed: 0 };
  const leads = await loadLocalLeads();

  stats.total = leads.length;

  if (leads.length === 0) {
    return stats;
  }

  console.log(`\n👥 ${leads.length}개의 리드 마이그레이션 시작...`);

  for (const lead of leads) {
    try {
      const leadId = lead.phone ? lead.phone.replace(/-/g, '') : lead.id;

      const { data: existingLead } = await supabase
        .from('leads')
        .select('id')
        .eq('id', leadId)
        .single();

      if (existingLead) {
        const { error } = await supabase
          .from('leads')
          .update({
            service: lead.service,
            budget: lead.budget,
            timeline: lead.timeline,
            message: lead.message || null,
            name: lead.name || null,
            phone: lead.phone || null,
            verified: lead.verified || false,
            details: lead.details || null,
            updated_at: lead.updated_at || new Date().toISOString()
          })
          .eq('id', leadId);

        if (error) {
          stats.failed++;
          console.error(`  ❌ 업데이트 실패 (${lead.name || leadId}):`, error.message);
        } else {
          stats.migrated++;
          console.log(`  ✅ 업데이트: ${lead.name || leadId}`);
        }
      } else {
        const { error } = await supabase
          .from('leads')
          .insert([{
            id: leadId,
            service: lead.service,
            budget: lead.budget,
            timeline: lead.timeline,
            message: lead.message || null,
            name: lead.name || null,
            phone: lead.phone || null,
            verified: lead.verified || false,
            details: lead.details || null,
            created_at: lead.created_at || new Date().toISOString(),
            updated_at: lead.updated_at || new Date().toISOString()
          }]);

        if (error) {
          stats.failed++;
          console.error(`  ❌ 생성 실패 (${lead.name || leadId}):`, error.message);
        } else {
          stats.migrated++;
          console.log(`  ✅ 생성: ${lead.name || leadId}`);
        }
      }
    } catch (error) {
      stats.failed++;
      console.error(`  ❌ 오류 (${lead.name}):`, error);
    }
  }

  return stats;
}

async function runMigration() {
  console.log('🚀 88 Company Supabase 마이그레이션 시작\n');
  console.log('============================================\n');

  const isConnected = await checkSupabaseConnection();
  if (!isConnected) {
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!);

  try {
    console.log('💾 백업 생성 중...');
    const backupPath = await createBackup();
    console.log(`✅ 백업 완료: ${backupPath}\n`);

    const stats: MigrationStats = {
      questions: await migrateQuestions(supabase),
      leads: await migrateLeads(supabase)
    };

    console.log('\n============================================');
    console.log('📊 마이그레이션 결과\n');

    console.log('질문 마이그레이션:');
    console.log(`  전체: ${stats.questions.total}개`);
    console.log(`  성공: ${stats.questions.migrated}개`);
    console.log(`  실패: ${stats.questions.failed}개`);

    console.log('\n리드 마이그레이션:');
    console.log(`  전체: ${stats.leads.total}개`);
    console.log(`  성공: ${stats.leads.migrated}개`);
    console.log(`  실패: ${stats.leads.failed}개`);

    const totalSuccess = stats.questions.migrated + stats.leads.migrated;
    const totalFailed = stats.questions.failed + stats.leads.failed;

    if (totalSuccess > 0) {
      console.log(`\n🎉 마이그레이션 완료!`);
      console.log(`✅ 총 ${totalSuccess}개 항목이 성공적으로 마이그레이션되었습니다.`);

      if (totalFailed > 0) {
        console.log(`⚠️ ${totalFailed}개 항목에서 오류가 발생했습니다.`);
        console.log('백업 파일을 확인하시고 필요시 수동으로 처리해주세요.');
      }
    } else if (stats.questions.total === 0 && stats.leads.total === 0) {
      console.log('\nℹ️ 마이그레이션할 데이터가 없습니다.');
    } else {
      console.log('\n❌ 마이그레이션 실패');
      console.log('백업 파일을 확인하시고 오류를 해결한 후 다시 시도해주세요.');
    }

    console.log('\n============================================');
    console.log('\n다음 단계:');
    console.log('1. 웹사이트에서 질문 관리 페이지 (/admin/questions) 확인');
    console.log('2. 관리자 대시보드 (/admin) 에서 리드 확인');
    console.log('3. 챗봇이 정상 작동하는지 테스트');

  } catch (error) {
    console.error('\n❌ 마이그레이션 중 치명적 오류:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runMigration().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { runMigration as migrateToSupabase };