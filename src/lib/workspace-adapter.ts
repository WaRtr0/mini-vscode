import { FsBrowserSide } from 'fs-browser-side'
import JSZip from 'jszip'
import type { FileNode, EditorMode, SearchMatch } from '@/types'

export const supportsDirectoryPicker = 'showDirectoryPicker' in window

export interface WorkspaceAdapter {
  openDirectory(): Promise<boolean>
  listDir(path: string): Promise<FileNode[]>
  readFile(path: string): Promise<string>
  saveFile(path: string, content: string): Promise<void>
  createFile(path: string): Promise<void>
  createDir(path: string): Promise<void>
  deleteItem(path: string, recursive?: boolean): Promise<void>
  renameItem(oldPath: string, newPath: string): Promise<void>
  copyItem(srcPath: string, destPath: string): Promise<void>
  moveItem(srcPath: string, destPath: string): Promise<void>
  syncToDisk(): Promise<void>
  downloadZip(): Promise<Blob>
  searchInFiles(query: string): AsyncGenerator<SearchMatch>
  readonly mode: EditorMode
  readonly canSyncToDisk: boolean
  readonly dirtyPaths: Set<string>
}

const SKIP_DIRS = new Set([
  'node_modules', '.git', '.next', '.cache', '__pycache__',
  '.svn', '.hg', '.turbo', '.vercel', '.output',
])
const SKIP_FILES = new Set(['.DS_Store', 'Thumbs.db'])

const BINARY_EXTS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'bmp', 'svg',
  'woff', 'woff2', 'ttf', 'eot', 'otf',
  'mp3', 'mp4', 'wav', 'ogg', 'webm',
  'zip', 'tar', 'gz', 'rar', '7z',
  'pdf', 'doc', 'docx', 'xls', 'xlsx',
  'exe', 'dll', 'so', 'dylib', 'o', 'a',
  'lock',
])

function isBinary(name: string): boolean {
  const dot = name.lastIndexOf('.')
  if (dot === -1) return false
  return BINARY_EXTS.has(name.slice(dot + 1).toLowerCase())
}

async function buildTree(fs: FsBrowserSide, dirPath: string): Promise<FileNode[]> {
  const entries = await fs.readdir(dirPath)

  entries.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1
    return a.name.localeCompare(b.name)
  })

  const nodes: FileNode[] = []

  for (const entry of entries) {
    if (entry.type === 'directory' && SKIP_DIRS.has(entry.name)) continue
    if (entry.type === 'file' && SKIP_FILES.has(entry.name)) continue

    const node: FileNode = {
      name: entry.name,
      path: entry.path,
      type: entry.type,
    }

    if (entry.type === 'directory') {
      node.children = await buildTree(fs, entry.path)
    }

    nodes.push(node)
  }

  return nodes
}

async function collectAllFiles(
  fs: FsBrowserSide,
  dirPath: string,
): Promise<string[]> {
  const paths: string[] = []
  const entries = await fs.readdir(dirPath)
  for (const entry of entries) {
    if (entry.type === 'directory' && SKIP_DIRS.has(entry.name)) continue
    if (entry.type === 'file' && SKIP_FILES.has(entry.name)) continue
    if (entry.type === 'directory') {
      const sub = await collectAllFiles(fs, entry.path)
      paths.push(...sub)
    } else {
      paths.push(entry.path)
    }
  }
  return paths
}

async function copyTreeWithFs(
  fs: FsBrowserSide,
  srcPath: string,
  destPath: string,
): Promise<void> {
  let entries: { name: string; type: string; path: string }[]
  try {
    entries = await fs.readdir(srcPath)
  } catch {
    await fs.copyFile(srcPath, destPath)
    return
  }
  await fs.mkdir(destPath, { recursive: true })
  for (const entry of entries) {
    const destChild = destPath + '/' + entry.name
    if (entry.type === 'directory') {
      await copyTreeWithFs(fs, entry.path, destChild)
    } else {
      await fs.copyFile(entry.path, destChild)
    }
  }
}

async function* searchFiles(
  fs: FsBrowserSide,
  dirPath: string,
  query: string,
): AsyncGenerator<SearchMatch> {
  const lower = query.toLowerCase()
  const entries = await fs.readdir(dirPath)

  for (const entry of entries) {
    if (entry.type === 'directory' && SKIP_DIRS.has(entry.name)) continue
    if (entry.type === 'file' && SKIP_FILES.has(entry.name)) continue

    if (entry.type === 'directory') {
      yield* searchFiles(fs, entry.path, query)
    } else if (!isBinary(entry.name)) {
      let text: string
      try {
        text = await fs.readFileText(entry.path)
      } catch {
        continue
      }
      const lines = text.split('\n')
      for (let i = 0; i < lines.length; i++) {
        const idx = lines[i].toLowerCase().indexOf(lower)
        if (idx !== -1) {
          yield {
            path: entry.path,
            line: i + 1,
            col: idx + 1,
            text: lines[i],
          }
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// LocalAdapter
// ---------------------------------------------------------------------------

export class LocalAdapter implements WorkspaceAdapter {
  readonly mode: EditorMode = 'local'
  readonly canSyncToDisk = false
  readonly dirtyPaths = new Set<string>()
  private fs: FsBrowserSide

  constructor(handle: FileSystemDirectoryHandle) {
    this.fs = new FsBrowserSide({ rootHandle: handle })
  }

  async openDirectory(): Promise<boolean> {
    return this.fs.getAccess()
  }

  async listDir(path: string): Promise<FileNode[]> {
    return buildTree(this.fs, path)
  }

  async readFile(path: string): Promise<string> {
    return this.fs.readFileText(path)
  }

  async saveFile(path: string, content: string): Promise<void> {
    await this.fs.writeFileText(path, content)
  }

  async createFile(path: string): Promise<void> {
    await this.fs.writeFileText(path, '')
  }

  async createDir(path: string): Promise<void> {
    await this.fs.mkdir(path, { recursive: true })
  }

  async deleteItem(path: string, recursive = false): Promise<void> {
    await this.fs.rm(path, { recursive })
  }

  async renameItem(oldPath: string, newPath: string): Promise<void> {
    await copyTreeWithFs(this.fs, oldPath, newPath)
    await this.fs.rm(oldPath, { recursive: true })
  }

  async copyItem(srcPath: string, destPath: string): Promise<void> {
    await copyTreeWithFs(this.fs, srcPath, destPath)
  }

  async moveItem(srcPath: string, destPath: string): Promise<void> {
    await copyTreeWithFs(this.fs, srcPath, destPath)
    await this.fs.rm(srcPath, { recursive: true })
  }

  async syncToDisk(): Promise<void> {}

  async downloadZip(): Promise<Blob> {
    const zip = new JSZip()
    const files = await collectAllFiles(this.fs, '/')
    for (const filePath of files) {
      const buf = await this.fs.readFile(filePath)
      zip.file(filePath.slice(1), buf)
    }
    return zip.generateAsync({ type: 'blob' })
  }

  async *searchInFiles(query: string): AsyncGenerator<SearchMatch> {
    yield* searchFiles(this.fs, '/', query)
  }
}

// ---------------------------------------------------------------------------
// OpfsAdapter
// ---------------------------------------------------------------------------

export class OpfsAdapter implements WorkspaceAdapter {
  readonly mode: EditorMode = 'draft'
  readonly canSyncToDisk: boolean
  readonly dirtyPaths = new Set<string>()
  private opfs: FsBrowserSide
  private localFs: FsBrowserSide | null = null

  constructor(localHandle?: FileSystemDirectoryHandle) {
    this.opfs = new FsBrowserSide({ navigatorMode: true })
    this.canSyncToDisk = localHandle != null
    if (localHandle) {
      this.localFs = new FsBrowserSide({ rootHandle: localHandle })
    }
  }

  async openDirectory(): Promise<boolean> {
    return this.opfs.getAccess()
  }

  async initFromHandle(handle: FileSystemDirectoryHandle): Promise<void> {
    await this.opfs.clear()
    const source = new FsBrowserSide({ rootHandle: handle })
    await this.copyTree(source, '/')
  }

  async initFromFiles(files: File[]): Promise<void> {
    await this.opfs.clear()
    for (const file of files) {
      const rel = file.webkitRelativePath || file.name
      const parts = rel.split('/')
      const stripped = parts.length > 1 ? parts.slice(1) : parts
      const filePath = '/' + stripped.join('/')

      if (stripped.length > 1) {
        const dirPath = '/' + stripped.slice(0, -1).join('/')
        await this.opfs.mkdir(dirPath, { recursive: true })
      }

      const buf = await file.arrayBuffer()
      await this.opfs.writeFile(filePath, buf)
    }
  }

  private async copyTree(source: FsBrowserSide, dirPath: string): Promise<void> {
    const entries = await source.readdir(dirPath)
    for (const entry of entries) {
      if (entry.type === 'directory' && SKIP_DIRS.has(entry.name)) continue
      if (entry.type === 'file' && SKIP_FILES.has(entry.name)) continue

      if (entry.type === 'directory') {
        await this.opfs.mkdir(entry.path, { recursive: true })
        await this.copyTree(source, entry.path)
      } else {
        const buf = await source.readFile(entry.path)
        await this.opfs.writeFile(entry.path, buf)
      }
    }
  }

  async listDir(path: string): Promise<FileNode[]> {
    return buildTree(this.opfs, path)
  }

  async readFile(path: string): Promise<string> {
    return this.opfs.readFileText(path)
  }

  async saveFile(path: string, content: string): Promise<void> {
    await this.opfs.writeFileText(path, content)
    this.dirtyPaths.add(path)
  }

  async createFile(path: string): Promise<void> {
    await this.opfs.writeFileText(path, '')
    this.dirtyPaths.add(path)
  }

  async createDir(path: string): Promise<void> {
    await this.opfs.mkdir(path, { recursive: true })
  }

  async deleteItem(path: string, recursive = false): Promise<void> {
    await this.opfs.rm(path, { recursive })
  }

  async renameItem(oldPath: string, newPath: string): Promise<void> {
    await copyTreeWithFs(this.opfs, oldPath, newPath)
    await this.opfs.rm(oldPath, { recursive: true })
  }

  async copyItem(srcPath: string, destPath: string): Promise<void> {
    await copyTreeWithFs(this.opfs, srcPath, destPath)
  }

  async moveItem(srcPath: string, destPath: string): Promise<void> {
    await copyTreeWithFs(this.opfs, srcPath, destPath)
    await this.opfs.rm(srcPath, { recursive: true })
  }

  async syncToDisk(): Promise<void> {
    if (!this.localFs) return
    for (const path of this.dirtyPaths) {
      const content = await this.opfs.readFileText(path)
      await this.localFs.writeFileText(path, content)
    }
    this.dirtyPaths.clear()
  }

  async downloadZip(): Promise<Blob> {
    const zip = new JSZip()
    const files = await collectAllFiles(this.opfs, '/')
    for (const filePath of files) {
      const buf = await this.opfs.readFile(filePath)
      zip.file(filePath.slice(1), buf)
    }
    return zip.generateAsync({ type: 'blob' })
  }

  async *searchInFiles(query: string): AsyncGenerator<SearchMatch> {
    yield* searchFiles(this.opfs, '/', query)
  }
}
