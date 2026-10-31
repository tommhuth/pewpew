import { GroundType } from "@lib/terrain"
import {
    createMap,
    EditorMode,
    getCurrentMap,
    resetTerrain,
    selectMap,
    setBrush,
    setMode,
    setTerrainPreset,
    toStoredMap,
    useEditorStore,
} from "./store"
import { terrains } from "./terrain/terrains"
import { save } from "./save"

export default function EditorUi() {
    const brush = useEditorStore(i => i.brush)
    const mode = useEditorStore(i => i.mode)
    const map = useEditorStore(i => i.map)
    const maps = useEditorStore(i => i.maps)
    const terrainPreset = useEditorStore(i => i.terrainPreset)

    return (
        <>
            <div className="fixed bottom-4 left-4 right-4 z-50 flex flex-wrap gap-2 text-sm text-white pointer-events-auto">
                {Object.values(EditorMode).map(i => (
                    <button
                        key={i}
                        className={`px-2 py-1 border uppercase ${mode === i ? "bg-white text-black" : "border-white/50"}`}
                        onClick={() => setMode(i)}
                    >
                        {i}
                    </button>
                ))}


                <span className="w-4 ml-auto" />

                {mode === EditorMode.TERRAIN && Object.values(GroundType).map(type => (
                    <button
                        key={type}
                        className={`px-2 py-1 border ${brush === type ? "bg-white text-black" : "border-white/50"}`}
                        onClick={() => setBrush(type)}
                    >
                        {type.toUpperCase()}
                    </button>
                ))}
            </div>

            <div className="fixed top-4 left-4 right-4 z-50 flex gap-2 text-sm text-white pointer-events-auto">
                <label className="mr-auto flex gap-2 place-items-center">
                    Terrain
                    <select
                        className="px-2 py-1 border border-white/50 bg-black"
                        value={terrainPreset}
                        onChange={(e) => {
                            if (confirm(`Replace ground with ${e.target.value}?`)) {
                                setTerrainPreset(e.target.value)
                            }
                        }}
                    >
                        {terrains.map(i => (
                            <option key={i.name} value={i.name}>
                                {i.name}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="flex gap-2 place-items-center">
                    Map
                    <select
                        className="px-2 py-1 border border-white/50 bg-black"
                        value={map ?? ""}
                        onChange={(e) => selectMap(e.target.value)}
                    >
                        {Object.keys(maps).map(name => (
                            <option key={name} value={name}>
                                {name}
                            </option>
                        ))}
                    </select>
                </label>
                <button
                    className="px-2 py-1 border border-white/50"
                    onClick={() => {
                        const name = prompt("Map name")

                        if (!name) {
                            return
                        }

                        if (maps[name] && !confirm(`${name} exists, replace it?`)) {
                            return
                        }

                        createMap(name)
                    }}
                >
                    New
                </button>
                <button
                    className="px-2 py-1 border bg-white text-black"
                    onClick={save}
                >
                    Save
                </button>
            </div>
        </>
    )
}
