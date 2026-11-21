import { useEffect, useMemo } from "react"
import { useStore } from "@lib/store"
import { ClientData } from "@lib/helpers/spatial-hash-grid-3d"
import { Tuple3 } from "@src/types/global"

export function useGridClient(
    [px, py, pz]: Tuple3,
    [sx, sy, sz]: Tuple3,
    data: ClientData
) {
    const grid = useStore(i => i.world.grid)
    const { id, type } = data
    const client = useMemo(() => {
        return grid.createClient([px, py, pz], [sx, sy, sz], data)
    }, [grid, px, py, pz, sx, sy, sz, id, type])

    useEffect(() => {
        grid.insert(client)

        return () => grid.remove(client)
    }, [grid, client])

    return client
}
