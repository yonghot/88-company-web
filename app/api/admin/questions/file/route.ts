import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { cookies } from 'next/headers';

async function checkAdminAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('admin-auth');
  const adminPassword = process.env.ADMIN_PASSWORD || '159753';

  return authCookie?.value === adminPassword;
}

const QUESTIONS_FILE = path.join(process.cwd(), 'data', 'questions.json');

export async function GET() {
  try {
    const fileContent = await fs.readFile(QUESTIONS_FILE, 'utf-8');
    const data = JSON.parse(fileContent);
    return NextResponse.json(data);
  } catch {
    // 파일이 없으면 빈 데이터 반환
    return NextResponse.json({ questions: [], lastUpdated: null });
  }
}

export async function POST(request: NextRequest) {
  if (!(await checkAdminAuth())) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { questions } = body;

    const data = {
      questions: questions,
      lastUpdated: new Date().toISOString()
    };

    // data 디렉토리가 없으면 생성
    const dataDir = path.join(process.cwd(), 'data');
    try {
      await fs.access(dataDir);
    } catch {
      await fs.mkdir(dataDir, { recursive: true });
    }

    await fs.writeFile(QUESTIONS_FILE, JSON.stringify(data, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      message: 'Questions saved successfully'
    });
  } catch (error) {
    console.error('Error saving questions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save questions' },
      { status: 500 }
    );
  }
}