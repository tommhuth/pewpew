import { Vector3Like } from "three"
import { smoothstep } from "three/src/math/MathUtils.js"
import { Tuple3 } from "@src/types/global"
import type { WorldPart } from "@src/types/world"

export const w = 6
export const d = 7
export const cellsize = 2
// reported height off the terrain grid, things there fall away
export const OUTSIDE_TERRAIN_HEIGHT = -35

export enum GroundType {
    SLOPE = "slope",
    SLOPE_OUTER_CORNER = "slope_outer_corner",
    SLOPE_INNER_CORNER = "slope_inner_corner",
    TALL = "tall",
    LOW = "low",
}

export interface TerrainCell {
    type: GroundType
    rotation: 0 | 1 | 2 | 3 // quarter turns
}

// rows along +z, cells along +x
export type Terrain = TerrainCell[][]

export const blankTerrain: Terrain = Array.from({ length: d })
    .map(() => Array.from({ length: w }).map(() => ({ type: GroundType.LOW, rotation: 0 })))

const _origin = { x: 0, y: 0, z: 0 }

// world position of a cell, x centered on the terrain, z running from start
export function getCellPosition(x: number, z: number, start: Vector3Like = _origin): Tuple3 {
    return [
        start.x + (x - (w - 1) / 2) * cellsize,
        start.y,
        start.z + z * cellsize + cellsize / 2,
    ]
}

// world -> cell local space, -1 to 1 like the glb pieces, rotation undone
function toCellLocal(position: Vector3Like, ix: number, iz: number, startZ: number, rotation: number) {
    let u = (position.x - (ix - w / 2) * cellsize) / cellsize * 2 - 1
    let v = (position.z - startZ - iz * cellsize) / cellsize * 2 - 1

    // inverse of rotation.y = +90deg is (x, z) -> (-z, x)
    // applied once per quarter turn it undoes the rotation, giving local space
    for (let i = 0; i < rotation; i++) {
        [u, v] = [-v, u]
    }

    return [u, v] as const
}

export function getTerrainHeightAt(
    terrain: Terrain,
    position: Vector3Like,
    startZ: number
): number {
    let ix = Math.floor(position.x / cellsize + w / 2)
    let iz = Math.floor((position.z - startZ) / cellsize)
    let cell = terrain[iz]?.[ix]

    if (!cell) {
        return OUTSIDE_TERRAIN_HEIGHT
    }

    let [u, v] = toCellLocal(position, ix, iz, startZ, cell.rotation)

    if (cell.type === GroundType.LOW) {
        return 0
    } else if (cell.type === GroundType.TALL) {
        return 1
    } else if (cell.type === GroundType.SLOPE) {
        // eases up along local +x across the whole cell
        return smoothstep(u, -1, 1)
    } else if (cell.type === GroundType.SLOPE_OUTER_CORNER) {
        // rounded, eases down from the high +x -z corner
        return 1 - smoothstep(Math.hypot(1 - u, v + 1), 0, 2)
    } else if (cell.type === GroundType.SLOPE_INNER_CORNER) {
        // rounded, eases up from the low -x +z corner
        return smoothstep(Math.hypot(u + 1, v - 1), 0, 2)
    }

    return 0
}

// world terrain height at a position
export function getWorldTerrainHeightAt(parts: WorldPart[], position: Vector3Like) {
    for (let i = 0, n = parts.length; i < n; i++) {
        const part = parts[i]

        if (position.z >= part.position.z && position.z < part.position.z + part.size[1]) {
            return part.position.y + getTerrainHeightAt(part.terrain, position, part.position.z)
        }
    }

    return OUTSIDE_TERRAIN_HEIGHT
}
