import React, { useState, useCallback } from 'react'
import {
  FolderTree,
  FilePlus,
  FolderPlus,
  RefreshCw,
  ChevronsDownUp,
  ClipboardPaste,
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
} from '@/components/ui/context-menu'
import { FileTreeNode } from './FileTreeNode'
import { useWorkspace } from '../../hooks/use-workspace'
import { useClipboard, setClipboard, clearClipboard } from '../../hooks/use-clipboard'
import { useT } from '@/lib/i18n'
import type { FileNode } from '../../types'

function flattenTree(nodes: FileNode[]): string[] {
  const result: string[] = []
  for (const node of nodes) {
    result.push(node.path)
    if (node.children) {
      result.push(...flattenTree(node.children))
    }
  }
  return result
}

function findNodeByPath(nodes: FileNode[], path: string): FileNode | null {
  for (const node of nodes) {
    if (node.path === path) return node
    if (node.children) {
      const found = findNodeByPath(node.children, path)
      if (found) return found
    }
  }
  return null
}

export function FileExplorer() {
  const { state, dispatch, openFile } = useWorkspace()
  const t = useT()
  const { fileTree, activeFilePath, adapter } = state
  const clipboard = useClipboard()
  const [collapseVersion, setCollapseVersion] = useState(0)
  const [creatingAt, setCreatingAt] = useState<{ type: 'file' | 'directory' } | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set())
  const [lastClickedPath, setLastClickedPath] = useState<string | null>(null)
  const [renamingPath, setRenamingPath] = useState<string | null>(null)

  const handleRefresh = useCallback(async () => {
    if (!adapter || refreshing) return
    setRefreshing(true)
    try {
      const tree = await adapter.listDir('/')
      dispatch({ type: 'REFRESH_TREE', fileTree: tree })
    } finally {
      setRefreshing(false)
    }
  }, [adapter, dispatch, refreshing])

  const handleCollapseAll = useCallback(() => {
    setCollapseVersion((v) => v + 1)
  }, [])

  const handleCreateSubmit = useCallback(
    async (name: string) => {
      if (!adapter || !name.trim()) {
        setCreatingAt(null)
        return
      }
      const path = '/' + name.trim()
      try {
        if (creatingAt?.type === 'directory') {
          await adapter.createDir(path)
        } else {
          await adapter.createFile(path)
        }
        const tree = await adapter.listDir('/')
        dispatch({ type: 'REFRESH_TREE', fileTree: tree })
        if (creatingAt?.type === 'file') {
          openFile(path)
        }
      } catch (err) {
        console.error('Create error:', err)
      }
      setCreatingAt(null)
    },
    [adapter, creatingAt, dispatch, openFile],
  )

  const handleCreateInDir = useCallback(
    async (dirPath: string, name: string, type: 'file' | 'directory') => {
      if (!adapter || !name.trim()) return
      const path = dirPath === '/' ? '/' + name.trim() : dirPath + '/' + name.trim()
      try {
        if (type === 'directory') {
          await adapter.createDir(path)
        } else {
          await adapter.createFile(path)
        }
        const tree = await adapter.listDir('/')
        dispatch({ type: 'REFRESH_TREE', fileTree: tree })
        if (type === 'file') {
          openFile(path)
        }
      } catch (err) {
        console.error('Create error:', err)
      }
    },
    [adapter, dispatch, openFile],
  )

  const handleSelect = useCallback(
    (path: string, event: React.MouseEvent) => {
      if (event.shiftKey && lastClickedPath) {
        const flat = flattenTree(fileTree)
        const startIdx = flat.indexOf(lastClickedPath)
        const endIdx = flat.indexOf(path)
        if (startIdx !== -1 && endIdx !== -1) {
          const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx]
          setSelectedPaths(new Set(flat.slice(from, to + 1)))
        }
      } else if (event.ctrlKey || event.metaKey) {
        setSelectedPaths((prev) => {
          const next = new Set(prev)
          if (next.has(path)) {
            next.delete(path)
          } else {
            next.add(path)
          }
          return next
        })
        setLastClickedPath(path)
      } else {
        setSelectedPaths(new Set([path]))
        setLastClickedPath(path)
      }
    },
    [lastClickedPath, fileTree],
  )

  const handleBackgroundClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        setSelectedPaths(new Set())
        setLastClickedPath(null)
      }
    },
    [],
  )

  // ── Clipboard actions ──

  const handleCut = useCallback((paths: string[]) => {
    setClipboard(paths, 'cut')
  }, [])

  const handleCopy = useCallback((paths: string[]) => {
    setClipboard(paths, 'copy')
  }, [])

  const handlePaste = useCallback(async (targetDir: string) => {
    if (!adapter || !clipboard) return
    try {
      for (const srcPath of clipboard.paths) {
        const name = srcPath.split('/').pop()!
        const destPath = targetDir === '/' ? '/' + name : targetDir + '/' + name
        if (clipboard.operation === 'copy') {
          await adapter.copyItem(srcPath, destPath)
        } else {
          await adapter.moveItem(srcPath, destPath)
        }
      }
      if (clipboard.operation === 'cut') {
        clearClipboard()
      }
      const tree = await adapter.listDir('/')
      dispatch({ type: 'REFRESH_TREE', fileTree: tree })
    } catch (err) {
      console.error('Paste error:', err)
    }
  }, [adapter, clipboard, dispatch])

  // ── Rename / Delete ──

  const handleRename = useCallback(async (oldPath: string, newPath: string) => {
    if (!adapter) return
    try {
      await adapter.renameItem(oldPath, newPath)
      dispatch({ type: 'RENAME_FILE', oldPath, newPath })
      const tree = await adapter.listDir('/')
      dispatch({ type: 'REFRESH_TREE', fileTree: tree })
    } catch (err) {
      console.error('Rename error:', err)
    }
  }, [adapter, dispatch])

  const handleDelete = useCallback(async (path: string) => {
    if (!adapter) return
    const name = path.split('/').pop() ?? path
    if (!window.confirm(t('explorer.deleteConfirm', { name }))) return
    try {
      await adapter.deleteItem(path, true)
      dispatch({ type: 'DELETE_FILES', path })
      const tree = await adapter.listDir('/')
      dispatch({ type: 'REFRESH_TREE', fileTree: tree })
      setSelectedPaths((prev) => {
        const next = new Set(prev)
        next.delete(path)
        return next
      })
    } catch (err) {
      console.error('Delete error:', err)
    }
  }, [adapter, dispatch])

  // ── Keyboard shortcuts ──

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (renamingPath) return

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedPaths.size > 0) {
        e.preventDefault()
        if (!adapter) return
        const paths = Array.from(selectedPaths)
        const msg = paths.length === 1
          ? t('explorer.deleteConfirm', { name: paths[0].split('/').pop()! })
          : t('explorer.deleteMultiple', { count: paths.length })
        if (!window.confirm(msg)) return
        ;(async () => {
          try {
            for (const p of paths) {
              await adapter.deleteItem(p, true)
              dispatch({ type: 'DELETE_FILES', path: p })
            }
            const tree = await adapter.listDir('/')
            dispatch({ type: 'REFRESH_TREE', fileTree: tree })
            setSelectedPaths(new Set())
          } catch (err) {
            console.error('Delete error:', err)
          }
        })()
      } else if (e.key === 'F2' && selectedPaths.size === 1) {
        e.preventDefault()
        setRenamingPath(Array.from(selectedPaths)[0])
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedPaths.size > 0) {
        e.preventDefault()
        handleCopy(Array.from(selectedPaths))
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'x' && selectedPaths.size > 0) {
        e.preventDefault()
        handleCut(Array.from(selectedPaths))
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'v' && clipboard) {
        e.preventDefault()
        let targetDir = '/'
        if (selectedPaths.size === 1) {
          const p = Array.from(selectedPaths)[0]
          const node = findNodeByPath(fileTree, p)
          if (node?.type === 'directory') {
            targetDir = p
          } else {
            const lastSlash = p.lastIndexOf('/')
            targetDir = lastSlash > 0 ? p.substring(0, lastSlash) : '/'
          }
        }
        handlePaste(targetDir)
      }
    },
    [adapter, clipboard, dispatch, fileTree, handleCopy, handleCut, handlePaste, renamingPath, selectedPaths],
  )

  if (fileTree.length === 0 && !creatingAt) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground p-4">
        <FolderTree className="size-8 opacity-40" />
        <span className="text-xs">{t('explorer.empty')}</span>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col outline-none" tabIndex={0} onKeyDown={handleKeyDown}>
      {/* Toolbar */}
      <div className="flex h-7 shrink-0 items-center justify-end gap-0.5 border-b border-border px-1.5">
        <Button
          variant="ghost" size="icon-xs"
          title={t('explorer.newFile')}
          onClick={() => setCreatingAt({ type: 'file' })}
        >
          <FilePlus className="size-3.5" />
        </Button>
        <Button
          variant="ghost" size="icon-xs"
          title={t('explorer.newFolder')}
          onClick={() => setCreatingAt({ type: 'directory' })}
        >
          <FolderPlus className="size-3.5" />
        </Button>
        <Button
          variant="ghost" size="icon-xs"
          title={t('explorer.refresh')}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`size-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
        <Button
          variant="ghost" size="icon-xs"
          title={t('explorer.collapseAll')}
          onClick={handleCollapseAll}
        >
          <ChevronsDownUp className="size-3.5" />
        </Button>
      </div>

      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-1" onClick={handleBackgroundClick}>
                {creatingAt && (
                  <InlineInput
                    type={creatingAt.type}
                    onSubmit={handleCreateSubmit}
                    onCancel={() => setCreatingAt(null)}
                    depth={0}
                  />
                )}

                {fileTree.map((node) => (
                  <FileTreeNode
                    key={node.path}
                    node={node}
                    depth={0}
                    activePath={activeFilePath}
                    onFileClick={openFile}
                    collapseVersion={collapseVersion}
                    onCreateInDir={handleCreateInDir}
                    selectedPaths={selectedPaths}
                    onSelect={handleSelect}
                    onRename={handleRename}
                    onDelete={handleDelete}
                    onCut={handleCut}
                    onCopy={handleCopy}
                    onPaste={handlePaste}
                    clipboard={clipboard}
                    renamingPath={renamingPath}
                    onSetRenamingPath={setRenamingPath}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent>
          <ContextMenuItem onSelect={() => setCreatingAt({ type: 'file' })}>
            <FilePlus className="size-4" />
            {t('explorer.newFile')}
          </ContextMenuItem>
          <ContextMenuItem onSelect={() => setCreatingAt({ type: 'directory' })}>
            <FolderPlus className="size-4" />
            {t('explorer.newFolder')}
          </ContextMenuItem>
          {clipboard && (
            <>
              <ContextMenuSeparator />
              <ContextMenuItem onSelect={() => handlePaste('/')}>
                <ClipboardPaste className="size-4" />
                {t('explorer.paste')}
                <ContextMenuShortcut>Ctrl+V</ContextMenuShortcut>
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>
    </div>
  )
}

interface InlineInputProps {
  type: 'file' | 'directory'
  onSubmit: (name: string) => void
  onCancel: () => void
  depth: number
}

import { useEffect, useRef as useLocalRef } from 'react'
import { File, Folder } from 'lucide-react'

function InlineInput({ type, onSubmit, onCancel, depth }: InlineInputProps) {
  const t = useT()
  const Icon = type === 'directory' ? Folder : File
  const wrapperRef = useLocalRef<HTMLDivElement>(null)
  const inputRef = useLocalRef<HTMLInputElement>(null)
  const cancelledRef = useLocalRef(false)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        cancelledRef.current = true
        onCancel()
      }
    }
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        cancelledRef.current = true
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
      <span className="inline-block w-3.5 shrink-0" />
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <input
        ref={inputRef}
        type="text"
        className="flex-1 bg-input/50 text-sm outline-none rounded-xs px-1 py-0.5 border border-ring"
        placeholder={type === 'directory' ? t('explorer.folderName') : t('explorer.fileName')}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            const val = (e.target as HTMLInputElement).value.trim()
            if (val) onSubmit(val)
            else onCancel()
          }
        }}
      />
    </div>
  )
}

export { InlineInput }
