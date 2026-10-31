import { memo, useEffect, useEffectEvent, useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { BufferGeometry, Mesh } from "three"
import Model, { ModelType } from "@components/model"
import Hitbox from "@components/hitbox"
import { createExplosion } from "@components/explosions/explosions"
import { createParticles, CreateParticlesParams } from "@components/explosions/particle-mesh"
import { createDecal } from "@components/explosions/decal-mesh"
import { removeEntities, setEntitiesFalling, useStore } from "@lib/store"
import { useCollisionDetection } from "@src/hooks/use-collision-detection"
import { useGravity } from "@src/hooks/use-gravity"
import { Owner } from "@src/types/bullet"
import { BuildingEntity, EntityType } from "@src/types/entity"
import { Tuple3 } from "@src/types/global"
import random from "@huth/random"
import { SpacebitsMaterial } from "@lib/materials"

// basemodule_a is ~2x1x2 sitting on y 0
const defaultSize: Tuple3 = [2, 1, 2]
// unrotated hitbox per model, sitting on y 0, from models.glb bounds
const sizes: Partial<Record<ModelType, Tuple3>> = {
    [ModelType.BASEMODULE_E]: [2, 1.65, 2],
    // narrow along z, 90 deg rotation turns that into world width
    [ModelType.TUNNEL_STRAIGHT_B]: [2, 1, .8],
    // tall enough to cover a sprinkler on top, sprinkler mesh tops out at .5
    [ModelType.SPACE_FARM_LARGE]: [2, .5, 2],
    [ModelType.SPACE_FARM_LARGE_SPRINKLER]: [2, .5, 2],
    [ModelType.SPRINKLER]: [2, .4, 2],
}
// barrel particle color
const particleColor = "#667"

function explode([x, y, z]: Tuple3) {
    const radius = random.float(.35, .45)

    createExplosion({
        position: [x, y, z],
        count: 50,
        radius: [radius * .25, radius * 1.5],
        spread: [radius, radius * 3],
        shockwave: random.float(radius * 6, radius * 8),
    })
    createParticles({
        position: [x, y, z],
        offset: [[-1, 1], [-1, 1], [-1, 1]],
        speed: [2.5, 12.5],
        normal: [0, 1, 0],
        spread: [[-1, 1], [-1, 1]],
        count: [30, 40],
        radius: [.01, .2],
        color: particleColor,
        stagger: [-150, 0],
    })
}

function Building({
    id,
    model,
    health,
    position: [x, y, z],
    rotation,
    group,
    placementId,
    partId,
    falling,
}: BuildingEntity) {
    const ref = useGravity<Mesh<BufferGeometry, SpacebitsMaterial>>(!!falling)
    const grid = useStore(i => i.world.grid)
    const size = sizes[model] ?? defaultSize
    const client = useMemo(() => {
        const cos = Math.abs(Math.cos(rotation))
        const sin = Math.abs(Math.sin(rotation))
        const aabb: Tuple3 = [
            size[0] * cos + size[2] * sin,
            size[1],
            size[0] * sin + size[2] * cos,
        ]

        return grid.createClient([x, y + size[1] / 2, z], aabb, { id, type: EntityType.BUILDING })
    }, [grid, id, x, y, z, rotation, size])

    useCollisionDetection({
        client,
        bullet: ({ bullet }) => {
            let shared = {
                radius: [.05, .15],
                stagger: [0, 0],
                color: particleColor,
            } satisfies Partial<CreateParticlesParams>

            createParticles({
                position: [
                    bullet.line.position.x,
                    bullet.line.position.y,
                    client.position[2] - client.size[2] / 2
                ],
                offset: [[-.1, .1], [-.1, .1], [0, 0]],
                normal: [0, 0, -1],
                speed: [1, 5],
                count: [2, 4],
                ...shared
            })

            createParticles({
                position: [x, y, z],
                offset: [[-.5, .5], [-.5, .5], [-.5, .5]],
                normal: [0, 0, 0],
                spread: [[-1, 1], [0, .5]],
                speed: [5, 10],
                count: [3, 5],
                ...shared
            })

            if (bullet.owner === Owner.PLAYER) {
                health.decrease(25)
            }
        },
    })

    const handleDead = useEffectEvent(() => {
        // falling ones have moved down since spawn
        const position: Tuple3 = ref.current ? ref.current.position.toArray() : [x, y, z]

        explode(position)

        // only the one on the ground leaves a mark, group is sorted bottom up
        if (!group?.length || group[0].id === placementId) {
            createDecal(position)
        }

        setTimeout(() => {
            removeEntities([id])
        }, 200)

        // falling ones were set off by a cascade from below that already covers everything above
        if (!falling && group?.length) {
            // placement ids repeat across parts, so match within this part only
            let groupitems = useStore.getState().world.entities
                .filter(i => i.partId === partId && group.some(g => g.id === i.placementId))
                .sort((a, b) => a.position[1] - b.position[1])
            let indx = groupitems.findIndex(i => i.id === id)

            // everything above falls then dies, further away starts later
            // no cleanup, these outlive the 200ms unmount
            for (let i = indx + 1; i < groupitems.length; i++) {
                let dur = i - indx

                setTimeout(() => {
                    setEntitiesFalling([groupitems[i].id])
                }, random.integer(100, 170) * dur)

                setTimeout(() => {
                    groupitems[i].health.decrease(100)
                }, random.integer(250, 450) * dur)
            }
        }
    })

    useEffect(() => {
        return health.onChange(value => {
            if (ref.current) {
                ref.current.material.uHealth.value = value / 100
            }

            if (value === 0) {
                handleDead()
            }
        })
    }, [health])

    useEffect(() => {
        return () => grid.remove(client)
    }, [grid, client])

    useFrame((state, delta) => {
        if (model === ModelType.SPRINKLER) {
            ref.current.rotation.y += .5 * delta
        }
    })

    useFrame(() => {
        if (!falling || !ref.current) {
            return
        }

        // keep the hitbox with the mesh
        client.position[1] = ref.current.position.y + size[1] / 2
        grid.updateClient(client)
    })

    return (
        <>
            <Model
                ref={ref}
                type={model}
                position={[x, y, z]}
                rotation-y={rotation}
            >
                <spacebitsMaterial attach={"material"} />
            </Model>
            <Hitbox
                position={client.position}
                size={client.size}
            />
        </>
    )
}

export default memo(Building)
