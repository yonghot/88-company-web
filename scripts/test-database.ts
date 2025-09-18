import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export async function testDatabase() {
  const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL &&
                      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (hasSupabase) {
    console.log('✅ Supabase configuration detected');
    console.log('   URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  } else {
    console.log('⚠️  No Supabase configuration');
    console.log('   Using file system storage');
  }

  const dataDir = join(process.cwd(), 'data');
  const leadsFile = join(dataDir, 'leads.json');

  console.log('\nFile System Storage:');
  console.log(`  Data directory: ${dataDir}`);
  console.log(`  Leads file: ${existsSync(leadsFile) ? 'exists' : 'not found'}`);

  if (existsSync(leadsFile)) {
    const content = readFileSync(leadsFile, 'utf-8');
    const leads = JSON.parse(content);
    console.log(`  Lead count: ${leads.length}`);
  }

  return { hasSupabase, fileSystemReady: existsSync(dataDir) };
}