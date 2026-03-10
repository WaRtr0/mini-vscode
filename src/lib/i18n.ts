import { useSyncExternalStore } from 'react'

export type Locale = 'en' | 'fr'

const translations = {
  en: {
    // WelcomeScreen
    'welcome.subtitle': 'In-browser code editor, powered by FsBrowserSide',
    'welcome.editMode': 'Editing mode',
    'welcome.localMode': 'Live local editing',
    'welcome.draftMode': 'Draft mode',
    'welcome.localDesc': 'Direct read/write on disk',
    'welcome.draftDesc': 'Copy to browser storage (OPFS)',
    'welcome.opening': 'Opening…',
    'welcome.openFolder': 'Open a folder',
    'welcome.openError': 'Unable to open the folder. Please try again.',
    'welcome.noLocalSupport': 'Local editing is not available on this browser',

    // WorkspaceLayout
    'layout.explorer': 'Explorer',
    'layout.search': 'Search',
    'layout.searchShortcut': 'Search (Ctrl+Shift+F)',
    'layout.backHome': 'Back to home',
    'layout.hidePanel': 'Hide panel',

    // StatusBar
    'status.localMode': 'Local editing',
    'status.draftMode': 'Draft mode',
    'status.noFolder': 'No folder',

    // SearchPanel
    'search.placeholder': 'Search…',
    'search.result': '{count} result in {files} file',
    'search.results': '{count} results in {files} files',
    'search.searching': 'Searching…',
    'search.noResults': 'No results',

    // SyncToolbar
    'sync.modif': 'modif.',
    'sync.syncDisk': 'Sync to disk',
    'sync.noFirefox': 'Not compatible with Firefox — use the .zip',

    // IndentSettingsDialog
    'indent.title': 'Indentation',
    'indent.type': 'Type',
    'indent.size': 'Size',
    'indent.apply': 'Apply',

    // LanguagePickerDialog
    'langPicker.title': 'Language',
    'langPicker.filter': 'Filter…',
    'langPicker.noResults': 'No language found',

    // FileExplorer
    'explorer.empty': 'No folder open',
    'explorer.newFile': 'New file',
    'explorer.newFolder': 'New folder',
    'explorer.refresh': 'Refresh',
    'explorer.collapseAll': 'Collapse folders',
    'explorer.paste': 'Paste',
    'explorer.folderName': 'Folder name…',
    'explorer.fileName': 'File name…',
    'explorer.deleteConfirm': 'Delete "{name}"?',
    'explorer.deleteMultiple': 'Delete {count} items?',

    // FileTreeNode
    'tree.cut': 'Cut',
    'tree.copy': 'Copy',
    'tree.paste': 'Paste',
    'tree.copyPath': 'Copy path',
    'tree.copyRelativePath': 'Copy relative path',
    'tree.rename': 'Rename',
    'tree.delete': 'Delete',

    // CodeEditor
    'editor.selectFile': 'Select a file to edit',
    'editor.save': 'Save',
    'editor.find': 'Find',
    'editor.replace': 'Replace',
    'editor.sidebar': 'Sidebar',
    'editor.undo': 'Undo',

    // LocaleSelector
    'locale.label': 'Language',
  },
  fr: {
    'welcome.subtitle': 'Éditeur de code dans le navigateur, propulsé par FsBrowserSide',
    'welcome.editMode': "Mode d'édition",
    'welcome.localMode': 'Édition locale en direct',
    'welcome.draftMode': 'Mode brouillon',
    'welcome.localDesc': 'Lecture/écriture directe sur le disque',
    'welcome.draftDesc': 'Copie vers le stockage du navigateur (OPFS)',
    'welcome.opening': 'Ouverture…',
    'welcome.openFolder': 'Ouvrir un dossier',
    'welcome.openError': "Impossible d'ouvrir le dossier. Veuillez réessayer.",
    'welcome.noLocalSupport': "L'édition locale n'est pas disponible sur ce navigateur",

    'layout.explorer': 'Explorateur',
    'layout.search': 'Recherche',
    'layout.searchShortcut': 'Rechercher (Ctrl+Shift+F)',
    'layout.backHome': "Retour à l'accueil",
    'layout.hidePanel': 'Masquer le panneau',

    'status.localMode': 'Édition locale',
    'status.draftMode': 'Mode brouillon',
    'status.noFolder': 'Aucun dossier',

    'search.placeholder': 'Rechercher…',
    'search.result': '{count} résultat dans {files} fichier',
    'search.results': '{count} résultats dans {files} fichiers',
    'search.searching': 'Recherche en cours…',
    'search.noResults': 'Aucun résultat',

    'sync.modif': 'modif.',
    'sync.syncDisk': 'Sync disque',
    'sync.noFirefox': 'Non compatible Firefox — utilisez le .zip',

    'indent.title': 'Indentation',
    'indent.type': 'Type',
    'indent.size': 'Taille',
    'indent.apply': 'Appliquer',

    'langPicker.title': 'Langage',
    'langPicker.filter': 'Filtrer…',
    'langPicker.noResults': 'Aucun langage trouvé',

    'explorer.empty': 'Aucun dossier ouvert',
    'explorer.newFile': 'Nouveau fichier',
    'explorer.newFolder': 'Nouveau dossier',
    'explorer.refresh': 'Rafraîchir',
    'explorer.collapseAll': 'Réduire les dossiers',
    'explorer.paste': 'Coller',
    'explorer.folderName': 'Nom du dossier…',
    'explorer.fileName': 'Nom du fichier…',
    'explorer.deleteConfirm': 'Supprimer « {name} » ?',
    'explorer.deleteMultiple': 'Supprimer {count} éléments ?',

    'tree.cut': 'Couper',
    'tree.copy': 'Copier',
    'tree.paste': 'Coller',
    'tree.copyPath': 'Copier le chemin',
    'tree.copyRelativePath': 'Copier le chemin relatif',
    'tree.rename': 'Renommer',
    'tree.delete': 'Supprimer',

    'editor.selectFile': 'Sélectionnez un fichier pour l\'éditer',
    'editor.save': 'Sauvegarder',
    'editor.find': 'Rechercher',
    'editor.replace': 'Remplacer',
    'editor.sidebar': 'Sidebar',
    'editor.undo': 'Annuler',

    'locale.label': 'Langue',
  },
} as const

export type TranslationKey = keyof (typeof translations)['en']

const STORAGE_KEY = 'mini-vscode-locale'

const listeners = new Set<() => void>()
let currentLocale: Locale = (localStorage.getItem(STORAGE_KEY) as Locale) || 'en'

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => { listeners.delete(cb) }
}

function getSnapshot(): Locale {
  return currentLocale
}

function notify() {
  listeners.forEach((cb) => cb())
}

export function setLocale(locale: Locale) {
  if (locale === currentLocale) return
  currentLocale = locale
  localStorage.setItem(STORAGE_KEY, locale)
  notify()
}

export function useLocale(): Locale {
  return useSyncExternalStore(subscribe, getSnapshot)
}

export function useT() {
  const locale = useLocale()
  return function t(key: TranslationKey, params?: Record<string, string | number>): string {
    let text: string = translations[locale][key] ?? translations.en[key] ?? key
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(`{${k}}`, String(v))
      }
    }
    return text
  }
}
