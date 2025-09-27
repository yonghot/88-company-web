import { ChatQuestion } from './dynamic-types';

export class BackupService {
  private static instance: BackupService;
  private backupDir: string = '';
  private maxBackups: number = 10;

  private constructor() {
    if (typeof window === 'undefined') {
      const path = require('path');
      this.backupDir = path.join(process.cwd(), 'data', 'backups');
    }
  }

  static getInstance(): BackupService {
    if (!this.instance) {
      this.instance = new BackupService();
    }
    return this.instance;
  }

  async createBackup(questions: ChatQuestion[], source: string = 'manual'): Promise<string | null> {
    if (typeof window !== 'undefined') {
      console.log('[BackupService] Backup skipped in browser environment');
      return null;
    }

    try {
      const fs = require('fs/promises');
      const path = require('path');

      // 백업 디렉토리 생성
      await fs.mkdir(this.backupDir, { recursive: true });

      // 백업 파일 이름 생성
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `questions_backup_${source}_${timestamp}.json`;
      const filepath = path.join(this.backupDir, filename);

      // 백업 데이터 생성
      const backupData = {
        timestamp: new Date().toISOString(),
        source,
        questionsCount: questions.length,
        questions: questions
      };

      // 파일 저장
      await fs.writeFile(filepath, JSON.stringify(backupData, null, 2));
      console.log(`[BackupService] Backup created: ${filename}`);

      // 오래된 백업 정리
      await this.cleanOldBackups();

      return filepath;
    } catch (error) {
      console.error('[BackupService] Backup failed:', error);
      return null;
    }
  }

  async restoreLatestBackup(): Promise<ChatQuestion[] | null> {
    if (typeof window !== 'undefined') {
      console.log('[BackupService] Restore skipped in browser environment');
      return null;
    }

    try {
      const fs = require('fs/promises');
      const path = require('path');

      const backups = await this.listBackups();
      if (backups.length === 0) {
        console.log('[BackupService] No backups found');
        return null;
      }

      // 최신 백업 파일 읽기
      const latestBackup = backups[0];
      const filepath = path.join(this.backupDir, latestBackup);
      const content = await fs.readFile(filepath, 'utf-8');
      const backupData = JSON.parse(content);

      console.log(`[BackupService] Restored from: ${latestBackup}`);
      return backupData.questions;
    } catch (error) {
      console.error('[BackupService] Restore failed:', error);
      return null;
    }
  }

  async listBackups(): Promise<string[]> {
    if (typeof window !== 'undefined') {
      return [];
    }

    try {
      const fs = require('fs/promises');

      await fs.mkdir(this.backupDir, { recursive: true });
      const files = await fs.readdir(this.backupDir);

      // 백업 파일만 필터링하고 최신순으로 정렬
      const backupFiles = files
        .filter((f: string) => f.startsWith('questions_backup_') && f.endsWith('.json'))
        .sort((a: string, b: string) => b.localeCompare(a));

      return backupFiles;
    } catch (error) {
      console.error('[BackupService] List backups failed:', error);
      return [];
    }
  }

  private async cleanOldBackups(): Promise<void> {
    try {
      const fs = require('fs/promises');
      const path = require('path');

      const backups = await this.listBackups();

      // 최대 백업 수를 초과하면 오래된 백업 삭제
      if (backups.length > this.maxBackups) {
        const toDelete = backups.slice(this.maxBackups);

        for (const backup of toDelete) {
          const filepath = path.join(this.backupDir, backup);
          await fs.unlink(filepath);
          console.log(`[BackupService] Deleted old backup: ${backup}`);
        }
      }
    } catch (error) {
      console.error('[BackupService] Clean backups failed:', error);
    }
  }

  async getBackupInfo(filename: string): Promise<any | null> {
    if (typeof window !== 'undefined') {
      return null;
    }

    try {
      const fs = require('fs/promises');
      const path = require('path');

      const filepath = path.join(this.backupDir, filename);
      const content = await fs.readFile(filepath, 'utf-8');
      const backupData = JSON.parse(content);

      return {
        filename,
        timestamp: backupData.timestamp,
        source: backupData.source,
        questionsCount: backupData.questionsCount
      };
    } catch (error) {
      console.error('[BackupService] Get backup info failed:', error);
      return null;
    }
  }
}

export const backupService = BackupService.getInstance();