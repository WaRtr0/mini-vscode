import type { LanguageSupport } from '@codemirror/language'
import { javascript } from '@codemirror/lang-javascript'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { json } from '@codemirror/lang-json'
import { markdown } from '@codemirror/lang-markdown'
import { python } from '@codemirror/lang-python'

export interface LanguageOption {
  id: string
  label: string
  factory: () => LanguageSupport
}

export const LANGUAGES: LanguageOption[] = [
  { id: 'javascript', label: 'JavaScript', factory: () => javascript() },
  { id: 'jsx', label: 'JavaScript (JSX)', factory: () => javascript({ jsx: true }) },
  { id: 'typescript', label: 'TypeScript', factory: () => javascript({ typescript: true }) },
  { id: 'tsx', label: 'TypeScript (TSX)', factory: () => javascript({ jsx: true, typescript: true }) },
  { id: 'html', label: 'HTML', factory: () => html() },
  { id: 'css', label: 'CSS', factory: () => css() },
  { id: 'json', label: 'JSON', factory: () => json() },
  { id: 'markdown', label: 'Markdown', factory: () => markdown() },
  { id: 'python', label: 'Python', factory: () => python() },
  { id: 'plaintext', label: 'Plain Text', factory: null! },
]

const EXT_TO_LANG_ID: Record<string, string> = {
  js: 'javascript', mjs: 'javascript', cjs: 'javascript',
  jsx: 'jsx',
  ts: 'typescript', mts: 'typescript', cts: 'typescript',
  tsx: 'tsx',
  html: 'html', htm: 'html',
  css: 'css',
  json: 'json',
  md: 'markdown', markdown: 'markdown',
  py: 'python',
}

export function detectLanguageId(filename: string): string {
  const dot = filename.lastIndexOf('.')
  if (dot === -1) return 'plaintext'
  const ext = filename.slice(dot + 1).toLowerCase()
  return EXT_TO_LANG_ID[ext] ?? 'plaintext'
}

export function getLanguageById(id: string): LanguageOption | undefined {
  return LANGUAGES.find((l) => l.id === id)
}

export function detectLanguage(filename: string): LanguageSupport | null {
  const id = detectLanguageId(filename)
  const lang = getLanguageById(id)
  if (!lang || id === 'plaintext') return null
  return lang.factory()
}

export function getLanguageSupport(id: string): LanguageSupport | null {
  const lang = getLanguageById(id)
  if (!lang || id === 'plaintext') return null
  return lang.factory()
}

export function detectLanguageLabel(filename: string): string {
  const id = detectLanguageId(filename)
  return getLanguageById(id)?.label ?? 'Plain Text'
}

export function getLanguageLabel(id: string): string {
  return getLanguageById(id)?.label ?? 'Plain Text'
}
