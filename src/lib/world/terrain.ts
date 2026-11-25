import { Vector3Like } from "three"
import { smoothstep } from "three/src/math/MathUtils.js"
import { Tuple3 } from "@src/types/global"
import type { WorldPart } from "@src/types/world"

export const MAP_WIDTH = 6
export const MAP_DEPTH = 7
export const MAP_CELL_SIZE = 2
export const OUTSIDE_TERRAIN_HEIGHT = -35
// hole pieces, must match the hole meshes in terrain.glb
// shaft radius in cell local space, -1 to 1
export const TERRAIN_HOLE_RADIUS = .58
// chamfered rim, widens from the shaft to this radius over the chamfer depth
// kept under 1 so the rim stays inside the cell
export const TERRAIN_HOLE_TOP_RADIUS = .68
// chamfer depth, 30 deg from horizontal
export const TERRAIN_HOLE_CHAMFER = (TERRAIN_HOLE_TOP_RADIUS - TERRAIN_HOLE_RADIUS) * Math.tan(Math.PI / 6)

export enum TerrainType {
    SLOPE = "slope",
    SLOPE_OUTER_CORNER = "slope_outer_corner",
    SLOPE_INNER_CORNER = "slope_inner_corner",
    TALL = "tall",
    LOW = "low",
    HOLE = "hole",
    TALL_HOLE = "tall_hole",
}

export interface TerrainCell {
    type: TerrainType
    rotation: 0 | 1 | 2 | 3 // quarter turns
}

// rows along +z, cells along +x
export type Terrain = TerrainCell[][]

export const blankTerrain: Terrain = Array.from({ length: MAP_DEPTH })
    .map(() => Array.from({ length: MAP_WIDTH }).map(() => ({ type: TerrainType.LOW, rotation: 0 })))

const _origin = { x: 0, y: 0, z: 0 }

// world position of a cell, x centered on the terrain, z running from start
export function getCellPosition(x: number, z: number, start: Vector3Like = _origin): Tuple3 {
    return [
        start.x + (x - (MAP_WIDTH - 1) / 2) * MAP_CELL_SIZE,
        start.y,
        start.z + z * MAP_CELL_SIZE + MAP_CELL_SIZE / 2,
    ]
}

// world -> cell local space, -1 to 1 like the glb pieces, rotation undone
function toCellLocal(position: Vector3Like, ix: number, iz: number, startZ: number, rotation: number) {
    let u = (position.x - (ix - MAP_WIDTH / 2) * MAP_CELL_SIZE) / MAP_CELL_SIZE * 2 - 1
    let v = (position.z - startZ - iz * MAP_CELL_SIZE) / MAP_CELL_SIZE * 2 - 1

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
    startZ: number,
    ignoreHole = false
): number {
    let ix = Math.floor(position.x / MAP_CELL_SIZE + MAP_WIDTH / 2)
    let iz = Math.floor((position.z - startZ) / MAP_CELL_SIZE)
    let cell = terrain[iz]?.[ix]

    if (!cell) {
        return OUTSIDE_TERRAIN_HEIGHT
    }

    let [u, v] = toCellLocal(position, ix, iz, startZ, cell.rotation)

    if (cell.type === TerrainType.LOW) {
        return 0
    } else if (cell.type === TerrainType.TALL) {
        return 1
    } else if (cell.type === TerrainType.SLOPE) {
        // eases up along local +x across the whole cell
        return smoothstep(u, -1, 1)
    } else if (cell.type === TerrainType.SLOPE_OUTER_CORNER) {
        // rounded, eases down from the high +x -z corner
        return 1 - smoothstep(Math.hypot(1 - u, v + 1), 0, 2)
    } else if (cell.type === TerrainType.SLOPE_INNER_CORNER) {
        // rounded, eases up from the low -x +z corner
        return smoothstep(Math.hypot(u + 1, v - 1), 0, 2)
    } else if (cell.type === TerrainType.HOLE || cell.type === TerrainType.TALL_HOLE) {
        // low or tall, with a chamfered bottomless circular hole in the middle
        const top = cell.type === TerrainType.TALL_HOLE ? 1 : 0
        const distance = Math.hypot(u, v)

        if (distance < TERRAIN_HOLE_RADIUS && !ignoreHole) {
            return top - 2
        } else if (distance < TERRAIN_HOLE_TOP_RADIUS) {
            // straight slope down the chamfer
            return top - TERRAIN_HOLE_CHAMFER
                * (TERRAIN_HOLE_TOP_RADIUS - distance) / (TERRAIN_HOLE_TOP_RADIUS - TERRAIN_HOLE_RADIUS)
        }

        return top
    }

    return 0
}

// world terrain height at a position
export function getWorldTerrainHeightAt(parts: WorldPart[], position: Vector3Like, ignoreHole = false) {
    for (let i = 0, n = parts.length; i < n; i++) {
        const part = parts[i]

        if (position.z >= part.position.z && position.z < part.position.z + part.size[1]) {
            return part.position.y + getTerrainHeightAt(part.terrain, position, part.position.z, ignoreHole)
        }
    }

    return OUTSIDE_TERRAIN_HEIGHT
}
