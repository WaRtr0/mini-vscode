import { useState } from 'react'
import { Separator } from '@/components/ui/separator'
import { detectLanguageId, getLanguageLabel } from '@/lib/detect-language'
import { useWorkspace, useActiveFile } from '@/hooks/use-workspace'
import { useCursor } from '@/hooks/use-editor-state'
import { IndentSettingsDialog } from './IndentSettingsDialog'
import { LanguagePickerDialog } from './LanguagePickerDialog'
import { useT } from '@/lib/i18n'

export function StatusBar() {
  const { state, dispatch } = useWorkspace()
  const activeFile = useActiveFile()
  const cursor = useCursor()
  const t = useT()
  const [indentOpen, setIndentOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)

  const modeLabel = state.adapter
    ? state.adapter.mode === 'local'
      ? t('status.localMode')
      : t('status.draftMode')
    : t('status.noFolder')

  const langId = activeFile
    ? activeFile.languageId ?? detectLanguageId(activeFile.path)
    : null
  const languageLabel = langId ? getLanguageLabel(langId) : null

  const indentLabel = state.insertSpaces
    ? `Spaces: ${state.tabSize}`
    : `Tab: ${state.tabSize}`

  return (
    <>
      <Separator />
      <footer className="flex h-6 shrink-0 items-center gap-3 bg-sidebar-background px-3 text-[11px] text-sidebar-foreground/70">
        <span>{modeLabel}</span>

        {activeFile && (
          <>
            <Separator orientation="vertical" className="h-3" />
            <span className="truncate max-w-[200px]">{activeFile.path}</span>
            {activeFile.isDirty && (
              <span className="text-yellow-500 font-bold">M</span>
            )}
          </>
        )}

        <span className="ml-auto" />

        {activeFile && (
          <>
            <span className="tabular-nums">
              Ln {cursor.line}, Col {cursor.col}
            </span>

            <Separator orientation="vertical" className="h-3" />

            <button
              className="hover:text-foreground transition-colors cursor-pointer"
              onClick={() => setIndentOpen(true)}
            >
              {indentLabel}
            </button>

            <Separator orientation="vertical" className="h-3" />
          </>
        )}

        {languageLabel && (
          <button
            className="hover:text-foreground transition-colors cursor-pointer"
            onClick={() => setLangOpen(true)}
          >
            {languageLabel}
          </button>
        )}
      </footer>

      <IndentSettingsDialog
        open={indentOpen}
        onOpenChange={setIndentOpen}
        tabSize={state.tabSize}
        insertSpaces={state.insertSpaces}
        onApply={(tabSize, insertSpaces) =>
          dispatch({ type: 'SET_TAB_SETTINGS', tabSize, insertSpaces })
        }
      />

      {activeFile && langId && (
        <LanguagePickerDialog
          open={langOpen}
          onOpenChange={setLangOpen}
          currentId={langId}
          onSelect={(id) =>
            dispatch({ type: 'SET_LANGUAGE', path: activeFile.path, languageId: id })
          }
        />
      )}
    </>
  )
}
