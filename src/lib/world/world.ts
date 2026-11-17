import random from "@huth/random"
import { Vector3 } from "three"
import { WorldPart } from "@src/types/world"
import { WORLD_START_Z } from "@lib/const"
import { MAP_CELL_SIZE, MAP_DEPTH, MAP_WIDTH } from "@lib/world/terrain"
import { parsedMaps } from "./maps-loader"
import Cycler from "@lib/helpers/cycler"

const mapCycler = new Cycler(parsedMaps)

export function getNextWorldPart(previous?: Pick<WorldPart, "size" | "position">): WorldPart {
    const z = previous ? previous.position.z + previous.size[1] : WORLD_START_Z
    const map = mapCycler.next()

    return {
        id: random.id(),
        position: new Vector3(0, 0, z),
        terrain: map.terrain,
        placements: map.placements,
        size: [MAP_WIDTH * MAP_CELL_SIZE, MAP_DEPTH * MAP_CELL_SIZE],
    }
}
