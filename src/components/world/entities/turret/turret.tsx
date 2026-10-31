import { memo, useEffect, useEffectEvent, useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { LineSegments } from "three"
import random from "@huth/random"
import TurretModel, { TurretRef, turretSize } from "./turret-model"
import Hitbox from "@components/hitbox"
import { createExplosion } from "@components/explosions/explosions"
import { createParticles } from "@components/explosions/particle-mesh"
import { createDecal } from "@components/explosions/decal-mesh"
import { removeEntities, useStore } from "@lib/store"
import { useCollisionDetection } from "@src/hooks/use-collision-detection"
import { Owner } from "@src/types/bullet"
import { EntityType, TurretEntity } from "@src/types/entity"

// mid step of the body swatch (col 4, row 1) in the spacebits texture
const particleColor = "#c8490f"

function Turret({
    id,
    health,
    position: [x, y, z],
    rotation,
    group,
    placementId,
    falling,
}: TurretEntity) {
    const grid = useStore(i => i.world.grid)
    const ref = useRef<TurretRef>(null)
    const debugRef = useRef<LineSegments>(null)
    const client = useMemo(() => {
        return grid.createClient([x, y + turretSize[1] / 2, z], turretSize, { id, type: EntityType.TURRET })
    }, [grid, id, x, y, z])

    useCollisionDetection({
        client,
        bullet: ({ bullet }) => {
            // on the face toward the player
            createParticles({
                position: [bullet.line.position.x, bullet.line.position.y, client.position[2] - client.size[2] / 2],
                offset: [[-.1, .1], [-.1, .1], [0, 0]],
                normal: [0, 0, -1],
                speed: [1, 5],
                count: [2, 4],
                radius: [.05, .15],
                stagger: [0, 0],
                color: particleColor,
            })

            if (bullet.owner === Owner.PLAYER) {
                health.decrease(25)
            }
        },
    })

    const handleDead = useEffectEvent(() => {
        const radius = random.float(.3, .4)

        createExplosion({
            position: client.position,
            count: 30,
            radius: [radius * .25, radius * 1.5],
            spread: [radius, radius * 3],
            shockwave: random.float(radius * 6, radius * 8),
        })
        createParticles({
            position: client.position,
            offset: [[-.5, .5], [-.5, .5], [-.5, .5]],
            speed: [2.5, 12.5],
            normal: [0, 1, 0],
            spread: [[-1, 1], [-1, 1]],
            count: [16, 20],
            radius: [.01, .2],
            color: particleColor,
            stagger: [-150, 0],
        })

        // falling ones die in the air
        if (!group?.length || group[0].id === placementId) {
            createDecal([x, y, z])
        }

        setTimeout(() => removeEntities([id]), 200)
    })

    useEffect(() => health.onChange(value => {
        if (value === 0) {
            handleDead()
        }
    }), [health])

    useFrame(() => {
        const position = ref.current?.position

        if (!falling || !position) {
            return
        }

        // keep the hitbox with the model
        client.position[1] = position.y + turretSize[1] / 2
        grid.updateClient(client)
        debugRef.current?.position.fromArray(client.position)
    })

    useEffect(() => {
        const iid = setInterval(() => ref.current?.shoot(), 2_000)

        return () => {
            clearInterval(iid)
            grid.remove(client)
        }
    }, [grid, client])

    return (
        <>
            <TurretModel
                ref={ref}
                position={[x, y, z]}
                rotation-y={rotation}
                falling={falling}
            />
            <Hitbox
                ref={debugRef}
                position={client.position}
                size={client.size}
            />
        </>
    )
}

export default memo(Turret)
