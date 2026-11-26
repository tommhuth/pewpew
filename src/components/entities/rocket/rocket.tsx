import { memo, useEffect, useEffectEvent, useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import random from "@huth/random"
import RocketModel, { RocketModelRef } from "./rocket-model"
import Hitbox from "@components/hitbox"
import { createExplosion } from "@components/effects/explosions"
import { createParticles } from "@components/effects/particle/particle-mesh"
import { createSmoke } from "@components/effects/smoke/smoke-mesh"
import { removeEntities, useStore } from "@lib/store"
import { WORLD_TOP_EDGE } from "@lib/const"
import { ndelta } from "@lib/helpers/utils"
import { useCollisionDetection } from "@src/hooks/use-collision-detection"
import { useGridClient } from "@src/hooks/use-grid-client"
import { Owner } from "@src/types/bullet"
import { EntityType, RocketEntity } from "@src/types/entity"
import { Tuple3 } from "@src/types/global"
import { useTransitionedState } from "@src/hooks/use-transitioned-state"
import { getTerrainHeightAt, getWorldTerrainHeightAt } from "@lib/world/terrain"

const size: Tuple3 = [2, 1.75, 1]
const particleColor = "#ed9d79"
const nozzleOffset = 2.25

type ExplosionPart = [delay: number, offset: Tuple3, radius: number]

const airExplosions: ExplosionPart[] = [
    [0, [0, 0, 0], .3],
    [150, [-.5, -size[1] * .75 - .5, -.5], .3],
    [350, [-.5, size[1] * .75 - 1, -.5], .5],
    [600, [-.5, -size[1] * .75 - 1.5, -.25], .7],
]

function explode([x, y, z]: Tuple3) {
    for (const [delay, [ox, oy, oz], radius] of airExplosions) {
        createExplosion({
            position: [x + ox, y + oy, z + oz],
            count: 20,
            radius: [radius * .5, radius],
            spread: [1, 1],
            shockwave: true,
            delay,
        })
    }

    createParticles({
        position: [x, y, z],
        speed: [0, 15],
        normal: [0, 0, 0],
        spread: [[-1, 1], [-1, 1]],
        count: [15, 20],
        radius: [.05, .3],
        color: particleColor,
        delay: 520,
    })
}

function Rocket({
    id,
    health,
    partId,
    rotation,
    position: [x, y, z],
}: RocketEntity) {
    const grid = useStore(i => i.world.grid)
    const modelRef = useRef<RocketModelRef>(null)
    const [dead, setDead] = useTransitionedState(false)
    const data = useMemo(() => ({
        // height above the placed position
        y: 0,
        speed: random.float(1, 2),
        takeoffDistance: random.float(15, 22),
        launched: false,
        smokeTime: 0,
        nextSmokeAt: 0,
    }), [])
    const client = useGridClient(
        [x, y, z],
        size,
        { id, type: EntityType.ROCKET }
    )

    useCollisionDetection({
        client,
        active: () => health.value > 0,
        bullet: ({ bullet, point, normal }) => {
            createParticles({
                position: point,
                offset: [[-.5, .5], [0, .5], [-.5, .5]],
                speed: [5, 15],
                spread: [[0, .5], [.5, 2]],
                normal,
                count: [3, 6],
                radius: [.05, .2],
                stagger: [0, 0],
                color: particleColor,
            })

            if (bullet.owner === Owner.PLAYER) {
                health.decrease(35)
                modelRef.current?.flash()
            }
        },
    })

    const handleDead = useEffectEvent(() => {
        explode([x, y + data.y, z])
        setTimeout(() => modelRef.current?.hideRocket(), 1100)
        setDead(true)
        grid.remove(client)
    })

    useEffect(() => health.onChange(value => {
        modelRef.current?.flash()

        if (value === 0) {
            handleDead()
        }
    }), [health])

    useFrame((_, delta) => {
        const model = modelRef.current
        const { player, world } = useStore.getState()

        if (!model || health.value === 0) {
            return
        }

        if (!data.launched && Math.abs(z - player.position.z) > data.takeoffDistance) {
            return
        }

        if (y + data.y > 13) {
            // out of bounds
            return removeEntities([id])
        }

        const floor = getWorldTerrainHeightAt(world.parts, { x, y, z }, true)
        const d = ndelta(delta)

        data.launched = true
        data.y += data.speed * d
        data.speed += (y + data.y > WORLD_TOP_EDGE + 2 ? 30 : .15) * d

        model.altitude = data.y
        client.position[1] = y + data.y
        grid.updateClient(client)

        if (y + data.y < 11 && y + data.y > floor + 2.85) {
            data.smokeTime += d * 1000

            // as many puffs as fit in the elapsed time, remainder carries over
            while (data.smokeTime >= data.nextSmokeAt) {
                data.smokeTime -= data.nextSmokeAt
                data.nextSmokeAt = 16

                createSmoke({ position: [x, y + data.y - nozzleOffset, z] })
            }
        }
    })

    return (
        <>
            <RocketModel
                ref={modelRef}
                position={[x, y, z]}
                rotation-y={rotation}
                dead={dead}
            />
            <Hitbox
                position={client.position}
                size={client.size}
            />
        </>
    )
}

export default memo(Rocket)
