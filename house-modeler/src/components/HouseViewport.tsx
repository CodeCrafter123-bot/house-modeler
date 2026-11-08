import { HouseScene } from '../scene/HouseScene'
import type { HouseModel } from '../types'

type HouseViewportProps = {
  houseData: HouseModel | null
  hasError: boolean
  isExpanded: boolean
  onToggleExpanded: () => void
}

export function HouseViewport({
  houseData,
  hasError,
  isExpanded,
  onToggleExpanded,
}: HouseViewportProps) {
  return (
    <section className={`panel scene-panel ${isExpanded ? 'expanded' : ''}`}>
      <button
        type="button"
        className={`scene-expand-toggle ${isExpanded ? 'is-expanded' : ''}`}
        onClick={onToggleExpanded}
        aria-label={isExpanded ? 'Collapse scene' : 'Expand scene'}
        title={isExpanded ? 'Collapse scene' : 'Expand scene'}
      >
        <span aria-hidden="true" className="scene-expand-glyph">
          {isExpanded ? '⤡' : '⤢'}
        </span>
      </button>

      {houseData && !hasError ? (
        <>
          <HouseScene house={houseData} />
          <p className="controls-hint">W A S D to walk, arrow keys to look around. Use the stairs to go up a floor.</p>
        </>
      ) : (
        <div className="placeholder">
          <p>Nothing to show yet.</p>
          <p className="placeholder-sub">Compile a house description and the model will appear here.</p>
        </div>
      )}
    </section>
  )
}
