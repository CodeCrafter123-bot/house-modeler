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
      <h1>House Modeler</h1>
      <p className="subtitle">
        Paste house JSON, send it to the fake C++ parser API, then render the final 3D shape.
      </p>

      <label htmlFor="house-input">Input JSON</label>
      <textarea
        id="house-input"
        value={inputText}
        onChange={(event) => onInputChange(event.target.value)}
        spellCheck={false}
      />

      <button type="button" onClick={onSubmit} disabled={loading}>
        {loading ? 'Parsing...' : 'Parse and Render'}
      </button>

      {error ? (
        <p className="status error" role="alert">
          {error}
        </p>
      ) : null}

      {!error && successText ? <p className="status success">{successText}</p> : null}
    </section>
  )
}
