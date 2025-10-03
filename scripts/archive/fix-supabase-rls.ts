import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import chalk from 'chalk';

// 환경 변수 로드
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(chalk.red('❌ Supabase 환경 변수가 설정되지 않았습니다'));
  console.log(chalk.yellow(`
필요한 환경 변수:
- NEXT_PUBLIC_SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY (또는 NEXT_PUBLIC_SUPABASE_ANON_KEY)

Supabase 대시보드에서 SQL Editor를 사용하여 다음 명령을 실행하세요:

${chalk.cyan(`
-- verification_codes 테이블의 RLS 비활성화
ALTER TABLE verification_codes DISABLE ROW LEVEL SECURITY;

-- leads 테이블의 RLS 비활성화
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;

-- chat_questions 테이블의 RLS 비활성화
ALTER TABLE chat_questions DISABLE ROW LEVEL SECURITY;
`)}
  `));
  process.exit(1);
}

async function fixRLS() {
  console.log(chalk.cyan.bold('🔧 Supabase RLS 정책 수정'));
  console.log(chalk.gray('='.repeat(60)));

  const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

  console.log(chalk.yellow('\n📝 RLS 정책 수정 중...'));
  console.log(chalk.gray('Supabase 대시보드의 SQL Editor에서 다음 SQL을 실행하세요:'));

  const sql = `
-- verification_codes 테이블의 RLS 비활성화
ALTER TABLE verification_codes DISABLE ROW LEVEL SECURITY;

-- leads 테이블의 RLS 비활성화
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;

-- chat_questions 테이블의 RLS 비활성화
ALTER TABLE chat_questions DISABLE ROW LEVEL SECURITY;
`;

  console.log(chalk.cyan(sql));

  console.log(chalk.yellow('\n또는 다음 방법으로 RLS 정책을 추가할 수 있습니다:'));

  const policySQL = `
-- RLS를 활성화하되 익명 사용자에게 권한 부여
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

-- 익명 사용자에게 모든 권한 부여
CREATE POLICY "Allow all for anon" ON verification_codes
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);
`;

  console.log(chalk.gray(policySQL));

  console.log(chalk.green('\n✅ SQL 명령을 Supabase 대시보드에서 실행해주세요'));
  console.log(chalk.blue('URL: ' + supabaseUrl!.replace('/rest/v1', '')));
  console.log(chalk.gray('SQL Editor → New Query → 위 SQL 붙여넣기 → Run'));
}

fixRLS().catch(console.error);