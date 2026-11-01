import { useFrame } from "@react-three/fiber"
import { useLayoutEffect } from "react"
import { addWorldPart, useStore } from "@lib/store"
import WorldSection from "./world-section"
import Entities from "@components/entities/entities"
import WorldTerrain from "./terrain/world-terrain"

export default function World() {
    const parts = useStore(i => i.world.parts)

    useLayoutEffect(() => {
        if (useStore.getState().world.parts.length === 0) {
            addWorldPart()
        }
    }, [])

    // add a new part once the last one is within reach, one per frame
    useFrame((state) => {
        const { world, player } = useStore.getState()
        const lastPart = world.parts[world.parts.length - 1]

        if (!lastPart || !player.object) {
            return
        }

        const buffer = Math.hypot(state.viewport.width, state.viewport.height) * .95

        if (lastPart.position.z + lastPart.size[1] < player.object.position.z + buffer) {
            addWorldPart()
        }
    })

    return (
        <>
            {parts.map(part => <WorldSection key={part.id} {...part} />)}
            <WorldTerrain />
            <Entities />
        </>
    )
}
