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
  return (
    <section className="panel input-panel">
      <div className="panel-heading">
        <h2>House description</h2>
        <p>Write the house below, then compile it to see the 3D model.</p>
      </div>

      <div className="editor-box">
        <HouseCodeEditor value={inputText} error={error} onChange={onInputChange} onSubmit={onSubmit} />
      </div>

      <div className="actions">
        <button type="button" className="compile-button" onClick={onSubmit} disabled={loading}>
          {loading ? 'Compiling...' : 'Compile'}
        </button>
        <span className="shortcut-hint">or press Ctrl+Enter</span>
      </div>

      {error ? (
        <p className="status error" role="alert">
          {error}
        </p>
      ) : null}

      {!error && successText ? <p className="status success">{successText}</p> : null}
    </section>
  )
}
