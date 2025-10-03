import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tjizerpeyteokqhufqea.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqaXplcnBleXRlb2txaHVmcWVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2ODkxMTEsImV4cCI6MjA3MzI2NTExMX0.lpw_F9T7tML76NyCm1_6NJ6kyFdXtYsoUehK9ZhZT7s'
);

const { data, error } = await supabase
  .from('chat_questions')
  .select('*')
  .eq('type', 'phone')
  .single();

if (error) {
  console.log('Error:', error);
} else {
  console.log('Phone question:', data);
  console.log('Step ID will be: step_' + data.order_index);
}
