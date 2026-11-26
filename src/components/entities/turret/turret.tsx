import { memo, useEffect, useEffectEvent, useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import random from "@huth/random"
import TurretModel, { TurretRef } from "./turret-model"
import Hitbox from "@components/hitbox"
import { createExplosion } from "@components/effects/explosions"
import { createParticles } from "@components/effects/particle/particle-mesh"
import { createDecal } from "@components/effects/decal/decal-mesh"
import { removeEntities, State, useStore } from "@lib/store"
import { getCollisionBox } from "@lib/world/bounding-boxes"
import { useCollisionDetection } from "@src/hooks/use-collision-detection"
import { useGridClient } from "@src/hooks/use-grid-client"
import { Owner } from "@src/types/bullet"
import { EntityType, TurretEntity } from "@src/types/entity"
import { ndelta } from "@lib/helpers/utils"
import { createBullet } from "@components/bullets"
import { timeout } from "@src/timeout"

const particleColor = "#ed9d79"

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
    const turretRef = useRef<TurretRef>(null)
    const box = useMemo(() => getCollisionBox(EntityType.TURRET, rotation), [rotation])
    const client = useGridClient(
        [x + box.offset[0], y + box.offset[1], z + box.offset[2]],
        box.size,
        { id, type: EntityType.TURRET }
    )

    useCollisionDetection({
        client,
        bullet: ({ bullet, point, normal }) => {
            createParticles({
                position: point,
                offset: [[-.1, .1], [-.1, .1], [0, 0]],
                normal,
                speed: [1, 5],
                count: [2, 4],
                radius: [.05, .2],
                stagger: [0, 0],
                color: particleColor,
            })

            if (bullet.owner === Owner.PLAYER) {
                health.decrease(35)
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
            shockwave: true,
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

        timeout(() => removeEntities([id]), 200)
    })

    useEffect(() => health.onChange(value => {
        turretRef.current?.flash()

        if (value === 0) {
            handleDead()
        }
    }), [health])

    useFrame(() => {
        const position = turretRef.current?.position

        if (!falling || !position) {
            return
        }

        // keep the hitbox with the model
        client.position[1] = position.y + box.offset[1]
        grid.updateClient(client)
    })


    let nextShotAt = useRef(0)
    let time = useRef(0)

    useFrame((state, delta) => {
        let { player, state: gameState } = useStore.getState()
        // from 15 ahead of the player until 5 behind
        let inRange = player.position.z > z - 15 && player.position.z < z + 5

        if (gameState === State.READY && inRange && health.value > 0) {
            if (time.current > nextShotAt.current) {
                turretRef.current?.shoot()

                let r = 3.5

                createBullet({
                    position: [
                        x + Math.cos(rotation) * r,
                        y + .6,
                        z - Math.sin(rotation) * r
                    ],
                    rotation,
                    owner: Owner.ENEMY,
                    speed: 10,
                })
                time.current = 0
                nextShotAt.current = random.pick(300, 700, 1100, 1600, 2400)
            } else {
                time.current += ndelta(delta) * 1000
            }
        }
    })

    return (
        <>
            <TurretModel
                ref={turretRef}
                position={[x, y, z]}
                rotation-y={rotation}
                falling={falling}
            />
            <Hitbox
                position={client.position}
                size={client.size}
            />
        </>
    )
}

export default memo(Turret)
