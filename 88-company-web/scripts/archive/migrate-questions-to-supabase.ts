#!/usr/bin/env node
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { ChatQuestion } from '../lib/chat/dynamic-types';

config({ path: path.join(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

interface MigrationResult {
  success: boolean;
  migratedCount: number;
  errors: string[];
  backup?: string;
}

async function loadLocalQuestions(): Promise<ChatQuestion[]> {
  const questionsPath = path.join(process.cwd(), 'data', 'questions.json');

  try {
    const data = await fs.readFile(questionsPath, 'utf-8');
    const parsed = JSON.parse(data);

    if (parsed.questions && Array.isArray(parsed.questions)) {
      return parsed.questions;
    }

    return [];
  } catch (error) {
    console.log('No local questions file found or error reading file');
    return [];
  }
}

async function createBackup(questions: ChatQuestion[]): Promise<string> {
  const backupDir = path.join(process.cwd(), 'data', 'backups');
  await fs.mkdir(backupDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `questions_backup_${timestamp}.json`);

  await fs.writeFile(
    backupPath,
    JSON.stringify({ questions, backupDate: new Date().toISOString() }, null, 2)
  );

  return backupPath;
}

async function migrateQuestionsToSupabase(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    migratedCount: 0,
    errors: []
  };

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    result.errors.push('Supabase 환경 변수가 설정되지 않았습니다.');
    console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
    console.log('다음 환경 변수를 .env.local 파일에 설정하세요:');
    console.log('  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
    console.log('  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key');
    return result;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    console.log('📂 로컬 질문 데이터 로드 중...');
    const localQuestions = await loadLocalQuestions();

    if (localQuestions.length === 0) {
      console.log('ℹ️ 마이그레이션할 로컬 질문이 없습니다.');
      result.success = true;
      return result;
    }

    console.log(`📋 ${localQuestions.length}개의 질문을 찾았습니다.`);

    console.log('💾 백업 생성 중...');
    const backupPath = await createBackup(localQuestions);
    result.backup = backupPath;
    console.log(`✅ 백업 완료: ${backupPath}`);

    console.log('🔍 기존 Supabase 질문 확인 중...');
    const { data: existingQuestions, error: fetchError } = await supabase
      .from('chat_questions')
      .select('step');

    if (fetchError) {
      result.errors.push(`Supabase 조회 실패: ${fetchError.message}`);
      console.error('❌ Supabase 조회 실패:', fetchError);
      return result;
    }

    const existingSteps = new Set(existingQuestions?.map(q => q.step) || []);

    console.log('📤 Supabase로 질문 마이그레이션 중...');
    for (const question of localQuestions) {
      try {
        if (existingSteps.has(question.step)) {
          const { error: updateError } = await supabase
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

          if (updateError) {
            result.errors.push(`질문 업데이트 실패 (${question.step}): ${updateError.message}`);
            console.error(`❌ 질문 업데이트 실패 (${question.step}):`, updateError);
          } else {
            result.migratedCount++;
            console.log(`✅ 업데이트: ${question.step}`);
          }
        } else {
          const { error: insertError } = await supabase
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

          if (insertError) {
            result.errors.push(`질문 삽입 실패 (${question.step}): ${insertError.message}`);
            console.error(`❌ 질문 삽입 실패 (${question.step}):`, insertError);
          } else {
            result.migratedCount++;
            console.log(`✅ 생성: ${question.step}`);
          }
        }
      } catch (error) {
        result.errors.push(`질문 처리 중 오류 (${question.step}): ${error}`);
        console.error(`❌ 질문 처리 중 오류 (${question.step}):`, error);
      }
    }

    result.success = result.migratedCount > 0;

    if (result.success) {
      console.log(`\n🎉 마이그레이션 완료!`);
      console.log(`✅ 성공적으로 마이그레이션된 질문: ${result.migratedCount}개`);
      if (result.errors.length > 0) {
        console.log(`⚠️ 오류가 발생한 질문: ${result.errors.length}개`);
      }
    }

  } catch (error) {
    result.errors.push(`마이그레이션 실패: ${error}`);
    console.error('❌ 마이그레이션 실패:', error);
  }

  return result;
}

if (require.main === module) {
  migrateQuestionsToSupabase()
    .then((result) => {
      if (!result.success && result.errors.length > 0) {
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { migrateQuestionsToSupabase };