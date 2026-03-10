import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWorkspace } from '../../hooks/use-workspace'

export function EditorTabs() {
  const { state, dispatch } = useWorkspace()

  if (state.openFiles.length === 0) return null

  return (
    <div className="flex h-9 shrink-0 items-end border-b border-border bg-sidebar-background overflow-x-auto scrollbar-none">
      {state.openFiles.map((file) => {
        const name = file.path.split('/').pop() ?? file.path
        const isActive = file.path === state.activeFilePath

        return (
          <button
            key={file.path}
            className={cn(
              'group relative flex h-[34px] shrink-0 items-center gap-1.5 border-r border-border px-3 text-xs transition-colors',
              isActive
                ? 'bg-background text-foreground'
                : 'bg-sidebar-background text-muted-foreground hover:bg-accent/60',
            )}
            onClick={() => dispatch({ type: 'SET_ACTIVE', path: file.path })}
            onMouseDown={(e) => {
              if (e.button === 1) {
                e.preventDefault()
                dispatch({ type: 'CLOSE_FILE', path: file.path })
              }
            }}
            title={file.path}
          >
            {isActive && (
              <>
                <span className="absolute top-0 left-0 right-0 h-[2px] bg-primary" />
                <span className="absolute bottom-0 left-0 right-0 h-px bg-background" />
              </>
            )}

            <span className="flex items-center gap-1 max-w-[160px]">
              {file.isDirty && (
                <span className="size-2 shrink-0 rounded-full bg-yellow-500" />
              )}
              <span className="truncate">{name}</span>
            </span>

            <span
              role="button"
              tabIndex={-1}
              className={cn(
                'ml-0.5 rounded-sm p-0.5 hover:bg-foreground/10 transition-opacity',
                !isActive && 'opacity-0 group-hover:opacity-100',
              )}
              onClick={(e) => {
                e.stopPropagation()
                dispatch({ type: 'CLOSE_FILE', path: file.path })
              }}
            >
              <X className="size-3" />
            </span>
          </button>
        )
      })}
    </div>
  )
}
