import { contextBridge, ipcRenderer } from 'electron'

// ── Expose secure API to renderer process ──────────────────
contextBridge.exposeInMainWorld('electronAPI', {
  // License
  license: {
    validate: (key: string) => ipcRenderer.invoke('license:validate', key),
    getStatus: () => ipcRenderer.invoke('license:getStatus'),
    activate: (key: string) => ipcRenderer.invoke('license:activate', key),
  },

  // Database
  db: {
    execute: (sql: string, params: any[] = []) => ipcRenderer.invoke('db:execute', sql, params),
    getAll: (sql: string, params: any[] = []) => ipcRenderer.invoke('db:getAll', sql, params),
    run: (sql: string, params: any[] = []) => ipcRenderer.invoke('db:run', sql, params),
  },

  // Company
  company: {
    create: (data: any) => ipcRenderer.invoke('company:create', data),
    getAll: () => ipcRenderer.invoke('company:getAll'),
    getDefault: () => ipcRenderer.invoke('company:getDefault'),
    seedAccounts: (companyId: string) => ipcRenderer.invoke('company:seedAccounts', companyId),
  },

  // Backup
  backup: {
    create: () => ipcRenderer.invoke('backup:create'),
    getHistory: () => ipcRenderer.invoke('backup:getHistory'),
  },

  // System
  system: {
    openExternal: (url: string) => ipcRenderer.invoke('system:openExternal', url),
    getAppVersion: () => ipcRenderer.invoke('system:getAppVersion'),
    getDataPath: () => ipcRenderer.invoke('system:getDataPath'),
  }
})
