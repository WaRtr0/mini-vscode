import { useRef, useEffect } from 'react'
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view'
import { EditorState, Compartment, Transaction } from '@codemirror/state'
import { defaultKeymap, historyKeymap, history, insertTab, indentLess } from '@codemirror/commands'
import { bracketMatching, indentUnit } from '@codemirror/language'
import { search, searchKeymap, highlightSelectionMatches } from '@codemirror/search'
import { vividDark } from '@/lib/editor-theme'
import { detectLanguage, getLanguageSupport } from '@/lib/detect-language'
import { setCursorPosition } from '@/hooks/use-editor-state'
import { useWorkspace } from '../../hooks/use-workspace'
import { useT } from '@/lib/i18n'

export function CodeEditor() {
  const { state, dispatch } = useWorkspace()
  const t = useT()
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const langCompartment = useRef(new Compartment())
  const historyCompartment = useRef(new Compartment())
  const tabSizeCompartment = useRef(new Compartment())
  const activePathRef = useRef<string | null>(null)
  const suppressRef = useRef(false)
  const stateRef = useRef(state)
  stateRef.current = state

  const activeFile = state.openFiles.find((f) => f.path === state.activeFilePath)

  const resolvedLangId = activeFile?.languageId
  const tabSize = state.tabSize
  const insertSpaces = state.insertSpaces

  useEffect(() => {
    return () => {
      viewRef.current?.destroy()
      viewRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!containerRef.current) return

    if (!activeFile) {
      activePathRef.current = null
      return
    }

    if (!viewRef.current) {
      const lang = resolvedLangId
        ? getLanguageSupport(resolvedLangId)
        : detectLanguage(activeFile.path)

      const view = new EditorView({
        state: EditorState.create({
          doc: activeFile.content,
          extensions: [
            lineNumbers(),
            highlightActiveLine(),
            historyCompartment.current.of(history()),
            bracketMatching(),
            highlightSelectionMatches(),
            search({ top: true }),
            langCompartment.current.of(lang ? [lang] : []),
            tabSizeCompartment.current.of([
              EditorState.tabSize.of(tabSize),
              indentUnit.of(insertSpaces ? ' '.repeat(tabSize) : '\t'),
            ]),
            keymap.of([
              { key: 'Tab', run: insertTab, shift: indentLess },
              ...defaultKeymap,
              ...historyKeymap,
              ...searchKeymap,
            ]),
            vividDark,
            EditorView.updateListener.of((update) => {
              if (update.docChanged && !suppressRef.current) {
                const path = activePathRef.current
                if (path) {
                  dispatch({
                    type: 'UPDATE_CONTENT',
                    path,
                    content: update.state.doc.toString(),
                  })
                }
              }
              if (update.selectionSet || update.docChanged) {
                const pos = update.state.selection.main.head
                const line = update.state.doc.lineAt(pos)
                setCursorPosition(line.number, pos - line.from + 1)
              }
            }),
          ],
        }),
        parent: containerRef.current,
      })

      viewRef.current = view
      activePathRef.current = activeFile.path
      return
    }

    if (activePathRef.current !== activeFile.path) {
      const view = viewRef.current
      activePathRef.current = activeFile.path

      suppressRef.current = true
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: activeFile.content,
        },
        annotations: Transaction.addToHistory.of(false),
      })
      suppressRef.current = false

      const lang = resolvedLangId
        ? getLanguageSupport(resolvedLangId)
        : detectLanguage(activeFile.path)

      view.dispatch({
        effects: [
          langCompartment.current.reconfigure(lang ? [lang] : []),
          historyCompartment.current.reconfigure(history()),
        ],
      })

      const pos = view.state.selection.main.head
      const line = view.state.doc.lineAt(pos)
      setCursorPosition(line.number, pos - line.from + 1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFile?.path, resolvedLangId])

  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    view.dispatch({
      effects: tabSizeCompartment.current.reconfigure([
        EditorState.tabSize.of(tabSize),
        indentUnit.of(insertSpaces ? ' '.repeat(tabSize) : '\t'),
      ]),
    })
  }, [tabSize, insertSpaces])

  useEffect(() => {
    if (!activeFile || !viewRef.current) return
    const lang = resolvedLangId
      ? getLanguageSupport(resolvedLangId)
      : detectLanguage(activeFile.path)
    viewRef.current.dispatch({
      effects: langCompartment.current.reconfigure(lang ? [lang] : []),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedLangId])

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key === 'h') {
        e.preventDefault()
      }
      if (mod && e.key === 's') {
        e.preventDefault()
        const path = activePathRef.current
        const adapter = stateRef.current.adapter
        const view = viewRef.current
        if (!path || !adapter || !view) return

        const content = view.state.doc.toString()
        await adapter.saveFile(path, content)
        dispatch({ type: 'SAVE_FILE', path })
      }
    }

    window.addEventListener('keydown', handleKeyDown, { capture: true })
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true })
  }, [dispatch])

  return (
    <>
      {!activeFile && (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-6">
          <p className="text-sm">{t('editor.selectFile')}</p>
          <div className="flex flex-col gap-2 text-xs opacity-50">
            {[
              ['Ctrl+S', t('editor.save')],
              ['Ctrl+F', t('editor.find')],
              ['Ctrl+H', t('editor.replace')],
              ['Ctrl+B', t('editor.sidebar')],
              ['Ctrl+Z', t('editor.undo')],
            ].map(([key, label]) => (
              <span key={key} className="flex items-center gap-2">
                <kbd className="inline-flex h-5 items-center rounded border border-border bg-muted px-1.5 font-mono text-[10px]">{key}</kbd>
                <span>{label}</span>
              </span>
            ))}
          </div>
        </div>
      )}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden"
        style={activeFile ? undefined : { display: 'none' }}
      />
    </>
  )
}
