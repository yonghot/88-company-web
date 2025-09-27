import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(request: NextRequest) {
  try {
    const { questions } = await request.json();

    if (!questions || !Array.isArray(questions)) {
      return NextResponse.json(
        { error: '유효하지 않은 데이터 형식' },
        { status: 400 }
      );
    }

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase 설정이 없습니다' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 기존 데이터 삭제
    const { error: deleteError } = await supabase
      .from('chat_questions')
      .delete()
      .neq('step', '');

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json(
        { error: '기존 데이터 삭제 실패' },
        { status: 500 }
      );
    }

    // 새 데이터 삽입
    const { data, error: insertError } = await supabase
      .from('chat_questions')
      .insert(questions)
      .select();

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json(
        { error: '데이터 삽입 실패' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      recovered: data?.length || 0,
      message: `${data?.length || 0}개의 질문을 복구했습니다`
    });

  } catch (error) {
    console.error('Recovery error:', error);
    return NextResponse.json(
      { error: '복구 중 오류 발생' },
      { status: 500 }
    );
  }
}