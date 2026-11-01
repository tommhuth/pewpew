import { memo, useEffect, useEffectEvent, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import { BufferGeometry, Mesh } from "three"
import Model, { ModelType } from "@components/model"
import Hitbox from "@components/hitbox"
import { createExplosion } from "@components/effects/explosions"
import { createParticles, CreateParticlesParams } from "@components/effects/particle-mesh"
import { createDecal } from "@components/effects/decal-mesh"
import { removeEntities, setEntitiesFalling, useStore } from "@lib/store"
import { useCollisionDetection } from "@src/hooks/use-collision-detection"
import { useGravity } from "@src/hooks/use-gravity"
import { Owner } from "@src/types/bullet"
import { BuildingEntity, EntityType } from "@src/types/entity"
import { Tuple3 } from "@src/types/global"
import random from "@huth/random"
import { SpacebitsMaterial } from "@components/world/spacebits-material"
import { getCollisionBox } from "@lib/world/bounding-boxes"

const particleColor = "#667"

function explode([x, y, z]: Tuple3, radius: number) {
    createExplosion({
        position: [x, y, z],
        count: 50,
        radius: [radius * .3 + .1, radius * .4 + .1],
        spread: [radius, radius * 1.25],
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
    const box = useMemo(() => getCollisionBox(model, rotation), [model, rotation])
    const client = useMemo(() => {
        const [ox, oy, oz] = box.offset

        return grid.createClient([x + ox, y + oy, z + oz], box.size, { id, type: EntityType.BUILDING })
    }, [grid, id, x, y, z, box])

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

        // half the largest side, so the blast covers the building
        explode(position, Math.max(...box.size) / 2)

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
        if (model === ModelType.SPRINKLER && ref.current) {
            ref.current.rotation.y += .5 * delta
        }
    })

    useFrame(() => {
        if (!falling || !ref.current) {
            return
        }

        // keep the hitbox with the mesh
        client.position[1] = ref.current.position.y + box.offset[1]
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
