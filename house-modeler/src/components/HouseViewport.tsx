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
          <svg className="placeholder-icon" viewBox="0 0 32 32" aria-hidden="true">
            <path d="M4 15 16 5l12 10" />
            <path d="M8 13v13h16V13" />
            <path d="M13 26v-7h6v7" />
          </svg>
          <p className="placeholder-title">No model yet</p>
          <p>Write a house description and press Compile &amp; Render to see it in 3D.</p>
        </div>
      )}
    </section>
  )
}
