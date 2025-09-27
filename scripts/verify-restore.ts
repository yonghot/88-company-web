#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!);

async function verify() {
  const { data } = await supabase
    .from('chat_questions')
    .select('step, question')
    .order('order_index')
    .limit(4);

  console.log('\n✅ 핵심 질문 4개 확인:\n');
  data?.forEach((q, i) => {
    console.log(`${i+1}. [${q.step}]`);
    console.log(`   ${q.question}\n`);
  });
}

verify();