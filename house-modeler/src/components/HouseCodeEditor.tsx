import { HighlightStyle, StreamLanguage, syntaxHighlighting } from '@codemirror/language'
import { lintGutter, setDiagnostics, type Diagnostic } from '@codemirror/lint'
import { EditorView } from '@codemirror/view'
import { tags as t } from '@lezer/highlight'
import CodeMirror, { type ReactCodeMirrorRef } from '@uiw/react-codemirror'
import { useEffect, useRef, type KeyboardEvent } from 'react'

// Token groups mirror API/src/lexer.l (the lexer is case-insensitive).
const BLOCK_KEYWORDS = new Set(['HOUSE', 'FLOORS', 'ROOMS', 'DOORS', 'WINDOWS', 'STAIR'])
const PROPERTIES = new Set(['POSITION', 'DIRECTION', 'HEIGHT', 'WALL', 'COLOR'])
const VALUES = new Set([
  'FRONT', 'BACK', 'LEFT', 'RIGHT',
  'LEFT_RIGHT', 'FRONT_BACK', 'RIGHT_LEFT', 'BACK_FRONT',
  'RED', 'BLUE', 'GREEN', 'YELLOW', 'ORANGE', 'PURPLE', 'PINK',
  'BROWN', 'WHITE', 'BLACK', 'GRAY', 'GREY', 'BEIGE',
])

const houseLanguage = StreamLanguage.define({
  name: 'house',
  token(stream) {
    if (stream.eatSpace()) return null
    if (stream.match('//')) {
      stream.skipToEnd()
      return 'comment'
    }
    if (stream.match(/^#[0-9A-Fa-f]{6}/)) return 'atom'
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
  { tag: t.keyword, color: '#1f4e8c', fontWeight: '600' },
  { tag: t.propertyName, color: '#7a3b8f' },
  { tag: t.atom, color: '#a14a00' },
  { tag: t.number, color: '#1c6b35' },
  { tag: t.comment, color: '#8a8780', fontStyle: 'italic' },
  { tag: t.bracket, color: '#55524c' },
  { tag: t.operator, color: '#55524c' },
  { tag: t.punctuation, color: '#8a8780' },
  { tag: t.invalid, color: '#b42318', textDecoration: 'underline wavy #d92d20' },
])

const editorTheme = EditorView.theme({
  '&': {
    height: '100%',
    backgroundColor: '#ffffff',
    color: '#24221f',
    fontSize: '13.5px',
  },
  '.cm-scroller': {
    fontFamily: '"Consolas", "Courier New", monospace',
    lineHeight: '1.55',
  },
  '.cm-content': { caretColor: '#24221f', padding: '8px 0' },
  '&.cm-focused': { outline: 'none' },
  '.cm-gutters': {
    backgroundColor: '#f4f3ef',
    color: '#9a968e',
    border: 'none',
    borderRight: '1px solid #e2dfd8',
  },
  '.cm-activeLine': { backgroundColor: '#f8f6f1' },
  '.cm-activeLineGutter': { backgroundColor: '#ebe8e1', color: '#55524c' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': {
    backgroundColor: '#d7e3f4 !important',
  },
  '.cm-matchingBracket': { backgroundColor: '#e3ecd9', outline: 'none' },
  '.cm-foldPlaceholder': { backgroundColor: '#ebe8e1', border: 'none', color: '#55524c' },
  '.cm-placeholder': { color: '#b3afa6' },
  '.cm-lintRange-error': { backgroundColor: '#fde8e6' },
  '.cm-tooltip': { backgroundColor: '#ffffff', border: '1px solid #d9d5cc', color: '#24221f' },
})

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
