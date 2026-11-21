import { memo, useEffect, useEffectEvent, useMemo, useRef } from "react"
import Hitbox from "@components/hitbox"
import { createLeaves } from "@components/effects/leaf/leaf-mesh"
import { removeEntities } from "@lib/store"
import { useCollisionDetection } from "@src/hooks/use-collision-detection"
import { useGridClient } from "@src/hooks/use-grid-client"
import { Owner } from "@src/types/bullet"
import { EntityType, PlantEntity } from "@src/types/entity"
import PlantModel from "./plant-model"
import { plantPool } from "./plant-material"
import { getCollisionBox } from "@lib/world/bounding-boxes"
import { SpacebitsMaterial } from "@components/world/spacebits-material"
import { BufferGeometry, Mesh } from "three"
import { useMaterialSwap } from "@src/hooks/use-material-swap"

const coll = getCollisionBox("plant", 0)

export const crownColor = "#60c439"

function Plant({
    id,
    health,
    scale,
    rotation,
    position: [x, y, z],
}: PlantEntity) {
    const ref = useRef<Mesh<BufferGeometry, SpacebitsMaterial>>(null)
    const damagedBy = useMemo(() => new Set<string>(), [])
    const client = useGridClient(
        [x, y + coll.offset[1], z],
        coll.size,
        { id, type: EntityType.PLANT }
    )

    const hit = useMaterialSwap(ref, plantPool)

    useCollisionDetection({
        client,
        autoRemove: false,
        bullet: ({ bullet, point, normal }) => {
            if (damagedBy.has(bullet.id)) {
                return
            }

            damagedBy.add(bullet.id)
            createLeaves({
                position: point,
                size: [.25, .25, .25],
                scale: [.5 * scale, 1.5 * scale],
                velocity: [
                    -normal[0] * 6,
                    .1,
                    -normal[2] * 6
                ],
                count: [6, 8],
            })

            if (bullet.owner === Owner.PLAYER) {
                health.decrease(25)
            }
        },
    })

    const handleDead = useEffectEvent(() => {
        createLeaves({
            position: client.position,
            size: coll.size,
            scale: [.5 * scale, 1.5 * scale],
            velocity: [1, 1, 1],
            count: [8, 12],
        })
        createLeaves({
            position: client.position,
            size: [.25, .25, .25],
            scale: [2 * scale, 3 * scale],
            velocity: [1, 1.5, 1.5],
            count: [4, 6],
        })
        removeEntities([id])
    })

    useEffect(() => {
        return health.onChange(value => {
            hit()

            if (value === 0) {
                handleDead()
            }
        })
    }, [health, hit])

    return (
        <>
            <PlantModel
                ref={ref}
                scale={scale}
                position={[x, y, z]}
                rotation-y={rotation}
            />
            <Hitbox
                position={client.position}
                size={client.size}
            />
        </>
    )
}

export default memo(Plant)
