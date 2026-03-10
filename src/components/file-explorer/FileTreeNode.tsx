import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
  FileCode,
  FileJson,
  FileImage,
  File,
  FilePlus,
  FolderPlus,
  Scissors,
  Copy,
  ClipboardPaste,
  Pencil,
  Trash2,
} from 'lucide-react'
import type { FileNode } from '../../types'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n'
import { InlineInput } from './FileExplorer'
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
} from '@/components/ui/context-menu'

const EXT_ICON_MAP: Record<string, typeof FileText> = {
  ts: FileCode, tsx: FileCode, js: FileCode, jsx: FileCode,
  py: FileCode, html: FileCode, css: FileCode,
  json: FileJson,
  md: FileText, txt: FileText,
  png: FileImage, jpg: FileImage, jpeg: FileImage,
  gif: FileImage, svg: FileImage, webp: FileImage,
}

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  return EXT_ICON_MAP[ext] ?? File
}

interface FileTreeNodeProps {
  node: FileNode
  depth: number
  activePath: string | null
  onFileClick: (path: string) => void
  collapseVersion: number
  onCreateInDir: (dirPath: string, name: string, type: 'file' | 'directory') => void
  selectedPaths: Set<string>
  onSelect: (path: string, event: React.MouseEvent) => void
  onRename: (oldPath: string, newPath: string) => Promise<void>
  onDelete: (path: string) => Promise<void>
  onCut: (paths: string[]) => void
  onCopy: (paths: string[]) => void
  onPaste: (targetDir: string) => Promise<void>
  clipboard: { paths: string[]; operation: 'copy' | 'cut' } | null
  renamingPath: string | null
  onSetRenamingPath: (path: string | null) => void
}

export function FileTreeNode({
  node,
  depth,
  activePath,
  onFileClick,
  collapseVersion,
  onCreateInDir,
  selectedPaths,
  onSelect,
  onRename,
  onDelete,
  onCut,
  onCopy,
  onPaste,
  clipboard,
  renamingPath,
  onSetRenamingPath,
}: FileTreeNodeProps) {
  const t = useT()
  const [expanded, setExpanded] = useState(depth === 0)
  const [creating, setCreating] = useState<'file' | 'directory' | null>(null)

  const isRenaming = renamingPath === node.path

  useEffect(() => {
    if (collapseVersion > 0) setExpanded(false)
  }, [collapseVersion])

  const toggle = useCallback(() => setExpanded((v) => !v), [])

  const isDir = node.type === 'directory'
  const isActive = node.path === activePath
  const isSelected = selectedPaths.has(node.path)
  const Icon = isDir ? (expanded ? FolderOpen : Folder) : getFileIcon(node.name)

  const handleClick = (e: React.MouseEvent) => {
    onSelect(node.path, e)
    if (e.ctrlKey || e.metaKey || e.shiftKey) return
    if (isDir) {
      toggle()
    } else {
      onFileClick(node.path)
    }
  }

  const handleCreateSubmit = (name: string) => {
    if (name.trim() && creating) {
      onCreateInDir(node.path, name.trim(), creating)
    }
    setCreating(null)
  }

  const handleRenameSubmit = useCallback(
    async (newName: string) => {
      if (newName.trim() && newName.trim() !== node.name) {
        const lastSlash = node.path.lastIndexOf('/')
        const parentDir = lastSlash > 0 ? node.path.substring(0, lastSlash) : '/'
        const newPath = parentDir === '/'
          ? '/' + newName.trim()
          : parentDir + '/' + newName.trim()
        await onRename(node.path, newPath)
      }
      onSetRenamingPath(null)
    },
    [node.path, node.name, onRename, onSetRenamingPath],
  )

  const handleCopyPath = useCallback(() => {
    navigator.clipboard.writeText(node.path)
  }, [node.path])

  const handleCopyRelativePath = useCallback(() => {
    const rel = node.path.startsWith('/') ? node.path.slice(1) : node.path
    navigator.clipboard.writeText(rel)
  }, [node.path])

  const getTargetPaths = useCallback(() => {
    if (selectedPaths.has(node.path) && selectedPaths.size > 1) {
      return Array.from(selectedPaths)
    }
    return [node.path]
  }, [node.path, selectedPaths])

  return (
    <div>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className="group relative"
            onContextMenu={(e) => {
              e.stopPropagation()
              if (!selectedPaths.has(node.path)) {
                onSelect(node.path, e)
              }
            }}
          >
            {isRenaming ? (
              <RenameInput
                depth={depth}
                isDir={isDir}
                icon={Icon}
                defaultValue={node.name}
                onSubmit={handleRenameSubmit}
                onCancel={() => onSetRenamingPath(null)}
              />
            ) : (
              <button
                onClick={handleClick}
                className={cn(
                  'flex w-full items-center gap-1 rounded-sm px-1 py-0.5 text-sm hover:bg-accent/60',
                  'text-left select-none',
                  isSelected && !isActive && 'bg-accent/40',
                  isActive && 'bg-accent text-accent-foreground',
                )}
                style={{ paddingLeft: `${depth * 12 + 4}px` }}
              >
                {isDir ? (
                  expanded ? (
                    <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
                  )
                ) : (
                  <span className="inline-block w-3.5 shrink-0" />
                )}
                <Icon
                  className={cn(
                    'size-4 shrink-0',
                    isDir ? 'text-blue-400' : 'text-muted-foreground',
                  )}
                />
                <span className="truncate">{node.name}</span>
              </button>
            )}

            {isDir && !isRenaming && (
              <div className="absolute right-1 top-0 bottom-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  className="rounded-sm p-0.5 hover:bg-foreground/10"
                  title={t('explorer.newFile')}
                  onClick={(e) => {
                    e.stopPropagation()
                    setExpanded(true)
                    setCreating('file')
                  }}
                >
                  <FilePlus className="size-3 text-muted-foreground" />
                </button>
                <button
                  className="rounded-sm p-0.5 hover:bg-foreground/10"
                  title={t('explorer.newFolder')}
                  onClick={(e) => {
                    e.stopPropagation()
                    setExpanded(true)
                    setCreating('directory')
                  }}
                >
                  <FolderPlus className="size-3 text-muted-foreground" />
                </button>
              </div>
            )}
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent>
          {isDir ? (
            <>
              <ContextMenuItem onSelect={() => { setExpanded(true); setCreating('file') }}>
                <FilePlus className="size-4" />
                {t('explorer.newFile')}
              </ContextMenuItem>
              <ContextMenuItem onSelect={() => { setExpanded(true); setCreating('directory') }}>
                <FolderPlus className="size-4" />
                {t('explorer.newFolder')}
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem onSelect={() => onCut(getTargetPaths())}>
                <Scissors className="size-4" />
                {t('tree.cut')}
                <ContextMenuShortcut>Ctrl+X</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuItem onSelect={() => onCopy(getTargetPaths())}>
                <Copy className="size-4" />
                {t('tree.copy')}
                <ContextMenuShortcut>Ctrl+C</ContextMenuShortcut>
              </ContextMenuItem>
              {clipboard && (
                <ContextMenuItem onSelect={() => onPaste(node.path)}>
                  <ClipboardPaste className="size-4" />
                  {t('tree.paste')}
                  <ContextMenuShortcut>Ctrl+V</ContextMenuShortcut>
                </ContextMenuItem>
              )}
              <ContextMenuSeparator />
              <ContextMenuItem onSelect={handleCopyPath}>
                {t('tree.copyPath')}
              </ContextMenuItem>
              <ContextMenuItem onSelect={handleCopyRelativePath}>
                {t('tree.copyRelativePath')}
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem onSelect={() => onSetRenamingPath(node.path)}>
                <Pencil className="size-4" />
                {t('tree.rename')}
                <ContextMenuShortcut>F2</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuItem variant="destructive" onSelect={() => onDelete(node.path)}>
                <Trash2 className="size-4" />
                {t('tree.delete')}
                <ContextMenuShortcut>Suppr</ContextMenuShortcut>
              </ContextMenuItem>
            </>
          ) : (
            <>
              <ContextMenuItem onSelect={() => onCut(getTargetPaths())}>
                <Scissors className="size-4" />
                {t('tree.cut')}
                <ContextMenuShortcut>Ctrl+X</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuItem onSelect={() => onCopy(getTargetPaths())}>
                <Copy className="size-4" />
                {t('tree.copy')}
                <ContextMenuShortcut>Ctrl+C</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem onSelect={handleCopyPath}>
                {t('tree.copyPath')}
              </ContextMenuItem>
              <ContextMenuItem onSelect={handleCopyRelativePath}>
                {t('tree.copyRelativePath')}
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem onSelect={() => onSetRenamingPath(node.path)}>
                <Pencil className="size-4" />
                {t('tree.rename')}
                <ContextMenuShortcut>F2</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuItem variant="destructive" onSelect={() => onDelete(node.path)}>
                <Trash2 className="size-4" />
                {t('tree.delete')}
                <ContextMenuShortcut>Suppr</ContextMenuShortcut>
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>

      {isDir && expanded && (
        <div>
          {creating && (
            <InlineInput
              type={creating}
              onSubmit={handleCreateSubmit}
              onCancel={() => setCreating(null)}
              depth={depth + 1}
            />
          )}
          {node.children?.map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              activePath={activePath}
              onFileClick={onFileClick}
              collapseVersion={collapseVersion}
              onCreateInDir={onCreateInDir}
              selectedPaths={selectedPaths}
              onSelect={onSelect}
              onRename={onRename}
              onDelete={onDelete}
              onCut={onCut}
              onCopy={onCopy}
              onPaste={onPaste}
              clipboard={clipboard}
              renamingPath={renamingPath}
              onSetRenamingPath={onSetRenamingPath}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function RenameInput({
  depth,
  isDir,
  icon: IconComp,
  defaultValue,
  onSubmit,
  onCancel,
}: {
  depth: number
  isDir: boolean
  icon: typeof File
  defaultValue: string
  onSubmit: (value: string) => void
  onCancel: () => void
}) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.focus()
    const dotIdx = defaultValue.lastIndexOf('.')
    if (dotIdx > 0 && !isDir) {
      el.setSelectionRange(0, dotIdx)
    } else {
      el.select()
    }
  }, [defaultValue, isDir])

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onCancel()
      }
    }
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        onCancel()
      }
    }
    document.addEventListener('keydown', handleEscape, true)
    document.addEventListener('mousedown', handleClickOutside, true)
    return () => {
      document.removeEventListener('keydown', handleEscape, true)
      document.removeEventListener('mousedown', handleClickOutside, true)
    }
  }, [onCancel])

  return (
    <div
      ref={wrapperRef}
      className="flex items-center gap-1 px-1 py-0.5"
      style={{ paddingLeft: `${depth * 12 + 4}px` }}
    >
      {isDir ? (
        <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
      ) : (
        <span className="inline-block w-3.5 shrink-0" />
      )}
      <IconComp
        className={cn(
          'size-4 shrink-0',
          isDir ? 'text-blue-400' : 'text-muted-foreground',
        )}
      />
      <input
        ref={inputRef}
        type="text"
        defaultValue={defaultValue}
        className="flex-1 bg-input/50 text-sm outline-none rounded-xs px-1 py-0.5 border border-ring"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            onSubmit((e.target as HTMLInputElement).value)
          }
        }}
      />
    </div>
  )
}
