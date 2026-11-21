import { memo, useEffect, useEffectEvent, useMemo, useRef } from "react"
import Hitbox from "@components/hitbox"
import { createLeaves } from "@components/effects/leaf/leaf-mesh"
import { removeEntities } from "@lib/store"
import { useCollisionDetection } from "@src/hooks/use-collision-detection"
import { useGridClient } from "@src/hooks/use-grid-client"
import { Owner } from "@src/types/bullet"
import { EntityType, PlantEntity } from "@src/types/entity"
import PlantModel, { PlantModelRef } from "./plant-model"
import { getCollisionBox } from "@lib/world/bounding-boxes"

const coll = getCollisionBox("plant", 0)

export const crownColor = "#60c439"

function Plant({
    id,
    health,
    scale,
    rotation,
    position: [x, y, z],
}: PlantEntity) {
    const ref = useRef<PlantModelRef>(null)
    const damagedBy = useMemo(() => new Set<string>(), [])
    const client = useGridClient(
        [x, y + coll.offset[1], z],
        coll.size,
        { id, type: EntityType.PLANT }
    )

    useCollisionDetection({
        client,
        autoRemove: false,
        bullet: ({ bullet, point, normal }) => {
            if (damagedBy.has(bullet.id)) {
                return
            }

            damagedBy.add(bullet.id)
            ref.current?.hit(normal)
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
            ref.current?.flash()

            if (value === 0) {
                handleDead()
            }
        })
    }, [health])

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
