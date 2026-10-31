import { Vector3 } from "three"
import { Tuple2 } from "./global"
import { EntityPlacement } from "./entity"
import type { Terrain } from "@lib/terrain"

export interface WorldPart {
    id: string
    terrain: Terrain
    placements: EntityPlacement[]
    // [width, depth]
    size: Tuple2
    position: Vector3
}
