import { useEffect, useEffectEvent } from "react"
import { useFrame } from "@react-three/fiber"
import { CollisionEventDetails, getCollisions } from "@lib/helpers/collisions"
import { Client, ClientData } from "@lib/helpers/spatial-hash-grid-3d"
import { CollisionType } from "@src/types/collision"
import { ndelta } from "@lib/helpers/utils"

type OverlapHandlers = Partial<Record<CollisionType, (data: ClientData, other: Client, delta: number) => void>>

interface UseCollisionDetectionParams extends OverlapHandlers {
    client: Client
    // a bullet hit this client
    bullet?: (details: CollisionEventDetails) => void
    // false lets bullets pass through, no re-hit guard so the bullet handler fires every frame the bullet is inside
    autoRemove?: boolean
    active?: () => boolean
}

const defaultActive = () => true

// bullet hits via event, plus per frame overlaps against the grid dispatched by the other clients type
// overlaps only run when a type handler is given, so bullet only users skip the grid query
export function useCollisionDetection({
    client,
    bullet,
    autoRemove = true,
    active = defaultActive,
    ...handlers
}: UseCollisionDetectionParams) {
    const hasBullet = !!bullet
    const hasOtherHandlers = Object.keys(handlers).length > 0
    const handleBullet = useEffectEvent((details: CollisionEventDetails) => {
        if (active()) {
            bullet?.(details)
        }
    })

    useEffect(() => {
        if (!hasBullet && autoRemove) {
            return
        }

        const onBulletCollision = (event: WindowEventMap["bulletcollision"]) => {
            if (event.detail.client !== client) {
                return
            }

            handleBullet(event.detail)

            if (!autoRemove) {
                event.preventDefault()
            }
        }

        window.addEventListener("bulletcollision", onBulletCollision)

        return () => window.removeEventListener("bulletcollision", onBulletCollision)
    }, [client, hasBullet, autoRemove])

    useFrame((state, delta) => {
        if (!active() || !hasOtherHandlers) {
            return
        }

        const collisions = getCollisions(client)

        for (let i = 0, n = collisions.length; i < n; i++) {
            const other = collisions[i]

            handlers[other.data.type]?.(other.data, other, ndelta(delta))
        }
    })
}
