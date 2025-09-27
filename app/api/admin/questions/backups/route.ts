import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { backupService } from '@/lib/chat/backup-service';

async function checkAdminAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('admin-auth');
  const adminPassword = process.env.ADMIN_PASSWORD || '159753';

  return authCookie?.value === adminPassword;
}

export async function GET() {
  if (!(await checkAdminAuth())) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const backups = await backupService.listBackups();
    const backupInfos = [];

    for (const backup of backups.slice(0, 10)) {
      const info = await backupService.getBackupInfo(backup);
      if (info) {
        backupInfos.push(info);
      }
    }

    return NextResponse.json({
      success: true,
      data: backupInfos
    });
  } catch (error) {
    console.error('Error listing backups:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to list backups' },
      { status: 500 }
    );
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
    const { action, questions } = body;

    if (action === 'create') {
      const filepath = await backupService.createBackup(questions, 'manual');

      return NextResponse.json({
        success: true,
        message: 'Backup created successfully',
        filepath
      });
    } else if (action === 'restore') {
      const restoredQuestions = await backupService.restoreLatestBackup();

      if (!restoredQuestions) {
        return NextResponse.json(
          { success: false, error: 'No backup to restore' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: restoredQuestions
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error handling backup:', error);
    return NextResponse.json(
      { success: false, error: 'Backup operation failed' },
      { status: 500 }
    );
  }
}