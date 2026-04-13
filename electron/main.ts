import { app, BrowserWindow, ipcMain, shell } from 'electron'
import path from 'node:path'
import { initDatabase, getDatabase } from './database/sqlite'
import { LicenseManager } from './license-manager'
import { BackupManager } from './backup-manager'

import fs from 'node:fs'

// Disable GPU acceleration for stability
app.disableHardwareAcceleration()

let mainWindow: BrowserWindow | null = null
let licenseManager: LicenseManager
let backupManager: BackupManager

const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL
const isDev = !!VITE_DEV_SERVER_URL

function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.js').replace('app.asar', 'app.asar.unpacked')
  
  // FIX 2: Preload existence check
  if (!fs.existsSync(preloadPath)) {
    console.error('❌ Preload file not found:', preloadPath)
  }

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'VaahanBooks',
    icon: path.join(__dirname, '../public/icon.png'),
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    frame: true,
    titleBarStyle: 'default',
    backgroundColor: '#0f172a',
    show: false
  })

  // Show window when ready (avoids flash)
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  // FIX 4: Production safe loading
  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html')

    if (!fs.existsSync(indexPath)) {
      console.error('❌ index.html not found:', indexPath)
      // Fallback for some build structures
      const fallbackPath = path.join(__dirname, 'index.html')
      if (fs.existsSync(fallbackPath)) {
        mainWindow.loadFile(fallbackPath)
      }
    } else {
      mainWindow.loadFile(indexPath)
    }
  }

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// ── App lifecycle ──────────────────────────────────────────
app.whenReady().then(async () => {
  // Initialize local database
  initDatabase()

  // Initialize managers
  licenseManager = new LicenseManager()
  backupManager = new BackupManager()

  // Schedule daily backup
  backupManager.scheduleDailyBackup()

  // Register IPC handlers
  registerIpcHandlers()

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// ── IPC Handlers ──────────────────────────────────────────
function registerIpcHandlers() {
  // ── License ──
  ipcMain.handle('license:validate', async (_event, licenseKey: string) => {
    return await licenseManager.validateLicense(licenseKey)
  })

  ipcMain.handle('license:getStatus', async () => {
    return licenseManager.getLicenseStatus()
  })

  ipcMain.handle('license:activate', async (_event, licenseKey: string) => {
    return await licenseManager.activateLicense(licenseKey)
  })

  // ── Database Operations ──
  ipcMain.handle('db:execute', async (_event, sql: string, params: any[]) => {
    const db = getDatabase()
    try {
      const stmt = db.prepare(sql)
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        return { success: true, data: stmt.all(...params) }
      } else {
        const result = stmt.run(...params)
        return { success: true, data: result }
      }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('db:getAll', async (_event, sql: string, params: any[] = []) => {
    const db = getDatabase()
    try {
      const stmt = db.prepare(sql)
      return { success: true, data: stmt.all(...params) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('db:run', async (_event, sql: string, params: any[] = []) => {
    const db = getDatabase()
    try {
      const stmt = db.prepare(sql)
      const result = stmt.run(...params)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // ── Company Management ──
  ipcMain.handle('company:create', async (_event, data: any) => {
    const db = getDatabase()
    try {
      const id = `comp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      const stmt = db.prepare(`
        INSERT INTO Company (id, name, tradeName, gstin, panNumber, tanNumber,
          address, city, state, stateCode, pincode, phone, email, website,
          financialYearStart, bookStartDate, isDefault, isActive, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))
      `)
      stmt.run(
        id, data.name, data.tradeName || '', data.gstin || '', data.panNumber || '',
        data.tanNumber || '', data.address || '', data.city || '', data.state || '',
        data.stateCode || '', data.pincode || '', data.phone || '', data.email || '',
        data.website || '', data.financialYearStart || 4, data.bookStartDate || new Date().toISOString().split('T')[0],
        data.isDefault ? 1 : 0
      )
      return { success: true, data: { id } }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('company:getAll', async () => {
    const db = getDatabase()
    try {
      const companies = db.prepare('SELECT * FROM Company WHERE isActive = 1 ORDER BY isDefault DESC, name ASC').all()
      return { success: true, data: companies }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('company:getDefault', async () => {
    const db = getDatabase()
    try {
      const company = db.prepare('SELECT * FROM Company WHERE isDefault = 1 AND isActive = 1').get()
      return { success: true, data: company }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // ── Backup ──
  ipcMain.handle('backup:create', async () => {
    return await backupManager.createBackup()
  })

  ipcMain.handle('backup:getHistory', async () => {
    return backupManager.getBackupHistory()
  })

  // ── System ──
  ipcMain.handle('system:openExternal', async (_event, url: string) => {
    shell.openExternal(url)
  })

  ipcMain.handle('system:getAppVersion', async () => {
    return app.getVersion()
  })

  ipcMain.handle('system:getDataPath', async () => {
    return app.getPath('userData')
  })
}
