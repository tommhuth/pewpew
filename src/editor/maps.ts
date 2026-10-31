import type { Terrain } from "@lib/terrain"
import type { EditorPlacement } from "./store"

// map stored on disk 
export interface StoredMap {
    terrain: Terrain
    placements: EditorPlacement[]
}

// the editor loads these into its store once and writes them back itself,
// accept here so a save doesnt reload the page
// vite spots this statically, optional chaining isnt detected
if (import.meta.hot) {
    import.meta.hot.accept()
}

const files = import.meta.glob<StoredMap>("/assets/maps/map/*.json", {
    eager: true,
    import: "default",
})

// "/assets/maps/map/first.json" -> "first"
export const storedMaps: Record<string, StoredMap> = Object.fromEntries(
    Object.entries(files).map(([path, stored]) => [path.split("/").pop()!.replace(".json", ""), stored])
)
