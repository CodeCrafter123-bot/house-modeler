import { HighlightStyle, StreamLanguage, syntaxHighlighting } from '@codemirror/language'
import { lintGutter, setDiagnostics, type Diagnostic } from '@codemirror/lint'
import { EditorView } from '@codemirror/view'
import { tags as t } from '@lezer/highlight'
import CodeMirror, { type ReactCodeMirrorRef } from '@uiw/react-codemirror'
import { useEffect, useRef, type KeyboardEvent } from 'react'

// Token groups mirror API/src/lexer.l (the lexer is case-insensitive).
const BLOCK_KEYWORDS = new Set(['HOUSE', 'FLOORS', 'ROOMS', 'DOORS', 'WINDOWS', 'STAIR'])
const PROPERTIES = new Set(['POSITION', 'DIRECTION', 'HEIGHT', 'WALL'])
const VALUES = new Set([
  'FRONT', 'BACK', 'LEFT', 'RIGHT',
  'LEFT_RIGHT', 'FRONT_BACK', 'RIGHT_LEFT', 'BACK_FRONT',
])

const houseLanguage = StreamLanguage.define({
  name: 'house',
  token(stream) {
    if (stream.eatSpace()) return null
    if (stream.match('//')) {
      stream.skipToEnd()
      return 'comment'
    }
    if (stream.match(/^[0-9]+/)) return 'number'

    const word = stream.match(/^[A-Za-z_]+/) as RegExpMatchArray | null
    if (word) {
      const upper = word[0].toUpperCase()
      if (BLOCK_KEYWORDS.has(upper)) return 'keyword'
      if (PROPERTIES.has(upper)) return 'propertyName'
      if (VALUES.has(upper)) return 'atom'
      return 'invalid'
    }

    const ch = stream.next()
    if (ch && '{}[]()'.includes(ch)) return 'bracket'
    if (ch === '=') return 'operator'
    return 'punctuation'
  },
  languageData: { commentTokens: { line: '//' } },
})

const highlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: '#7dd3fc', fontWeight: '600' },
  { tag: t.propertyName, color: '#c4b5fd' },
  { tag: t.atom, color: '#fbbf24' },
  { tag: t.number, color: '#86efac' },
  { tag: t.comment, color: '#64748b', fontStyle: 'italic' },
  { tag: t.bracket, color: '#94a3b8' },
  { tag: t.operator, color: '#f472b6' },
  { tag: t.punctuation, color: '#64748b' },
  { tag: t.invalid, color: '#fca5a5', textDecoration: 'underline wavy #f87171' },
])

const editorTheme = EditorView.theme(
  {
    '&': {
      height: '100%',
      backgroundColor: '#0a1322',
      color: '#e2e8f0',
      fontSize: '13.5px',
    },
    '.cm-scroller': {
      fontFamily: '"Cascadia Code", "Consolas", "Courier New", monospace',
      lineHeight: '1.6',
    },
    '.cm-content': { caretColor: '#38bdf8', padding: '10px 0' },
    '.cm-cursor': { borderLeftColor: '#38bdf8', borderLeftWidth: '2px' },
    '&.cm-focused': { outline: 'none' },
    '.cm-gutters': {
      backgroundColor: '#0a1322',
      color: '#475569',
      border: 'none',
      borderRight: '1px solid #1b2a44',
    },
    '.cm-activeLine': { backgroundColor: 'rgba(56, 189, 248, 0.06)' },
    '.cm-activeLineGutter': { backgroundColor: 'rgba(56, 189, 248, 0.1)', color: '#94a3b8' },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': {
      backgroundColor: 'rgba(56, 189, 248, 0.25) !important',
    },
    '.cm-matchingBracket': {
      backgroundColor: 'rgba(56, 189, 248, 0.2)',
      outline: '1px solid rgba(56, 189, 248, 0.5)',
    },
    '.cm-foldPlaceholder': { backgroundColor: '#1b2a44', border: 'none', color: '#94a3b8' },
    '.cm-placeholder': { color: '#475569' },
    '.cm-lintRange-error': { backgroundColor: 'rgba(248, 113, 113, 0.15)' },
    '.cm-tooltip': { backgroundColor: '#111c30', border: '1px solid #1e2d4a', color: '#e2e8f0' },
  },
  { dark: true },
)

const PLACEHOLDER = `HOUSE {
  FLOORS [
    {
      HEIGHT = 3;
      ROOMS [ { POSITION = (0,0),(4,4); DOORS [ { WALL = FRONT; } ]; } ];
      STAIR { POSITION = (1,1),(2,3); DIRECTION = FRONT_BACK; }
    }
  ];
}`

const EXTENSIONS = [
  houseLanguage,
  syntaxHighlighting(highlightStyle),
  editorTheme,
  lintGutter(),
  EditorView.lineWrapping,
]

/** Pulls the line number out of parser errors like "Error at line 12: syntax error near '}'". */
function errorLine(error: string | null): number | null {
  const match = error?.match(/line\s+(\d+)/i)
  return match ? Number(match[1]) : null
}

type HouseCodeEditorProps = {
  value: string
  error: string | null
  onChange: (value: string) => void
  onSubmit: () => void
}

export function HouseCodeEditor({ value, error, onChange, onSubmit }: HouseCodeEditorProps) {
  const editorRef = useRef<ReactCodeMirrorRef>(null)

  // Ctrl/Cmd+Enter compiles. Caught before CodeMirror so it doesn't also insert a line.
  const onKeyDownCapture = (event: KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault()
      event.stopPropagation()
      onSubmit()
    }
  }

  // Show the compiler's error on the line it points to.
  useEffect(() => {
    const view = editorRef.current?.view
    if (!view) return

    const lineNumber = errorLine(error)
    const diagnostics: Diagnostic[] = []
    if (error && lineNumber && lineNumber <= view.state.doc.lines) {
      const line = view.state.doc.line(lineNumber)
      diagnostics.push({ from: line.from, to: line.to, severity: 'error', message: error })
    }
    view.dispatch(setDiagnostics(view.state, diagnostics))
  }, [error])

  return (
    <div className="code-editor" onKeyDownCapture={onKeyDownCapture}>
      <CodeMirror
        ref={editorRef}
        value={value}
        onChange={onChange}
        extensions={EXTENSIONS}
        theme="none"
        height="100%"
        placeholder={PLACEHOLDER}
        basicSetup={{ autocompletion: false, searchKeymap: true }}
      />
    </div>
  )
}
