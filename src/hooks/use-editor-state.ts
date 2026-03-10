import { useSyncExternalStore } from 'react'

interface CursorSnapshot {
  line: number
  col: number
}

const listeners = new Set<() => void>()
let cursorSnapshot: CursorSnapshot = { line: 1, col: 1 }

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => { listeners.delete(cb) }
}

function getSnapshot() {
  return cursorSnapshot
}

export function setCursorPosition(line: number, col: number) {
  if (cursorSnapshot.line === line && cursorSnapshot.col === col) return
  cursorSnapshot = { line, col }
  listeners.forEach((cb) => cb())
}

export function useCursor(): CursorSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot)
}
