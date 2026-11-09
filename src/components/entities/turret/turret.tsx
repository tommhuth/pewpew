import { memo, useEffect, useEffectEvent, useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import random from "@huth/random"
import TurretModel, { TurretRef } from "./turret-model"
import Hitbox from "@components/hitbox"
import { createExplosion } from "@components/effects/explosions"
import { createParticles } from "@components/effects/particle/particle-mesh"
import { createDecal } from "@components/effects/decal/decal-mesh"
import { removeEntities, useStore } from "@lib/store"
import { getCollisionBox } from "@lib/world/bounding-boxes"
import { useCollisionDetection } from "@src/hooks/use-collision-detection"
import { Owner } from "@src/types/bullet"
import { EntityType, TurretEntity } from "@src/types/entity"
import { ndelta } from "@lib/helpers/utils"
import { createBullet } from "@components/bullets"

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
    const { box, client } = useMemo(() => {
        const box = getCollisionBox(EntityType.TURRET, rotation)
        const [ox, oy, oz] = box.offset

        return {
            box,
            client: grid.createClient([x + ox, y + oy, z + oz], box.size, {
                id,
                type: EntityType.TURRET
            })
        }
    }, [rotation, grid, id, x, y, z])

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

    useEffect(() => {
        return () => {
            grid.remove(client)
        }
    }, [grid, client])

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
        let { player } = useStore.getState()
        let d = 15

        if (z - d < player.position.z && health.value > 0) {
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
