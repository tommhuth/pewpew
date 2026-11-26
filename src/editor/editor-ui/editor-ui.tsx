import { TerrainType } from "@lib/world/terrain"
import {
    createMap,
    selectMap,
    setBrush,
    setMode,
    setTerrainPreset,
    useEditorStore,
} from "../store"
import { EditorMode } from "../editor-types"
import { terrains } from "../terrain/terrain-loader"
import { save } from "../save"
import PlacementPanel from "../model-placer/placement-panel"

export default function EditorUi() {
    const brush = useEditorStore(i => i.brush)
    const mode = useEditorStore(i => i.mode)
    const map = useEditorStore(i => i.map)
    const maps = useEditorStore(i => i.maps)
    const terrainPreset = useEditorStore(i => i.terrainPreset)

    return (
        <>
            <div className="fixed bottom-0 bg-[#000000aa] left-0 p-4 right-0 z-50 flex flex-wrap gap-2 text-sm text-white pointer-events-auto">
                {/* sits on top of this bar, whatever height it wraps to */}
                <PlacementPanel className="absolute left-4 bottom-full mb-4" />

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

                {mode === EditorMode.TERRAIN && (
                    <div className="flex flex-wrap gap-2  ">
                        {Object.values(TerrainType).map(type => (
                            <button
                                key={type}
                                className={`px-2 py-1 border ${brush === type ? "bg-white text-black" : "border-white/50"}`}
                                onClick={() => setBrush(type)}
                            >
                                {type.toUpperCase()}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="fixed  bg-[#000000aa] left-0 p-4 right-0 top-0 z-50 flex gap-2 text-sm text-white pointer-events-auto">
                <label className="mr-auto flex gap-2 place-items-center">
                    <span className="sr-only">Terrain</span>
                    <select
                        className="px-2 py-1 border border-white/50 bg-black"
                        value={terrainPreset}
                        onChange={(e) => {
                            if (confirm(`Replace terrain with ${e.target.value}?`)) {
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
                    <span className="sr-only">Map</span>
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
