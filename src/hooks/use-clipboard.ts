import { useSyncExternalStore } from 'react'

interface ClipboardEntry {
  paths: string[]
  operation: 'copy' | 'cut'
}

const listeners = new Set<() => void>()
let clipboardSnapshot: ClipboardEntry | null = null

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => { listeners.delete(cb) }
}

function getSnapshot() {
  return clipboardSnapshot
}

function notify() {
  listeners.forEach((cb) => cb())
}

export function setClipboard(paths: string[], operation: 'copy' | 'cut') {
  clipboardSnapshot = { paths, operation }
  notify()
}

export function clearClipboard() {
  if (!clipboardSnapshot) return
  clipboardSnapshot = null
  notify()
}

export function useClipboard(): ClipboardEntry | null {
  return useSyncExternalStore(subscribe, getSnapshot)
}
