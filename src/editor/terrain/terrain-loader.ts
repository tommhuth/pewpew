import { TerrainCell, TerrainType, Terrain } from "@lib/world/terrain"

export interface TerrainPreset {
    name: string
    terrain: Terrain
}

// the editor writes these directly, accept here so a save doesnt reload the page 
if (import.meta.hot) {
    import.meta.hot.accept()
}

const files = import.meta.glob<Terrain>("/assets/maps/terrain/*.json", {
    eager: true,
    import: "default",
})

export const terrains: TerrainPreset[] = Object.entries(files).map(([path, terrain]) => ({
    name: path.split("/").pop()!.replace(".json", ""),
    terrain,
}))

export const terrainsByName: Record<string, Terrain> = Object.fromEntries(terrains.map(i => [i.name, i.terrain]))

// corner bits abcd -> piece, rotations are quarter turns of +y
const cells: Record<string, TerrainCell> = {
    "0000": { type: TerrainType.LOW, rotation: 0 },
    "1111": { type: TerrainType.TALL, rotation: 0 },
    // slope, high side toward +x, -z, -x, +z
    "0110": { type: TerrainType.SLOPE, rotation: 0 },
    "1100": { type: TerrainType.SLOPE, rotation: 1 },
    "1001": { type: TerrainType.SLOPE, rotation: 2 },
    "0011": { type: TerrainType.SLOPE, rotation: 3 },
    // one high corner
    "0100": { type: TerrainType.SLOPE_OUTER_CORNER, rotation: 0 },
    "1000": { type: TerrainType.SLOPE_OUTER_CORNER, rotation: 1 },
    "0001": { type: TerrainType.SLOPE_OUTER_CORNER, rotation: 2 },
    "0010": { type: TerrainType.SLOPE_OUTER_CORNER, rotation: 3 },
    // one low corner
    "1110": { type: TerrainType.SLOPE_INNER_CORNER, rotation: 0 },
    "1101": { type: TerrainType.SLOPE_INNER_CORNER, rotation: 1 },
    "1011": { type: TerrainType.SLOPE_INNER_CORNER, rotation: 2 },
    "0111": { type: TerrainType.SLOPE_INNER_CORNER, rotation: 3 },
}

// heightmap on the cell corners, (d + 1) rows by (w + 1) cols, "#" high "." low
// row 0 is the -z edge, col 0 is -x. keep first and last row low so parts tile.
// each cell reads its 4 corners, marching squares style
export function fromCorners(rows: string[]): Terrain {
    const high = (x: number, z: number) => rows[z][x] === "#"
    const terrain: Terrain = []

    for (let z = 0; z < rows.length - 1; z++) {
        const row: TerrainCell[] = []

        for (let x = 0; x < rows[z].length - 1; x++) {
            // corners: a -x-z, b +x-z, c +x+z, d -x+z
            const key = [high(x, z), high(x + 1, z), high(x + 1, z + 1), high(x, z + 1)]
                .map(Number)
                .join("")
            const cell = cells[key]

            if (!cell) {
                throw new Error(`Terrain: diagonal corners at ${x}, ${z}`)
            }

            row.push(cell)
        }

        terrain.push(row)
    }

    return terrain
}
