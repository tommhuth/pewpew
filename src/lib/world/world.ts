import random from "@huth/random"
import { Vector3 } from "three"
import { WorldPart } from "@src/types/world"
import { WORLD_START_Z } from "@lib/const"
import { cellsize, d, w } from "@lib/world/terrain"
import { maps } from "./maps-loader"

export function getNextWorldPart(previous?: Pick<WorldPart, "size" | "position">): WorldPart {
    const z = previous ? previous.position.z + previous.size[1] : WORLD_START_Z
    const map = random.pick(...maps)

    return {
        id: random.id(),
        position: new Vector3(0, 0, z),
        terrain: map.terrain,
        placements: map.placements,
        size: [w * cellsize, d * cellsize],
    }
}
