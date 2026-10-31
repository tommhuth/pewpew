import { Vector3Like } from "three"
import { Tuple3 } from "@src/types/global"
import { CollisionType } from "@src/types/collision"

interface Bounds {
    minX: number
    minY: number
    minZ: number
    maxX: number
    maxY: number
    maxZ: number
}

export interface Client extends Bounds {
    position: Tuple3
    size: Tuple3
    lastQueryId: number
    data: ClientData
}

export interface ClientData {
    id: string
    type: CollisionType
}

type Cell = Set<Client>

export class SpatialHashGrid3D {
    public grid = new Map<number, Map<number, Map<number, Cell>>>()
    private cellSizeX: number
    private cellSizeY: number
    private cellSizeZ: number
    private queryId = 0
    private scratchBounds: Bounds = { minX: 0, minY: 0, minZ: 0, maxX: 0, maxY: 0, maxZ: 0 }
    private scratchResult: Client[] = []

    constructor(cellSize: Tuple3) {
        this.cellSizeX = cellSize[0]
        this.cellSizeY = cellSize[1]
        this.cellSizeZ = cellSize[2]
    }

    private computeBounds(position: Tuple3 | Vector3Like, size: Tuple3, out: Bounds) {
        const x = Array.isArray(position) ? position[0] : position.x
        const y = Array.isArray(position) ? position[1] : position.y
        const z = Array.isArray(position) ? position[2] : position.z
        const halfX = size[0] / 2
        const halfY = size[1] / 2
        const halfZ = size[2] / 2

        out.minX = Math.floor((x - halfX) / this.cellSizeX)
        out.minY = Math.floor((y - halfY) / this.cellSizeY)
        out.minZ = Math.floor((z - halfZ) / this.cellSizeZ)
        out.maxX = Math.floor((x + halfX) / this.cellSizeX)
        out.maxY = Math.floor((y + halfY) / this.cellSizeY)
        out.maxZ = Math.floor((z + halfZ) / this.cellSizeZ)
    }

    private getCell(x: number, y: number, z: number) {
        return this.grid.get(x)?.get(y)?.get(z)
    }

    private getOrCreateCell(x: number, y: number, z: number) {
        let column = this.grid.get(x)

        if (!column) {
            column = new Map()
            this.grid.set(x, column)
        }

        let row = column.get(y)

        if (!row) {
            row = new Map()
            column.set(y, row)
        }

        let cell = row.get(z)

        if (!cell) {
            cell = new Set()
            row.set(z, cell)
        }

        return cell
    }

    private insert(client: Client) {
        this.computeBounds(client.position, client.size, client)

        for (let x = client.minX; x <= client.maxX; x++) {
            for (let y = client.minY; y <= client.maxY; y++) {
                for (let z = client.minZ; z <= client.maxZ; z++) {
                    this.getOrCreateCell(x, y, z).add(client)
                }
            }
        }
    }

    // query id marks clients already collected, so no includes() scan for dupes
    // returned array is reused across calls, do not retain past next findNear
    public findNear(position: Tuple3 | Vector3Like, size: Tuple3) {
        const bounds = this.scratchBounds

        this.computeBounds(position, size, bounds)

        const result = this.scratchResult

        result.length = 0

        const queryId = ++this.queryId

        for (let x = bounds.minX; x <= bounds.maxX; x++) {
            for (let y = bounds.minY; y <= bounds.maxY; y++) {
                for (let z = bounds.minZ; z <= bounds.maxZ; z++) {
                    const cell = this.getCell(x, y, z)

                    if (cell) {
                        for (const client of cell) {
                            if (client.lastQueryId !== queryId) {
                                client.lastQueryId = queryId
                                result.push(client)
                            }
                        }
                    }
                }
            }
        }

        return result
    }

    public createClient(position: Tuple3, size: Tuple3, data: ClientData): Client {
        const client: Client = {
            position,
            size,
            data,
            minX: 0,
            minY: 0,
            minZ: 0,
            maxX: 0,
            maxY: 0,
            maxZ: 0,
            lastQueryId: 0,
        }

        this.insert(client)

        return client
    }

    public remove(client: Client) {
        for (let x = client.minX; x <= client.maxX; x++) {
            for (let y = client.minY; y <= client.maxY; y++) {
                for (let z = client.minZ; z <= client.maxZ; z++) {
                    const column = this.grid.get(x)
                    const row = column?.get(y)
                    const cell = row?.get(z)

                    if (cell && row && column) {
                        cell.delete(client)

                        if (cell.size === 0) {
                            row.delete(z)

                            if (row.size === 0) {
                                column.delete(y)

                                if (column.size === 0) {
                                    this.grid.delete(x)
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // only reinserts when the covered cell range changed
    public updateClient(client: Client) {
        const bounds = this.scratchBounds

        this.computeBounds(client.position, client.size, bounds)

        if (
            client.minX !== bounds.minX
            || client.minY !== bounds.minY
            || client.minZ !== bounds.minZ
            || client.maxX !== bounds.maxX
            || client.maxY !== bounds.maxY
            || client.maxZ !== bounds.maxZ
        ) {
            this.remove(client)
            this.insert(client)
        }
    }
}
