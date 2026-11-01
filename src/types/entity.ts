import { Tuple3 } from "./global"
import type { ModelType } from "@components/model"
import type { TreeType } from "@components/entities/tree/tree-model"
import type Health from "@lib/helpers/health"

export const EntityType = {
    BUILDING: "building",
    TURRET: "turret",
    TREE: "tree",
} as const

export type EntityType = typeof EntityType[keyof typeof EntityType]

type EntityGroup = { id: string, position: Tuple3 }[]

interface BasePlacement {
    // from the map, only unique within its map
    id: string
    position: Tuple3
    rotation: number
    health: number
}

interface BuildingPlacement extends BasePlacement {
    type: typeof EntityType.BUILDING
    model: ModelType
    group?: EntityGroup
}

interface TurretPlacement extends BasePlacement {
    type: typeof EntityType.TURRET
    group?: EntityGroup
}

interface TreePlacement extends BasePlacement {
    type: typeof EntityType.TREE
    variant: TreeType
}

// placed by a world part, position is part local
export type EntityPlacement = BuildingPlacement | TurretPlacement | TreePlacement

interface BaseEntity {
    id: string
    partId: string
    // the EntityPlacement it spawned from
    placementId: string
    // world space
    position: Tuple3
    rotation: number
    health: Health
}

export interface BuildingEntity extends BaseEntity {
    type: typeof EntityType.BUILDING
    model: ModelType
    group?: EntityGroup
    // lost what was under it
    falling?: boolean
}

export interface TurretEntity extends BaseEntity {
    type: typeof EntityType.TURRET
    group?: EntityGroup
    // lost what was under it
    falling?: boolean
}

export interface TreeEntity extends BaseEntity {
    type: typeof EntityType.TREE
    variant: TreeType
}

export type Entity = BuildingEntity | TurretEntity | TreeEntity
