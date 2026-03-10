import { useRef, useState } from 'react'
import { FolderOpen, ChevronDown, Monitor, Cloud } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { EditorMode } from '@/types'
import { supportsDirectoryPicker } from '@/lib/workspace-adapter'
import { useT } from '@/lib/i18n'
import { LocaleSelector } from './LocaleSelector'

interface WelcomeScreenProps {
  onOpen: (
    mode: EditorMode,
    handle?: FileSystemDirectoryHandle,
    files?: File[],
  ) => void | Promise<void>
  error?: string | null
}

export function WelcomeScreen({ onOpen, error: externalError }: WelcomeScreenProps) {
  const t = useT()
  const [mode, setMode] = useState<EditorMode>(
    supportsDirectoryPicker ? 'local' : 'draft',
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleOpenDirectory = async () => {
    setError(null)
    setLoading(true)

    try {
      if (supportsDirectoryPicker) {
        const handle: FileSystemDirectoryHandle = await (
          window as any
        ).showDirectoryPicker({ mode: mode === 'local' ? 'readwrite' : 'read' })
        await onOpen(mode, handle)
      } else {
        fileInputRef.current?.click()
        setLoading(false)
        return
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        setError(t('welcome.openError'))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files
    if (!fileList || fileList.length === 0) return
    onOpen('draft', undefined, Array.from(fileList))
  }

  const modeLabel =
    mode === 'local' ? t('welcome.localMode') : t('welcome.draftMode')

  return (
    <div className="h-screen bg-background text-foreground flex items-center justify-center relative">
      <div className="absolute top-4 right-4">
        <LocaleSelector />
      </div>

      <div className="flex flex-col items-center gap-8 max-w-md w-full px-6">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Monitor className="size-5 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Mini VSCode</h1>
          </div>
          <p className="text-muted-foreground text-sm text-center">
            {t('welcome.subtitle')}
          </p>
        </div>

        <div className="flex flex-col items-center gap-2 w-full">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {t('welcome.editMode')}
          </label>

          {supportsDirectoryPicker ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    {mode === 'local' ? (
                      <Monitor className="size-4" />
                    ) : (
                      <Cloud className="size-4" />
                    )}
                    {modeLabel}
                  </span>
                  <ChevronDown className="size-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width)">
                <DropdownMenuRadioGroup
                  value={mode}
                  onValueChange={(v) => setMode(v as EditorMode)}
                >
                  <DropdownMenuRadioItem value="local">
                    <div className="flex flex-col gap-0.5">
                      <span>{t('welcome.localMode')}</span>
                      <span className="text-xs text-muted-foreground">
                        {t('welcome.localDesc')}
                      </span>
                    </div>
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="draft">
                    <div className="flex flex-col gap-0.5">
                      <span>{t('welcome.draftMode')}</span>
                      <span className="text-xs text-muted-foreground">
                        {t('welcome.draftDesc')}
                      </span>
                    </div>
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-full">
                    <Button
                      variant="outline"
                      className="w-full justify-between cursor-default"
                      tabIndex={-1}
                      type="button"
                    >
                      <span className="flex items-center gap-2">
                        <Cloud className="size-4" />
                        {t('welcome.draftMode')}
                      </span>
                      <Badge variant="secondary">Firefox</Badge>
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {t('welcome.noLocalSupport')}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        <Button
          size="lg"
          className="w-full"
          onClick={handleOpenDirectory}
          disabled={loading}
        >
          <FolderOpen className="size-5" />
          {loading ? t('welcome.opening') : t('welcome.openFolder')}
        </Button>

        {(error || externalError) && (
          <p className="text-sm text-destructive text-center">{error || externalError}</p>
        )}

        {!supportsDirectoryPicker && (
          <input
            ref={fileInputRef}
            type="file"
            // @ts-expect-error webkitdirectory is a non-standard attribute
            webkitdirectory=""
            multiple
            className="hidden"
            onChange={handleFileInputChange}
          />
        )}
      </div>
    </div>
  )
}
