import { HouseCodeEditor } from './HouseCodeEditor'

type HouseInputPanelProps = {
  inputText: string
  loading: boolean
  error: string | null
  successText: string | null
  onInputChange: (value: string) => void
  onSubmit: () => void
}

export function HouseInputPanel({
  inputText,
  loading,
  error,
  successText,
  onInputChange,
  onSubmit,
}: HouseInputPanelProps) {
  const lineCount = inputText ? inputText.split('\n').length : 0

  return (
    <section className="panel input-panel">
      <header className="brand">
        <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
          <path d="M4 15 16 5l12 10" />
          <path d="M8 13v13h16V13" />
          <path d="M13 26v-7h6v7" />
        </svg>
        <div>
          <h1>House Modeler</h1>
          <p className="subtitle">Theory of Computation · DSL compiler</p>
        </div>
      </header>

      <p className="intro">
        Describe a house in the modeling language, compile it with the C++ lexer and parser, then walk
        through the result in 3D.
      </p>

      <div className="editor-card">
        <div className="editor-toolbar">
          <span className="editor-tab">
            <span className="dot" aria-hidden="true" />
            house.txt
          </span>
          <span className="editor-meta">{lineCount} lines</span>
        </div>
        <div className="editor-body">
          <HouseCodeEditor value={inputText} error={error} onChange={onInputChange} onSubmit={onSubmit} />
        </div>
      </div>

      <button type="button" className="primary-button" onClick={onSubmit} disabled={loading}>
        {loading ? 'Compiling…' : 'Compile & Render'}
        <kbd>Ctrl ↵</kbd>
      </button>

      {error ? (
        <p className="status error" role="alert">
          <strong>Compile error</strong>
          {error}
        </p>
      ) : null}

      {!error && successText ? (
        <p className="status success">
          <strong>Success</strong>
          {successText}
        </p>
      ) : null}
    </section>
  )
}
