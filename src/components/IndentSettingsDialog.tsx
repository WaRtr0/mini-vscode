import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n'

interface IndentSettingsDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  tabSize: number
  insertSpaces: boolean
  onApply: (tabSize: number, insertSpaces: boolean) => void
}

const TAB_SIZES = [1, 2, 4, 8]

export function IndentSettingsDialog({
  open,
  onOpenChange,
  tabSize,
  insertSpaces,
  onApply,
}: IndentSettingsDialogProps) {
  const t = useT()
  const [localTab, setLocalTab] = useState(tabSize)
  const [localSpaces, setLocalSpaces] = useState(insertSpaces)

  const handleApply = () => {
    onApply(localTab, localSpaces)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-sm">{t('indent.title')}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-xs text-muted-foreground font-medium">{t('indent.type')}</span>
            <div className="flex gap-2">
              <Button
                variant={localSpaces ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLocalSpaces(true)}
                className="flex-1"
              >
                Spaces
              </Button>
              <Button
                variant={!localSpaces ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLocalSpaces(false)}
                className="flex-1"
              >
                Tab
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs text-muted-foreground font-medium">{t('indent.size')}</span>
            <div className="flex gap-1">
              {TAB_SIZES.map((s) => (
                <Button
                  key={s}
                  variant={localTab === s ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setLocalTab(s)}
                  className={cn('flex-1 tabular-nums', localTab === s && 'pointer-events-none')}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>

          <Button size="sm" onClick={handleApply}>
            {t('indent.apply')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
