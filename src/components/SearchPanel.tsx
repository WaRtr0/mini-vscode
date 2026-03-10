import { useState, useRef, useCallback, useEffect } from 'react'
import { Search, X, Loader2, FileText } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { useWorkspace } from '@/hooks/use-workspace'
import { useT } from '@/lib/i18n'
import type { SearchMatch } from '@/types'

interface GroupedResults {
  [path: string]: SearchMatch[]
}

export function SearchPanel() {
  const { state, openFile } = useWorkspace()
  const t = useT()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GroupedResults>({})
  const [searching, setSearching] = useState(false)
  const [totalMatches, setTotalMatches] = useState(0)
  const [fileCount, setFileCount] = useState(0)
  const abortRef = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    return () => { abortRef.current = true }
  }, [])

  const handleSearch = useCallback(async () => {
    const adapter = state.adapter
    if (!adapter || !query.trim()) return

    abortRef.current = true
    await new Promise((r) => setTimeout(r, 0))
    abortRef.current = false

    setSearching(true)
    setResults({})
    setTotalMatches(0)
    setFileCount(0)

    const grouped: GroupedResults = {}
    let count = 0

    try {
      for await (const match of adapter.searchInFiles(query.trim())) {
        if (abortRef.current) break
        if (!grouped[match.path]) grouped[match.path] = []
        grouped[match.path].push(match)
        count++

        if (count % 20 === 0) {
          setResults({ ...grouped })
          setTotalMatches(count)
          setFileCount(Object.keys(grouped).length)
        }
        if (count >= 500) break
      }
    } catch (err) {
      console.error('Search error:', err)
    }

    if (!abortRef.current) {
      setResults({ ...grouped })
      setTotalMatches(count)
      setFileCount(Object.keys(grouped).length)
    }
    setSearching(false)
  }, [state.adapter, query])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
    if (e.key === 'Escape') {
      setQuery('')
      setResults({})
      setTotalMatches(0)
      setFileCount(0)
    }
  }

  const handleResultClick = (match: SearchMatch) => {
    openFile(match.path)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1 border-b border-border px-2 py-1.5">
        <Search className="size-3.5 shrink-0 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('search.placeholder')}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => { setQuery(''); setResults({}); setTotalMatches(0); setFileCount(0) }}
          >
            <X className="size-3" />
          </Button>
        )}
      </div>

      {searching && (
        <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
          <Loader2 className="size-3 animate-spin" />
          <span>
            {totalMatches > 0
              ? t(totalMatches > 1 ? 'search.results' : 'search.result', { count: totalMatches, files: fileCount }) + '…'
              : t('search.searching')}
          </span>
        </div>
      )}

      {!searching && totalMatches > 0 && (
        <div className="px-3 py-1 text-[10px] text-muted-foreground border-b border-border">
          {t(totalMatches > 1 ? 'search.results' : 'search.result', { count: totalMatches, files: fileCount })}
        </div>
      )}

      {!searching && query && totalMatches === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 p-6 text-muted-foreground">
          <span className="text-xs">{t('search.noResults')}</span>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="py-1">
          {Object.entries(results).map(([path, matches]) => (
            <SearchFileGroup
              key={path}
              path={path}
              matches={matches}
              query={query}
              onClick={handleResultClick}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

function SearchFileGroup({
  path,
  matches,
  query,
  onClick,
}: {
  path: string
  matches: SearchMatch[]
  query: string
  onClick: (m: SearchMatch) => void
}) {
  const [open, setOpen] = useState(true)
  const name = path.split('/').pop() ?? path

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1 px-2 py-0.5 text-xs hover:bg-accent/60 text-left select-none"
      >
        <FileText className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate font-medium">{name}</span>
        <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
          {matches.length}
        </span>
      </button>

      {open &&
        matches.map((m, i) => (
          <button
            key={i}
            onClick={() => onClick(m)}
            className="flex w-full items-center gap-2 px-4 py-0.5 text-xs hover:bg-accent/40 text-left select-none"
          >
            <span className="shrink-0 w-6 text-right text-muted-foreground/60">
              {m.line}
            </span>
            <HighlightedText text={m.text.trim()} query={query} />
          </button>
        ))}
    </div>
  )
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query) return <span className="truncate">{text}</span>

  const lower = text.toLowerCase()
  const lowerQ = query.toLowerCase()
  const idx = lower.indexOf(lowerQ)

  if (idx === -1) return <span className="truncate">{text}</span>

  return (
    <span className="truncate">
      {text.slice(0, idx)}
      <span className="bg-yellow-500/30 text-yellow-200 rounded-xs px-0.5">
        {text.slice(idx, idx + query.length)}
      </span>
      {text.slice(idx + query.length)}
    </span>
  )
}
