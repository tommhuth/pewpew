import { EntityPlacement, EntityType } from "@src/types/entity"
import { ModelType } from "@components/model"
import type { StoredMap } from "@src/editor/maps"
import { EditorPlacement } from "@src/editor/store"

// which entity a map model spawns as, models not listed are skipped 
const entityTypes: Partial<Record<ModelType, typeof EntityType.BUILDING>> = Object.fromEntries(
    Object.values(ModelType).map(i => [i, EntityType.BUILDING])
)

function iswithin(a: number, b: number, range: number) {
    return Math.abs(a - b) <= range / 2
}

function findgroup(placment: EditorPlacement, placements: EditorPlacement[]) {
    let result: EditorPlacement[] = []

    for (let other of placements) {
        if (
            iswithin(other.position[0], placment.position[0], 1)
            && iswithin(other.position[2], placment.position[2], 1)
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

export const maps = Object.values(files).map(({ terrain, placements }) => {
    // trees dont take part in stacking
    const buildings = placements.filter(i => i.type !== EntityType.TREE)

    return {
        terrain,
        placements: placements
            .map((placement) => {
                switch (placement.type) {
                    case EntityType.TREE:
                        return {
                            ...placement,
                            health: 100
                        } satisfies EntityPlacement
                    case EntityType.TURRET:
                        return {
                            ...placement,
                            group: findgroup(placement, buildings),
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
                            group: findgroup(placement, buildings),
                            model: placement.type,
                            health: 100
                        } satisfies EntityPlacement
                    }
                }
            })
            .filter(i => !!i)
    }
})
