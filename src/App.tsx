import { useMemo, useCallback, useState } from 'react'
import { WorkspaceLayout } from './components/WorkspaceLayout'
import { WelcomeScreen } from './components/WelcomeScreen'
import {
  WorkspaceContext,
  useWorkspaceReducer,
  useOpenFile,
} from './hooks/use-workspace'
import { LocalAdapter, OpfsAdapter } from './lib/workspace-adapter'
import type { EditorMode } from './types'

function App() {
  const [state, dispatch] = useWorkspaceReducer()
  const openFile = useOpenFile(state, dispatch)
  const [error, setError] = useState<string | null>(null)

  const ctxValue = useMemo(
    () => ({ state, dispatch, openFile }),
    [state, dispatch, openFile],
  )

  const handleOpen = useCallback(
    async (mode: EditorMode, handle?: FileSystemDirectoryHandle, files?: File[]) => {
      setError(null)
      try {
        if (mode === 'local' && handle) {
          const adapter = new LocalAdapter(handle)
          const fileTree = await adapter.listDir('/')
          dispatch({ type: 'OPEN_DIR', fileTree, adapter })
        } else {
          const adapter = new OpfsAdapter(handle)
          await adapter.openDirectory()
          if (handle) {
            await adapter.initFromHandle(handle)
          } else if (files && files.length > 0) {
            await adapter.initFromFiles(files)
          }
          const fileTree = await adapter.listDir('/')
          dispatch({ type: 'OPEN_DIR', fileTree, adapter })
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erreur lors de l'ouverture"
        setError(msg)
        console.error('handleOpen error:', err)
      }
    },
    [dispatch],
  )

  if (!state.adapter) {
    return <WelcomeScreen onOpen={handleOpen} error={error} />
  }

  return (
    <WorkspaceContext.Provider value={ctxValue}>
      <WorkspaceLayout />
    </WorkspaceContext.Provider>
  )
}

export default App
