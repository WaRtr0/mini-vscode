import type { WorkspaceAdapter } from '@/lib/workspace-adapter'

export interface FileNode {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: FileNode[]
}

export interface OpenFile {
  path: string
  content: string
  isDirty: boolean
  languageId?: string | null
}

export type EditorMode = 'local' | 'draft'

export interface SearchMatch {
  path: string
  line: number
  col: number
  text: string
}

export interface WorkspaceState {
  adapter: WorkspaceAdapter | null
  fileTree: FileNode[]
  openFiles: OpenFile[]
  activeFilePath: string | null
  tabSize: number
  insertSpaces: boolean
}
