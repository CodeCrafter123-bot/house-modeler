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
          <p className="controls-hint">Move with WASD, look with Arrow keys. Gravity is enabled, so stairs are required to move up between floors.</p>
        </>
      ) : (
        <div className="placeholder">
          <p>Valid input required to render the house shape.</p>
        </div>
      )}
    </section>
  )
}
