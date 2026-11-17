import { EntityPlacement, EntityType } from "@src/types/entity"
import { ModelType } from "@components/model"
import { EditorPlacement } from "@src/editor/editor-types"
import { Terrain } from "./terrain"
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

// which entity a map model spawns as, models not listed are skipped 
const entityTypes: Partial<Record<ModelType, typeof EntityType.BUILDING>> = Object.fromEntries(
    Object.values(ModelType).map(i => [i, EntityType.BUILDING])
)

function isWithin(a: number, b: number, range: number) {
    return Math.abs(a - b) <= range / 2
}

function findGroup(placment: EditorPlacement, placements: EditorPlacement[]) {
    let result: EditorPlacement[] = []

    for (let other of placements) {
        if (
            isWithin(other.position[0], placment.position[0], 1)
            && isWithin(other.position[2], placment.position[2], 1)
        ) {
            result.push(other)
        }
    }

    return result.length === 1 ? [] : result.sort((a, b) => a.position[1] - b.position[1])
}

const files = import.meta.glob<StoredMap>("/assets/maps/map/*.json", {
    eager: true,
    import: "default",
})

export const storedMaps: Record<string, StoredMap> = Object.fromEntries(
    Object.entries(files).map(([path, stored]) => [path.split("/").pop()!.replace(".json", ""), stored])
)

export const parsedMaps = Object.values(storedMaps).map(({ terrain, placements }) => {
    // trees dont take part in stacking
    const buildings = placements.filter(i => i.type !== EntityType.TREE)

    return {
        terrain,
        placements: placements
            .map((placement) => {
                switch (placement.type) {

                    case EntityType.PLANT:
                        return {
                            ...placement,
                            health: 100
                        } satisfies EntityPlacement
                    case EntityType.TREE:
                        return {
                            ...placement,
                            health: 100
                        } satisfies EntityPlacement
                    case EntityType.TURRET:
                        return {
                            ...placement,
                            group: findGroup(placement, buildings),
                            health: 100
                        } satisfies EntityPlacement
                    default: {
                        const entityType = entityTypes[placement.type]

                        if (!entityType) {
                            return null
                        }

                        return {
                            ...placement,
                            type: entityType,
                            group: findGroup(placement, buildings),
                            model: placement.type,
                            health: 100
                        } satisfies EntityPlacement
                    }
                }
            })
            .filter(i => !!i)
    }
})
