import { Languages } from 'lucide-react'
import { useLocale, setLocale, type Locale } from '@/lib/i18n'

const LOCALES: { value: Locale; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
]

export function LocaleSelector({ variant = 'full' }: { variant?: 'full' | 'compact' }) {
  const locale = useLocale()

  return (
    <div className="flex items-center gap-1.5">
      {variant === 'full' && (
        <Languages className="size-4 text-muted-foreground" />
      )}
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className="bg-transparent text-sm outline-none cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
      >
        {LOCALES.map((l) => (
          <option key={l.value} value={l.value} className="bg-popover text-popover-foreground">
            {l.label}
          </option>
        ))}
      </select>
    </div>
  )
}
