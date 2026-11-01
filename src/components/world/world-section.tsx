import random from "@huth/random"
import { useFrame } from "@react-three/fiber"
import { createContext, memo, useContext, useEffect, useMemo } from "react"
import { Vector3 } from "three"
import { addEntities, removePartEntities, removeWorldPart, useStore } from "@lib/store"
import Health from "@lib/helpers/health"
import { Tuple2 } from "@src/types/global"
import { WorldPart } from "@src/types/world"

interface WorldPartContext {
    position: Vector3
    size: Tuple2
}

const context = createContext<WorldPartContext>({
    position: new Vector3(),
    size: [0, 0],
})

export function useWorldPart() {
    return useContext(context)
}

// a part from its params: spawns placements as entities, <WorldTerrain> draws the terrain
function WorldSection({
    id,
    position,
    size,
    placements,
}: WorldPart) {
    const value = useMemo(() => ({ position, size }), [position, size])

    useEffect(() => {
        addEntities(placements.map((placement) => ({
            ...placement,
            id: random.id(),
            placementId: placement.id,
            partId: id,
            health: new Health(placement.health),
            position: [
                placement.position[0] + position.x,
                placement.position[1] + position.y,
                placement.position[2] + position.z,
            ],
        })))

        return () => {
            removePartEntities(id)
        }
    }, [id, position, placements])

    useFrame((state) => {
        const { player } = useStore.getState()
        const buffer = Math.hypot(state.viewport.width, state.viewport.height) * .6

        if (player.object && position.z + size[1] < player.object.position.z - buffer) {
            removeWorldPart(id)
        }
    })

    return (
        <context.Provider value={value} />
    )
}

export default memo(WorldSection)
