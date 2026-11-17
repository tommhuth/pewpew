import { TreeType } from "@components/entities/tree/tree-model"
import { EntityType } from "@src/types/entity"
import { PlacementKind } from "./editor-types"

export const PLACEMENT_PRECISION = .25

export const defaultTurretKind: PlacementKind = {
    type: EntityType.TURRET,
}

export const defaultTreeKind: PlacementKind = {
    type: EntityType.TREE,
    variant: TreeType.TYPE3_01,
}

export const defaultPlantKind: PlacementKind = {
    type: EntityType.PLANT,
    scale: 1
}
