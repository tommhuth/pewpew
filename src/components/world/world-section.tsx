import random from "@huth/random"
import { useFrame } from "@react-three/fiber"
import { memo, useEffect } from "react"
import { queueEntities, removePartEntities, removeWorldPart, useStore } from "@lib/store"
import Health from "@lib/helpers/health"
import { WorldPart } from "@src/types/world"

function WorldSection({
    id,
    position,
    size,
    placements,
}: WorldPart) {
    useEffect(() => {
        queueEntities(placements.map((placement) => ({
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

    return null
}

export default memo(WorldSection)
