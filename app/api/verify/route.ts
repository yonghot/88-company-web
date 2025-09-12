import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import fs from 'fs/promises';
import path from 'path';

// In-memory storage for development/fallback
const VERIFICATION_CODES = new Map<string, { code: string; expiry: number }>();
const LEADS_FILE = path.join(process.cwd(), 'data', 'leads.json');

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  return process.env.NEXT_PUBLIC_SUPABASE_URL && 
         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
         !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your_supabase');
};

// Helper function to generate a 6-digit verification code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper function to check if phone number already exists (file system)
async function phoneNumberExistsInFile(phone: string): Promise<boolean> {
  try {
    const data = await fs.readFile(LEADS_FILE, 'utf-8');
    const leads = JSON.parse(data);
    return leads.some((lead: any) => lead.id === phone);
  } catch (error) {
    return false;
  }
}

// POST /api/verify - Send verification code
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, phone, code } = body;

    // Normalize phone number (remove dashes)
    const normalizedPhone = phone?.replace(/-/g, '');

    if (action === 'send') {
      if (isSupabaseConfigured()) {
        // Check if phone number already exists in Supabase
        const { data: existingLeads } = await supabase
          .from('leads')
          .select('id')
          .eq('id', normalizedPhone);

        if (existingLeads && existingLeads.length > 0) {
          return NextResponse.json(
            { error: '이미 등록된 휴대폰 번호입니다.' },
            { status: 400 }
          );
        }

        // Generate and store verification code in Supabase
        const verificationCode = generateVerificationCode();
        const expiresAt = new Date(Date.now() + 3 * 60 * 1000); // 3 minutes

        // Clean up old codes for this phone number
        await supabase
          .from('verification_codes')
          .delete()
          .eq('phone', normalizedPhone);

        // Insert new verification code
        const { error } = await supabase
          .from('verification_codes')
          .insert([{
            phone: normalizedPhone,
            code: verificationCode,
            expires_at: expiresAt.toISOString()
          }]);

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }

        console.log(`[DEMO] Verification code for ${phone}: ${verificationCode}`);

        return NextResponse.json({ 
          success: true,
          message: '인증번호가 발송되었습니다.',
          demoCode: process.env.NODE_ENV === 'development' ? verificationCode : undefined
        });
      } else {
        // Fallback to file system and in-memory storage
        const exists = await phoneNumberExistsInFile(normalizedPhone);
        if (exists) {
          return NextResponse.json(
            { error: '이미 등록된 휴대폰 번호입니다.' },
            { status: 400 }
          );
        }

        const verificationCode = generateVerificationCode();
        const expiry = Date.now() + 3 * 60 * 1000;
        
        VERIFICATION_CODES.set(normalizedPhone, { code: verificationCode, expiry });
        console.log(`[DEMO] Verification code for ${phone}: ${verificationCode}`);

        return NextResponse.json({ 
          success: true,
          message: '인증번호가 발송되었습니다.',
          demoCode: process.env.NODE_ENV === 'development' ? verificationCode : undefined
        });
      }
    }

    if (action === 'verify') {
      if (isSupabaseConfigured()) {
        // Get verification code from Supabase
        const { data: codes, error } = await supabase
          .from('verification_codes')
          .select('*')
          .eq('phone', normalizedPhone)
          .order('created_at', { ascending: false })
          .limit(1);

        if (error || !codes || codes.length === 0) {
          return NextResponse.json(
            { error: '인증번호를 먼저 요청해주세요.' },
            { status: 400 }
          );
        }

        const storedCode = codes[0];
        
        // Check if code has expired
        if (new Date() > new Date(storedCode.expires_at)) {
          // Delete expired code
          await supabase
            .from('verification_codes')
            .delete()
            .eq('id', storedCode.id);

          return NextResponse.json(
            { error: '인증번호가 만료되었습니다. 다시 요청해주세요.' },
            { status: 400 }
          );
        }

        // Verify the code
        if (storedCode.code !== code) {
          return NextResponse.json(
            { error: '인증번호가 일치하지 않습니다.' },
            { status: 400 }
          );
        }

        // Code is valid - delete it
        await supabase
          .from('verification_codes')
          .delete()
          .eq('id', storedCode.id);

        return NextResponse.json({ 
          success: true,
          verified: true,
          message: '인증이 완료되었습니다.'
        });
      } else {
        // Fallback to in-memory storage
        const storedData = VERIFICATION_CODES.get(normalizedPhone);

        if (!storedData) {
          return NextResponse.json(
            { error: '인증번호를 먼저 요청해주세요.' },
            { status: 400 }
          );
        }

        if (Date.now() > storedData.expiry) {
          VERIFICATION_CODES.delete(normalizedPhone);
          return NextResponse.json(
            { error: '인증번호가 만료되었습니다. 다시 요청해주세요.' },
            { status: 400 }
          );
        }

        if (storedData.code !== code) {
          return NextResponse.json(
            { error: '인증번호가 일치하지 않습니다.' },
            { status: 400 }
          );
        }

        VERIFICATION_CODES.delete(normalizedPhone);
        return NextResponse.json({ 
          success: true,
          verified: true,
          message: '인증이 완료되었습니다.'
        });
      }
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}