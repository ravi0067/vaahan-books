import { app } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import { getDatabasePath, getDatabase } from './database/sqlite'

const BACKUP_DIR = path.join(app.getPath('userData'), 'backups')
const MAX_BACKUPS = 30 // Keep last 30 daily backups

export class BackupManager {
  constructor() {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true })
    }
  }

  // ── Create a backup ─────────────────────────────────────
  async createBackup(customPath?: string): Promise<{ success: boolean; path?: string; error?: string }> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
      const backupFileName = `vaahanbooks-backup-${timestamp}.vbak`
      const backupPath = customPath || path.join(BACKUP_DIR, backupFileName)

      const dbPath = getDatabasePath()

      // Ensure target directory exists
      const dir = path.dirname(backupPath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }

      // Use SQLite backup API for safe copy
      const db = getDatabase()
      await db.backup(backupPath)

      // Get file size
      const stats = fs.statSync(backupPath)
      const sizeBytes = stats.size

      // Log backup in database
      const id = `bak_${Date.now()}`
      db.prepare(`
        INSERT INTO BackupLog (id, backupPath, sizeBytes, status)
        VALUES (?, ?, ?, 'SUCCESS')
      `).run(id, backupPath, sizeBytes)

      // Cleanup old backups
      this.cleanupOldBackups()

      console.log(`[Backup] Created: ${backupPath} (${(sizeBytes / 1024).toFixed(1)} KB)`)
      return { success: true, path: backupPath }
    } catch (error: any) {
      console.error('[Backup] Failed:', error.message)

      try {
        const db = getDatabase()
        db.prepare(`
          INSERT INTO BackupLog (id, backupPath, sizeBytes, status)
          VALUES (?, ?, 0, 'FAILED')
        `).run(`bak_${Date.now()}`, 'FAILED')
      } catch { }

      return { success: false, error: error.message }
    }
  }

  // ── Get backup history ──────────────────────────────────
  getBackupHistory(): any[] {
    try {
      const db = getDatabase()
      return db.prepare('SELECT * FROM BackupLog ORDER BY createdAt DESC LIMIT 50').all()
    } catch {
      return []
    }
  }

  // ── Schedule daily backup ───────────────────────────────
  scheduleDailyBackup() {
    // Run backup every 24 hours
    setInterval(async () => {
      console.log('[Backup] Running scheduled daily backup...')
      await this.createBackup()
    }, 24 * 60 * 60 * 1000) // 24 hours

    // Also run one backup on startup (delayed by 30 seconds)
    setTimeout(async () => {
      const lastBackup = this.getLastBackupTime()
      const hoursSinceLastBackup = lastBackup
        ? (Date.now() - new Date(lastBackup).getTime()) / (1000 * 60 * 60)
        : 999

      if (hoursSinceLastBackup > 20) { // Only if > 20 hours since last backup
        console.log('[Backup] No recent backup found. Creating startup backup...')
        await this.createBackup()
      }
    }, 30000)
  }

  // ── Get last backup time ────────────────────────────────
  private getLastBackupTime(): string | null {
    try {
      const db = getDatabase()
      const result = db.prepare(
        "SELECT createdAt FROM BackupLog WHERE status = 'SUCCESS' ORDER BY createdAt DESC LIMIT 1"
      ).get() as any
      return result?.createdAt || null
    } catch {
      return null
    }
  }

  // ── Cleanup old backups ─────────────────────────────────
  private cleanupOldBackups() {
    try {
      const files = fs.readdirSync(BACKUP_DIR)
        .filter(f => f.endsWith('.vbak'))
        .map(f => ({
          name: f,
          path: path.join(BACKUP_DIR, f),
          time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time) // newest first

      // Delete files beyond MAX_BACKUPS
      for (let i = MAX_BACKUPS; i < files.length; i++) {
        fs.unlinkSync(files[i].path)
        console.log(`[Backup] Cleaned old backup: ${files[i].name}`)
      }
    } catch (error) {
      console.error('[Backup] Cleanup error:', error)
    }
  }
}
