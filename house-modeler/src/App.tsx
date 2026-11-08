import { useState } from 'react'
import { compileHouse } from './api/compile'
import { HouseInputPanel } from './components/HouseInputPanel'
import { HouseViewport } from './components/HouseViewport'
import './styles/App.css'
import type { HouseModel } from './types'

function App() {
  const [inputText, setInputText] = useState("")
  const [houseData, setHouseData] = useState<HouseModel | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isSceneExpanded, setIsSceneExpanded] = useState(false)

  const onRenderHouse = async () => {
    setLoading(true)
    setError(null)
    setHouseData(null)

    try {
      const parsedHouse = await compileHouse(inputText)
      setHouseData(parsedHouse)
    } catch (parseError) {
      const message = parseError instanceof Error ? parseError.message : 'Unknown parser error'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const floorCount = houseData?.FLOORS.length ?? 0
  const successText = !error && houseData
    ? `Compiled successfully: ${floorCount} ${floorCount === 1 ? 'floor' : 'floors'}.`
    : null

  return (
    <div className="page">
      <header className="topbar">
        <h1>House Modeler</h1>
        <span className="topbar-note">Theory of Computation project</span>
      </header>

      <main className={`app-shell ${isSceneExpanded ? 'scene-expanded' : ''}`}>
        {!isSceneExpanded ? (
          <HouseInputPanel
            inputText={inputText}
            loading={loading}
            error={error}
            successText={successText}
            onInputChange={setInputText}
            onSubmit={onRenderHouse}
          />
        ) : null}
        <HouseViewport
          houseData={houseData}
          hasError={Boolean(error)}
          isExpanded={isSceneExpanded}
          onToggleExpanded={() => setIsSceneExpanded((value) => !value)}
        />
      </main>
    </div>
  )
}

export default App
