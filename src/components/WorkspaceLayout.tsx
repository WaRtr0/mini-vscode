import { PanelLeft, Search, FolderTree, Home } from 'lucide-react'
import { useState, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { FileExplorer } from './file-explorer/FileExplorer'
import { EditorTabs } from './editor/EditorTabs'
import { CodeEditor } from './editor/CodeEditor'
import { SyncToolbar } from './SyncToolbar'
import { StatusBar } from './StatusBar'
import { SearchPanel } from './SearchPanel'
import { LocaleSelector } from './LocaleSelector'
import { useWorkspace } from '../hooks/use-workspace'
import { useT } from '@/lib/i18n'

const SIDEBAR_WIDTH = 260
const SIDEBAR_MIN = 180
const SIDEBAR_MAX = 480

type SidebarView = 'explorer' | 'search'

export function WorkspaceLayout() {
  const { dispatch } = useWorkspace()
  const t = useT()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_WIDTH)
  const [resizing, setResizing] = useState(false)
  const [sidebarView, setSidebarView] = useState<SidebarView>('explorer')

  useEffect(() => {
    document.body.classList.toggle('resizing-active', resizing)
    return () => document.body.classList.remove('resizing-active')
  }, [resizing])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey

      if (mod && e.key === 'b') {
        e.preventDefault()
        setSidebarOpen((v) => !v)
      }

      if (mod && e.shiftKey && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault()
        setSidebarOpen(true)
        setSidebarView('search')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setResizing(true)
      const startX = e.clientX
      const startW = sidebarWidth

      const onMove = (ev: MouseEvent) => {
        const delta = ev.clientX - startX
        const next = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, startW + delta))
        setSidebarWidth(next)
      }

      const onUp = () => {
        setResizing(false)
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
      }

      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    },
    [sidebarWidth],
  )

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <div className="flex flex-1 overflow-hidden">
        {/* Activity bar */}
        <div className="flex w-10 shrink-0 flex-col items-center gap-1 border-r border-border bg-sidebar-background py-2">
          <Button
            variant="ghost"
            size="icon-xs"
            title={t('layout.explorer')}
            className={cn(sidebarView === 'explorer' && sidebarOpen && 'bg-accent')}
            onClick={() => {
              if (sidebarView === 'explorer' && sidebarOpen) {
                setSidebarOpen(false)
              } else {
                setSidebarView('explorer')
                setSidebarOpen(true)
              }
            }}
          >
            <FolderTree className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            title={t('layout.searchShortcut')}
            className={cn(sidebarView === 'search' && sidebarOpen && 'bg-accent')}
            onClick={() => {
              if (sidebarView === 'search' && sidebarOpen) {
                setSidebarOpen(false)
              } else {
                setSidebarView('search')
                setSidebarOpen(true)
              }
            }}
          >
            <Search className="size-4" />
          </Button>

          <div className="flex-1" />

          <Button
            variant="ghost"
            size="icon-xs"
            title={t('layout.backHome')}
            onClick={() => dispatch({ type: 'CLOSE_WORKSPACE' })}
          >
            <Home className="size-4" />
          </Button>
        </div>

        {/* Sidebar panel */}
        {sidebarOpen && (
          <>
            <aside
              className="flex flex-col border-r border-border bg-sidebar-background"
              style={{ width: sidebarWidth }}
            >
              <div className="flex h-9 shrink-0 items-center justify-between border-b border-border px-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/70">
                  {sidebarView === 'explorer' ? t('layout.explorer') : t('layout.search')}
                </span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setSidebarOpen(false)}
                  title={t('layout.hidePanel')}
                >
                  <PanelLeft className="size-3.5" />
                </Button>
              </div>

              <div className="flex-1 overflow-hidden">
                {sidebarView === 'explorer' ? <FileExplorer /> : <SearchPanel />}
              </div>

              {sidebarView === 'explorer' && <SyncToolbar />}
            </aside>

            <div
              onMouseDown={handleMouseDown}
              className={cn(
                'w-1 cursor-col-resize transition-colors duration-150 shrink-0',
                'hover:bg-primary/30',
                resizing ? 'bg-primary/50' : 'bg-transparent',
              )}
            />
          </>
        )}

        {/* Editor area */}
        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="flex items-center">
            <div className="flex-1 overflow-hidden">
              <EditorTabs />
            </div>
            <div className="shrink-0 px-2 py-1 border-b border-border bg-sidebar-background">
              <LocaleSelector variant="compact" />
            </div>
          </div>
          <CodeEditor />
        </main>
      </div>

      <StatusBar />
    </div>
  )
}
