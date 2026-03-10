import { useState, useMemo, useRef, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { LANGUAGES } from '@/lib/detect-language'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n'

interface LanguagePickerDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  currentId: string
  onSelect: (id: string) => void
}

export function LanguagePickerDialog({
  open,
  onOpenChange,
  currentId,
  onSelect,
}: LanguagePickerDialogProps) {
  const t = useT()
  const [filter, setFilter] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setFilter('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const filtered = useMemo(() => {
    if (!filter) return LANGUAGES
    const lower = filter.toLowerCase()
    return LANGUAGES.filter((l) => l.label.toLowerCase().includes(lower))
  }, [filter])

  const handleSelect = (id: string) => {
    onSelect(id)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs p-0 gap-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="text-sm">{t('langPicker.title')}</DialogTitle>
        </DialogHeader>

        <div className="px-4 py-2">
          <input
            ref={inputRef}
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={t('langPicker.filter')}
            className="w-full bg-input/50 text-sm outline-none rounded-md px-2.5 py-1.5 border border-border"
          />
        </div>

        <div className="max-h-60 overflow-y-auto px-2 pb-2">
          {filtered.map((lang) => (
            <button
              key={lang.id}
              onClick={() => handleSelect(lang.id)}
              className={cn(
                'flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent/60 text-left',
                lang.id === currentId && 'bg-accent text-accent-foreground',
              )}
            >
              {lang.label}
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground px-2 py-3 text-center">
              {t('langPicker.noResults')}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
