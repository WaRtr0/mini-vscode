import { useState } from 'react'
import { HardDriveDownload, Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { useWorkspace } from '@/hooks/use-workspace'
import { supportsDirectoryPicker } from '@/lib/workspace-adapter'
import { useT } from '@/lib/i18n'

export function SyncToolbar() {
  const { state } = useWorkspace()
  const adapter = state.adapter
  const [syncing, setSyncing] = useState(false)
  const [zipping, setZipping] = useState(false)

  const t = useT()

  if (!adapter || adapter.mode !== 'draft') return null

  const dirtyCount = adapter.dirtyPaths.size

  async function handleSync() {
    if (!adapter || !adapter.canSyncToDisk) return
    setSyncing(true)
    try {
      await adapter.syncToDisk()
    } finally {
      setSyncing(false)
    }
  }

  async function handleZip() {
    if (!adapter) return
    setZipping(true)
    try {
      const blob = await adapter.downloadZip()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'workspace.zip'
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setZipping(false)
    }
  }

  return (
    <div className="flex shrink-0 items-center gap-1.5 border-t border-border px-2 py-1.5">
      {dirtyCount > 0 && (
        <Badge variant="secondary" className="mr-1 text-[10px] px-1.5 py-0">
          {dirtyCount} {t('sync.modif')}
        </Badge>
      )}

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <Button
                variant="ghost"
                size="xs"
                disabled={!supportsDirectoryPicker || syncing || dirtyCount === 0}
                onClick={handleSync}
              >
                {syncing ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <HardDriveDownload className="size-3" />
                )}
                {t('sync.syncDisk')}
              </Button>
            </span>
          </TooltipTrigger>
          {!supportsDirectoryPicker && (
            <TooltipContent side="top">
              {t('sync.noFirefox')}
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>

      <Separator orientation="vertical" className="h-4" />

      <Button
        variant="ghost"
        size="xs"
        disabled={zipping || dirtyCount === 0}
        onClick={handleZip}
      >
        {zipping ? (
          <Loader2 className="size-3 animate-spin" />
        ) : (
          <Download className="size-3" />
        )}
        .zip
      </Button>
    </div>
  )
}
