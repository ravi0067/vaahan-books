import { useEffect, useCallback, useRef } from 'react'

export interface ShortcutHandler {
  key: string
  alt?: boolean
  ctrl?: boolean
  shift?: boolean
  handler: () => void
  description?: string
  context?: string
}

/**
 * Global keyboard shortcut manager for Tally-style keyboard-first navigation.
 * Handles F-keys, Alt+key combos, and single-key shortcuts.
 */
export function useKeyboardShortcuts(shortcuts: ShortcutHandler[], enabled = true) {
  const handlersRef = useRef(shortcuts)
  handlersRef.current = shortcuts

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return

    // Don't capture when typing in input/textarea/select
    const target = e.target as HTMLElement
    const isInputFocused = 
      target.tagName === 'INPUT' || 
      target.tagName === 'TEXTAREA' || 
      target.tagName === 'SELECT' ||
      target.isContentEditable

    for (const shortcut of handlersRef.current) {
      const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase() ||
                       e.code.toLowerCase() === shortcut.key.toLowerCase()
      
      const altMatch = !!shortcut.alt === e.altKey
      const ctrlMatch = !!shortcut.ctrl === (e.ctrlKey || e.metaKey)
      const shiftMatch = !!shortcut.shift === e.shiftKey

      if (keyMatch && altMatch && ctrlMatch && shiftMatch) {
        // Allow F-keys and Alt/Ctrl combos even when input is focused
        const isFKey = e.key.startsWith('F') && e.key.length <= 3
        const hasModifier = shortcut.alt || shortcut.ctrl

        if (isInputFocused && !isFKey && !hasModifier) {
          continue // Skip single-key shortcuts when typing
        }

        e.preventDefault()
        e.stopPropagation()
        shortcut.handler()
        return
      }
    }
  }, [enabled])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [handleKeyDown])
}

/**
 * Parses a shortcut string like "Alt+G" into ShortcutHandler parts
 */
export function parseShortcut(shortcutStr: string): Partial<ShortcutHandler> {
  const parts = shortcutStr.split('+')
  const result: Partial<ShortcutHandler> = {}
  
  for (const part of parts) {
    const lower = part.toLowerCase().trim()
    if (lower === 'alt') result.alt = true
    else if (lower === 'ctrl' || lower === 'control') result.ctrl = true
    else if (lower === 'shift') result.shift = true
    else result.key = part.trim()
  }
  
  return result
}
