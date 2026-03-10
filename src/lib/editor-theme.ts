import { EditorView } from '@codemirror/view'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags } from '@lezer/highlight'

const bg = '#1a1b26'
const fg = '#c0caf5'
const selection = '#33467c'
const cursor = '#c0caf5'
const activeLine = '#1e2030'
const gutterBg = '#1a1b26'
const gutterFg = '#3b4261'
const gutterActiveFg = '#737aa2'
const lineHighlight = '#292e42'

const editorTheme = EditorView.theme(
  {
    '&': {
      color: fg,
      backgroundColor: bg,
      height: '100%',
    },
    '.cm-content': {
      caretColor: cursor,
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: cursor,
    },
    '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
      {
        backgroundColor: selection,
      },
    '.cm-panels': { backgroundColor: bg, color: fg },
    '.cm-panels.cm-panels-top': { borderBottom: '1px solid #292e42' },
    '.cm-panels.cm-panels-bottom': { borderTop: '1px solid #292e42' },
    '.cm-searchMatch': {
      backgroundColor: '#3d59a133',
      outline: '1px solid #7aa2f766',
    },
    '.cm-searchMatch.cm-searchMatch-selected': {
      backgroundColor: '#3d59a166',
    },
    '.cm-activeLine': { backgroundColor: activeLine },
    '.cm-selectionMatch': { backgroundColor: '#3d59a133' },
    '&.cm-focused .cm-matchingBracket, &.cm-focused .cm-nonmatchingBracket': {
      backgroundColor: '#3d59a155',
      outline: '1px solid #7aa2f744',
    },
    '.cm-gutters': {
      backgroundColor: gutterBg,
      color: gutterFg,
      border: 'none',
    },
    '.cm-activeLineGutter': {
      backgroundColor: lineHighlight,
      color: gutterActiveFg,
    },
    '.cm-foldPlaceholder': {
      backgroundColor: 'transparent',
      border: 'none',
      color: '#565f89',
    },
    '.cm-tooltip': {
      border: '1px solid #292e42',
      backgroundColor: '#1f2335',
    },
    '.cm-tooltip .cm-tooltip-arrow:before': {
      borderTopColor: 'transparent',
      borderBottomColor: 'transparent',
    },
    '.cm-tooltip .cm-tooltip-arrow:after': {
      borderTopColor: '#1f2335',
      borderBottomColor: '#1f2335',
    },
    '.cm-tooltip-autocomplete': {
      '& > ul > li[aria-selected]': {
        backgroundColor: selection,
        color: fg,
      },
    },
    '.cm-scroller': { overflow: 'auto' },
  },
  { dark: true },
)

const highlightStyles = HighlightStyle.define([
  { tag: tags.keyword, color: '#bb9af7' },
  { tag: [tags.name, tags.deleted, tags.character, tags.macroName], color: '#c0caf5' },
  { tag: [tags.function(tags.variableName)], color: '#7aa2f7' },
  { tag: [tags.labelName], color: '#c0caf5' },
  { tag: [tags.color, tags.constant(tags.name), tags.standard(tags.name)], color: '#ff9e64' },
  { tag: [tags.definition(tags.name), tags.separator], color: '#c0caf5' },
  { tag: [tags.brace], color: '#c0caf5' },
  { tag: [tags.annotation], color: '#e0af68' },
  { tag: [tags.number, tags.changed, tags.annotation, tags.modifier, tags.self, tags.namespace], color: '#ff9e64' },
  { tag: [tags.typeName, tags.className], color: '#2ac3de' },
  { tag: [tags.operator, tags.operatorKeyword], color: '#89ddff' },
  { tag: [tags.tagName], color: '#f7768e' },
  { tag: [tags.squareBracket], color: '#c0caf5' },
  { tag: [tags.angleBracket], color: '#89ddff' },
  { tag: [tags.attributeName], color: '#bb9af7' },
  { tag: [tags.regexp], color: '#b4f9f8' },
  { tag: [tags.quote], color: '#9ece6a' },
  { tag: [tags.string], color: '#9ece6a' },
  { tag: tags.link, color: '#73daca', textDecoration: 'underline', textUnderlineOffset: '3px' },
  { tag: [tags.url, tags.escape, tags.special(tags.string)], color: '#ff9e64' },
  { tag: [tags.meta], color: '#73daca' },
  { tag: [tags.comment], color: '#565f89', fontStyle: 'italic' },
  { tag: tags.strong, fontWeight: 'bold', color: '#ff9e64' },
  { tag: tags.emphasis, fontStyle: 'italic', color: '#bb9af7' },
  { tag: tags.strikethrough, textDecoration: 'line-through' },
  { tag: tags.heading, fontWeight: 'bold', color: '#7aa2f7' },
  { tag: tags.heading1, fontWeight: 'bold', color: '#f7768e' },
  { tag: [tags.heading2, tags.heading3, tags.heading4], fontWeight: 'bold', color: '#ff9e64' },
  { tag: [tags.heading5, tags.heading6], color: '#e0af68' },
  { tag: [tags.atom, tags.bool, tags.special(tags.variableName)], color: '#ff9e64' },
  { tag: [tags.processingInstruction, tags.inserted], color: '#9ece6a' },
  { tag: [tags.contentSeparator], color: '#e0af68' },
  { tag: tags.invalid, color: '#ff5370', textDecoration: 'underline wavy' },
])

export const vividDark = [editorTheme, syntaxHighlighting(highlightStyles)]
