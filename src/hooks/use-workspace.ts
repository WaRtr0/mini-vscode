import { createContext, useContext, useReducer, useCallback, type Dispatch } from 'react'
import type { FileNode, OpenFile, WorkspaceState } from '../types'
import type { WorkspaceAdapter } from '../lib/workspace-adapter'

export type WorkspaceAction =
  | { type: 'OPEN_DIR'; fileTree: FileNode[]; adapter: WorkspaceAdapter }
  | { type: 'CLOSE_WORKSPACE' }
  | { type: 'OPEN_FILE'; path: string; content: string }
  | { type: 'CLOSE_FILE'; path: string }
  | { type: 'SET_ACTIVE'; path: string }
  | { type: 'UPDATE_CONTENT'; path: string; content: string }
  | { type: 'SAVE_FILE'; path: string }
  | { type: 'REFRESH_TREE'; fileTree: FileNode[] }
  | { type: 'SET_TAB_SETTINGS'; tabSize: number; insertSpaces: boolean }
  | { type: 'SET_LANGUAGE'; path: string; languageId: string }
  | { type: 'RENAME_FILE'; oldPath: string; newPath: string }
  | { type: 'DELETE_FILES'; path: string }

const initialState: WorkspaceState = {
  adapter: null,
  fileTree: [],
  openFiles: [],
  activeFilePath: null,
  tabSize: 2,
  insertSpaces: true,
}

function workspaceReducer(state: WorkspaceState, action: WorkspaceAction): WorkspaceState {
  switch (action.type) {
    case 'OPEN_DIR':
      return {
        ...initialState,
        adapter: action.adapter,
        fileTree: action.fileTree,
        tabSize: state.tabSize,
        insertSpaces: state.insertSpaces,
      }

    case 'CLOSE_WORKSPACE':
      return { ...initialState, tabSize: state.tabSize, insertSpaces: state.insertSpaces }

    case 'OPEN_FILE': {
      const exists = state.openFiles.find((f) => f.path === action.path)
      if (exists) {
        return { ...state, activeFilePath: action.path }
      }
      const newFile: OpenFile = {
        path: action.path,
        content: action.content,
        isDirty: false,
      }
      return {
        ...state,
        openFiles: [...state.openFiles, newFile],
        activeFilePath: action.path,
      }
    }

    case 'CLOSE_FILE': {
      const filtered = state.openFiles.filter((f) => f.path !== action.path)
      let nextActive = state.activeFilePath
      if (state.activeFilePath === action.path) {
        const idx = state.openFiles.findIndex((f) => f.path === action.path)
        const neighbor = state.openFiles[idx - 1] || state.openFiles[idx + 1]
        nextActive = neighbor?.path ?? null
      }
      return {
        ...state,
        openFiles: filtered,
        activeFilePath: nextActive,
      }
    }

    case 'SET_ACTIVE':
      return { ...state, activeFilePath: action.path }

    case 'UPDATE_CONTENT':
      return {
        ...state,
        openFiles: state.openFiles.map((f) =>
          f.path === action.path ? { ...f, content: action.content, isDirty: true } : f,
        ),
      }

    case 'SAVE_FILE':
      return {
        ...state,
        openFiles: state.openFiles.map((f) =>
          f.path === action.path ? { ...f, isDirty: false } : f,
        ),
      }

    case 'REFRESH_TREE':
      return { ...state, fileTree: action.fileTree }

    case 'SET_TAB_SETTINGS':
      return { ...state, tabSize: action.tabSize, insertSpaces: action.insertSpaces }

    case 'SET_LANGUAGE':
      return {
        ...state,
        openFiles: state.openFiles.map((f) =>
          f.path === action.path ? { ...f, languageId: action.languageId } : f,
        ),
      }

    case 'RENAME_FILE': {
      const rebase = (p: string) =>
        p === action.oldPath
          ? action.newPath
          : p.startsWith(action.oldPath + '/')
            ? action.newPath + p.slice(action.oldPath.length)
            : p
      return {
        ...state,
        openFiles: state.openFiles.map((f) => {
          const updated = rebase(f.path)
          return updated !== f.path ? { ...f, path: updated } : f
        }),
        activeFilePath: state.activeFilePath ? rebase(state.activeFilePath) : null,
      }
    }

    case 'DELETE_FILES': {
      const filtered = state.openFiles.filter(
        (f) => f.path !== action.path && !f.path.startsWith(action.path + '/'),
      )
      let nextActive = state.activeFilePath
      if (
        nextActive &&
        (nextActive === action.path || nextActive.startsWith(action.path + '/'))
      ) {
        const idx = state.openFiles.findIndex((f) => f.path === nextActive)
        const neighbor = state.openFiles[idx - 1] || state.openFiles[idx + 1]
        nextActive = neighbor && filtered.includes(neighbor) ? neighbor.path : (filtered[0]?.path ?? null)
      }
      return {
        ...state,
        openFiles: filtered,
        activeFilePath: nextActive,
      }
    }

    default:
      return state
  }
}

interface WorkspaceContextValue {
  state: WorkspaceState
  dispatch: Dispatch<WorkspaceAction>
  openFile: (path: string) => Promise<void>
}

export const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

export function useWorkspaceReducer() {
  return useReducer(workspaceReducer, initialState)
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider')
  return ctx
}

export function useActiveFile() {
  const { state } = useWorkspace()
  return state.openFiles.find((f) => f.path === state.activeFilePath) ?? null
}

export function useOpenFile(
  state: WorkspaceState,
  dispatch: Dispatch<WorkspaceAction>,
) {
  return useCallback(
    async (path: string) => {
      const already = state.openFiles.find((f) => f.path === path)
      if (already) {
        dispatch({ type: 'SET_ACTIVE', path })
        return
      }
      const adapter = state.adapter as WorkspaceAdapter | null
      if (!adapter) return
      const content = await adapter.readFile(path)
      dispatch({ type: 'OPEN_FILE', path, content })
    },
    [state.openFiles, state.adapter, dispatch],
  )
}
