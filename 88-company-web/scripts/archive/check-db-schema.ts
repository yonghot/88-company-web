import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local'), override: true });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
  console.log('🔍 Supabase leads 테이블 스키마 확인 중...\n');

  try {
    // Get one record to check columns
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ 테이블 조회 실패:', error.message);
      process.exit(1);
    }

    if (!data || data.length === 0) {
      console.log('⚠️ leads 테이블에 데이터가 없습니다.');
      console.log('   스키마를 확인하려면 최소 1개의 데이터가 필요합니다.');
      
      // Try to insert a test record to check schema
      console.log('\n🧪 테스트 데이터 삽입 시도...');
      const testData = {
        id: 'test-schema-check',
        welcome: 'test',
        experience: 'test',
        business_idea: 'test',
        region: 'test',
        gender: 'test',
        age: 'test',
        education: 'test education',
        occupation: 'test occupation',
        name: 'test name',
        phone: '01012345678',
        verified: true
      };

      const { data: insertData, error: insertError } = await supabase
        .from('leads')
        .insert([testData])
        .select();

      if (insertError) {
        console.error('❌ 테스트 데이터 삽입 실패:', insertError.message);
        console.log('\n📋 에러 분석:');
        if (insertError.message.includes('education')) {
          console.log('   → education 컬럼이 존재하지 않습니다!');
        }
        if (insertError.message.includes('occupation')) {
          console.log('   → occupation 컬럼이 존재하지 않습니다!');
        }
        console.log('\n✋ 수동 작업 필요: Supabase Dashboard에서 다음 SQL 실행');
        console.log('   ALTER TABLE leads ADD COLUMN IF NOT EXISTS education TEXT;');
        console.log('   ALTER TABLE leads ADD COLUMN IF NOT EXISTS occupation TEXT;');
        process.exit(1);
      }

      console.log('✅ 테스트 데이터 삽입 성공! 스키마 확인...');
      
      // Check inserted data
      const { data: checkData, error: checkError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', 'test-schema-check')
        .single();

      if (checkError) {
        console.error('❌ 확인 실패:', checkError.message);
        process.exit(1);
      }

      console.log('\n📊 테이블 컬럼 목록:');
      const columns = Object.keys(checkData);
      columns.forEach(col => {
        const value = checkData[col];
        console.log(`   - ${col}: ${typeof value} = ${value}`);
      });

      // Clean up test data
      await supabase.from('leads').delete().eq('id', 'test-schema-check');
      console.log('\n🧹 테스트 데이터 삭제 완료');

    } else {
      console.log('📊 현재 테이블 컬럼 목록:');
      const columns = Object.keys(data[0]);
      columns.forEach(col => console.log(`   - ${col}`));

      console.log('\n✅ 필수 컬럼 확인:');
      const hasEducation = columns.includes('education');
      const hasOccupation = columns.includes('occupation');
      const hasName = columns.includes('name');

      console.log(`   education: ${hasEducation ? '✅ 존재' : '❌ 없음'}`);
      console.log(`   occupation: ${hasOccupation ? '✅ 존재' : '❌ 없음'}`);
      console.log(`   name: ${hasName ? '✅ 존재' : '❌ 없음'}`);

      if (!hasEducation || !hasOccupation) {
        console.log('\n❌ 컬럼이 없습니다!');
        console.log('\n✋ 수동 작업 필요: Supabase Dashboard에서 다음 SQL 실행');
        console.log('   1. https://app.supabase.com → SQL Editor');
        console.log('   2. 다음 SQL 실행:');
        console.log('');
        console.log('      ALTER TABLE leads ADD COLUMN IF NOT EXISTS education TEXT;');
        console.log('      ALTER TABLE leads ADD COLUMN IF NOT EXISTS occupation TEXT;');
        console.log('');
        process.exit(1);
      }

      console.log('\n✅ 스키마 정상! 모든 필수 컬럼이 존재합니다.');
    }
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

checkSchema();
