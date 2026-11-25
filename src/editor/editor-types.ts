import { Terrain } from "@lib/world/terrain"
import { ModelType } from "@components/model"
import { TreeType } from "@components/entities/tree/tree-model"
import { EntityType } from "@src/types/entity"
import { Tuple3 } from "@src/types/global"

export const EditorMode = {
    TERRAIN: "terrain",
    PLACEMENT: "placement",
} as const

export type EditorMode = typeof EditorMode[keyof typeof EditorMode]

export type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never

interface PlacementTransform {
    id: string
    position: Tuple3
    rotation: number
}

export type PlacementKind =
    | { type: ModelType }
    | { type: typeof EntityType.TURRET }
    | { type: typeof EntityType.TREE, variant: TreeType }
    | { type: typeof EntityType.PLANT, scale: number }
    | { type: typeof EntityType.ROCKET }

export type EditorPlacement = PlacementTransform & PlacementKind

export interface EditorMap {
    terrain: Terrain
    placements: EditorPlacement[]
}
