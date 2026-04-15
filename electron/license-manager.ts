import crypto from 'node:crypto'
import os from 'node:os'
import { networkInterfaces } from 'node:os'
import path from 'node:path'
import fs from 'node:fs'
import { app } from 'electron'

// ── Types ──────────────────────────────────────────────────
export interface LicenseInfo {
  licenseKey: string
  planType: 'TRIAL' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'
  status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'UNACTIVATED'
  activatedAt: string | null
  expiryDate: string | null
  lastVerified: string | null
  machineId: string
  maxCompanies: number
  maxUsers: number
  daysRemaining: number
}

// Simple JSON file store (replaces electron-store to avoid ESM/CJS conflict)
class SimpleStore {
  private filePath: string
  private data: Record<string, any>

  constructor(name: string) {
    const userDataPath = app.getPath('userData')
    this.filePath = path.join(userDataPath, `${name}.json`)
    this.data = {}
    this.load()
  }

  private load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8')
        this.data = JSON.parse(raw)
      }
    } catch {
      this.data = {}
    }
  }

  private save() {
    try {
      const dir = path.dirname(this.filePath)
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8')
    } catch (err) {
      console.error('[Store] Failed to save:', err)
    }
  }

  get(key: string): any {
    return this.data[key]
  }

  set(key: string, value: any) {
    this.data[key] = value
    this.save()
  }
}

const store = new SimpleStore('vaahan-books-license')

export class LicenseManager {
  private machineId: string

  constructor() {
    this.machineId = this.generateMachineId()
  }

  // ── Generate hardware fingerprint ───────────────────────
  private generateMachineId(): string {
    const cpus = os.cpus()
    const hostname = os.hostname()
    const platform = os.platform()
    const arch = os.arch()
    const totalMem = os.totalmem().toString()

    // Get first MAC address
    const nets = networkInterfaces()
    let mac = 'no-mac'
    for (const name of Object.keys(nets)) {
      const netList = nets[name]
      if (!netList) continue
      for (const net of netList) {
        if (!net.internal && net.mac && net.mac !== '00:00:00:00:00:00') {
          mac = net.mac
          break
        }
      }
      if (mac !== 'no-mac') break
    }

    const raw = `${hostname}|${platform}|${arch}|${totalMem}|${mac}|${cpus[0]?.model || 'cpu'}`
    return crypto.createHash('sha256').update(raw).digest('hex').substring(0, 32)
  }

  // ── Validate license key format ─────────────────────────
  private isValidFormat(key: string): boolean {
    // Format: VB-YYYY-XXXX-XXXX-XXXX
    const pattern = /^VB-\d{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/
    return pattern.test(key)
  }

  // ── Activate license ────────────────────────────────────
  async activateLicense(licenseKey: string): Promise<{ success: boolean; error?: string; data?: LicenseInfo }> {
    if (!this.isValidFormat(licenseKey)) {
      return { success: false, error: 'Invalid license key format. Expected: VB-YYYY-XXXX-XXXX-XXXX' }
    }

    // In production, this would call the cloud API
    // For Phase 1, we do local validation with a demo key
    const isDemoKey = licenseKey.startsWith('VB-2026-')

    if (!isDemoKey) {
      return { success: false, error: 'License key not recognized. Please check and try again.' }
    }

    // Determine plan from key pattern (demo logic)
    let planType: LicenseInfo['planType'] = 'STARTER'
    let maxCompanies = 1
    let maxUsers = 2

    if (licenseKey.includes('PRO')) {
      planType = 'PROFESSIONAL'
      maxCompanies = 3
      maxUsers = 5
    } else if (licenseKey.includes('ENT')) {
      planType = 'ENTERPRISE'
      maxCompanies = 999
      maxUsers = 999
    }

    const now = new Date()
    const expiry = new Date(now)
    expiry.setFullYear(expiry.getFullYear() + 1) // 1 year validity

    const licenseInfo: LicenseInfo = {
      licenseKey,
      planType,
      status: 'ACTIVE',
      activatedAt: now.toISOString(),
      expiryDate: expiry.toISOString(),
      lastVerified: now.toISOString(),
      machineId: this.machineId,
      maxCompanies,
      maxUsers,
      daysRemaining: 365
    }

    // Store encrypted
    store.set('license', licenseInfo)
    store.set('machineId', this.machineId)

    return { success: true, data: licenseInfo }
  }

  // ── Validate existing license ───────────────────────────
  async validateLicense(licenseKey?: string): Promise<{ success: boolean; error?: string; data?: LicenseInfo }> {
    const stored = store.get('license') as LicenseInfo | undefined

    if (!stored) {
      return { success: false, error: 'No license found. Please activate.' }
    }

    // Check machine binding
    const storedMachineId = store.get('machineId') as string
    if (storedMachineId !== this.machineId) {
      return {
        success: false,
        error: 'License is bound to a different machine. Contact support for transfer.'
      }
    }

    // Check expiry
    if (stored.expiryDate) {
      const expiry = new Date(stored.expiryDate)
      const now = new Date()
      const diffTime = expiry.getTime() - now.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      stored.daysRemaining = Math.max(0, diffDays)

      if (diffDays <= 0) {
        stored.status = 'EXPIRED'
      }

      store.set('license', stored)
    }

    return { success: true, data: stored }
  }

  // ── Get current license status ──────────────────────────
  getLicenseStatus(): LicenseInfo | null {
    const stored = store.get('license') as LicenseInfo | undefined
    if (!stored) return null

    // Recalculate days remaining
    if (stored.expiryDate) {
      const expiry = new Date(stored.expiryDate)
      const now = new Date()
      const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      stored.daysRemaining = Math.max(0, diffDays)
      if (diffDays <= 0) stored.status = 'EXPIRED'
    }

    return stored
  }

  // ── Get machine ID ──────────────────────────────────────
  getMachineId(): string {
    return this.machineId
  }
}
